import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { createBackup, hashFile, saveManifest } from './backup.js'
import { knownMarketplaces } from './claude.js'
import type { Run } from './claude.js'
import type { Plan } from './plan.js'

export type ApplyInput = {
  home: string
  projectDir: string
  profile: string
  plan: Plan
  // Where the tuneup marketplace is: a path, a git URL or owner/repo.
  marketplace: string
  run: Run
  now: Date
}

export const apply = ({ home, projectDir, profile, plan, marketplace, run, now }: ApplyInput) => {
  const { dir, manifest } = createBackup(home, projectDir, profile, plan, now)
  const warnings: string[] = []

  for (const change of plan.changes) {
    const path = join(projectDir, change.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, change.after)
  }

  if (manifest.plugins.length > 0) {
    const before = knownMarketplaces(run, projectDir)
    const added = run(['plugin', 'marketplace', 'add', marketplace, '--scope', 'project'], projectDir)
    if (!added.ok) {
      warnings.push(`Could not add the tuneup marketplace: ${added.output}`)
    } else if (before !== null) {
      // Saved at once, so an undo after a failed install still removes what was registered.
      manifest.marketplaces = (knownMarketplaces(run, projectDir) ?? []).filter(name => !before.includes(name))
      saveManifest(dir, manifest)
    }
    for (const plugin of manifest.plugins) {
      const installed = added.ok ? run(['plugin', 'install', plugin.id, '--scope', 'project'], projectDir) : added
      plugin.installed = installed.ok
      if (added.ok && !installed.ok) {
        warnings.push(`Could not install ${plugin.id}: ${installed.output}`)
      }
    }
  }

  // Hashed last: installing a plugin at project scope also writes .claude/settings.json.
  for (const file of manifest.files) {
    file.writtenHash = hashFile(join(projectDir, file.path))
  }
  saveManifest(dir, manifest)

  return { dir, manifest, warnings }
}
