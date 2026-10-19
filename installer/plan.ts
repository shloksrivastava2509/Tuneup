import type { Profile, Resolved } from './catalog.js'
import { deepMerge, mergeSettings, upsertBlock } from './merge.js'
import type { Json } from './merge.js'
import { AGENTS_MD, CLAUDE_MD, SETTINGS } from './paths.js'

// One file the run would create or change; `before` is null for a file that does not exist yet.
export type Change = { path: string; before: string | null; after: string }

export type Plan = {
  changes: Change[]
  plugins: string[]
  notes: string[]
  // Characters added to files Claude Code loads on every request.
  alwaysLoadedChars: number
}

export type PlanInput = {
  profile: Profile
  resolved: Resolved
  // Current text of the project's files by relative path; null when absent.
  files: { [path: string]: string | null }
  // Template text by the path the catalog names.
  templates: { [path: string]: string }
}

export const buildPlan = ({ profile, resolved, files, templates }: PlanInput): Plan => {
  const plan: Plan = { changes: [], plugins: [], notes: [], alwaysLoadedChars: 0 }
  let settings: Json = profile.settings
  let block: string | null = null

  for (const { feature, reason } of resolved.skipped) {
    plan.notes.push(`Skipped ${feature.id}: ${reason}.`)
  }
  for (const { install } of resolved.enabled) {
    if ('plugin' in install) {
      plan.plugins.push(install.plugin)
    } else if ('settings' in install) {
      settings = deepMerge(settings, install.settings)
    } else {
      const template = templates[install.claudeMd]
      if (template === undefined) {
        throw new Error(`template ${install.claudeMd} is missing`)
      }
      block = template
    }
  }

  const change = (path: string, after: string) => {
    const before = files[path] ?? null
    if (before !== after) {
      plan.changes.push({ path, before, after })
    }

    return after.length - (before?.length ?? 0)
  }

  // A profile with no settings leaves a project without a settings file alone.
  const hasSettings = typeof settings === 'object' && settings !== null && Object.keys(settings).length > 0
  if (hasSettings || (files[SETTINGS] ?? null) !== null) {
    change(SETTINGS, mergeSettings(files[SETTINGS] ?? null, settings, SETTINGS))
  }
  if (block !== null) {
    const hasClaudeMd = (files[CLAUDE_MD] ?? null) !== null
    if (!hasClaudeMd && (files[AGENTS_MD] ?? null) !== null) {
      plan.notes.push('This project uses AGENTS.md and has no CLAUDE.md, so no CLAUDE.md was created.')
    } else {
      plan.alwaysLoadedChars += Math.max(0, change(CLAUDE_MD, upsertBlock(files[CLAUDE_MD] ?? null, block)))
    }
  }

  return plan
}
