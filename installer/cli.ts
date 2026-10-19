import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import { apply } from './apply.js'
import { loadCatalog, loadProfiles, resolveFeatures } from './catalog.js'
import type { Profile } from './catalog.js'
import { claudeVersion } from './claude.js'
import type { Run } from './claude.js'
import { AGENTS_MD, CLAUDE_MD, SETTINGS, packageRoot, tuneupHome } from './paths.js'
import { buildPlan } from './plan.js'
import { renderPreview } from './preview.js'
import { undo } from './undo.js'

export type Deps = {
  cwd: string
  env: NodeJS.ProcessEnv
  run: Run
  out: (line: string) => void
  // Asks the person a question; null when nobody can answer (not a terminal).
  ask: ((question: string) => Promise<string>) | null
  now: () => Date
}

const USAGE = `Usage: tuneup [undo] [options]

  tuneup                 Preview and apply a profile to the project in this folder
  tuneup undo            Restore this project's most recent tuneup backup

Options:
  --profile <id>         Profile to apply (asked when left out)
  --dry-run              Show what would change and stop
  -y, --yes              Apply without asking
  --marketplace <src>    Where the tuneup plugin marketplace is (path, git URL or owner/repo)
  -h, --help             Show this help`

const read = (path: string): string | null => (existsSync(path) ? readFileSync(path, 'utf8') : null)

const pickProfile = async (profiles: Profile[], wanted: string | undefined, { out, ask }: Deps): Promise<Profile> => {
  const list = profiles.map((profile, i) => `  ${i + 1}. ${profile.id}: ${profile.title}`).join('\n')
  if (wanted !== undefined) {
    const profile = profiles.find(one => one.id === wanted)
    if (!profile) {
      throw new Error(`No profile named "${wanted}". Profiles:\n${list}`)
    }

    return profile
  }
  if (ask === null) {
    throw new Error(`Pass --profile <id>. Profiles:\n${list}`)
  }
  out(`Profiles:\n${list}`)
  const answer = (await ask(`Which profile? [1-${profiles.length}] `)).trim()
  const profile = profiles[Number(answer) - 1] ?? profiles.find(one => one.id === answer)
  if (!profile) {
    throw new Error(`"${answer}" is not one of the profiles.`)
  }

  return profile
}

const runUndo = (deps: Deps): number => {
  const result = undo(tuneupHome(deps.env), deps.cwd, deps.run, deps.now())
  if (result === null) {
    deps.out('No tuneup backup of this project is left to undo.')

    return 1
  }
  for (const path of result.restored) {
    deps.out(`restored ${path}`)
  }
  for (const path of result.removed) {
    deps.out(`removed ${path}`)
  }
  for (const path of result.kept) {
    deps.out(`${path} was edited after tuneup ran; that version is kept in ${join(result.dir, 'before-undo', path)}`)
  }
  for (const warning of result.warnings) {
    deps.out(`warning: ${warning}`)
  }

  return 0
}

const runInstall = async (flags: { profile?: string; dryRun: boolean; yes: boolean; marketplace?: string }, deps: Deps) => {
  const { cwd, env, run, out, ask } = deps
  const version = claudeVersion(run, cwd)
  if (version === null) {
    throw new Error('Claude Code was not found (`claude --version` failed). Install it, then run tuneup again.')
  }
  const root = packageRoot()
  const profile = await pickProfile(loadProfiles(root), flags.profile, deps)
  const resolved = resolveFeatures(profile, loadCatalog(root), version)
  const templates: { [path: string]: string } = {}
  for (const { install } of resolved.enabled) {
    if ('claudeMd' in install) {
      templates[install.claudeMd] = readFileSync(join(root, install.claudeMd), 'utf8')
    }
  }
  const plan = buildPlan({
    profile,
    resolved,
    files: Object.fromEntries([SETTINGS, CLAUDE_MD, AGENTS_MD].map(path => [path, read(join(cwd, path))])),
    templates,
  })

  out(`Claude Code ${version} · profile ${profile.id} · project ${cwd}\n`)
  out(renderPreview(plan))
  if (flags.dryRun) {
    out('\nDry run: nothing was changed.')

    return 0
  }
  if (plan.changes.length === 0 && plan.plugins.length === 0) {
    return 0
  }
  if (!flags.yes) {
    if (ask === null) {
      throw new Error('Pass --yes to apply without a prompt, or --dry-run to only look.')
    }
    if (!/^y(es)?$/i.test((await ask('\nApply these changes? [y/N] ')).trim())) {
      out('Nothing was changed.')

      return 0
    }
  }

  const done = apply({
    home: tuneupHome(env),
    projectDir: cwd,
    profile: profile.id,
    plan,
    marketplace: flags.marketplace ?? env.TUNEUP_MARKETPLACE ?? root,
    run,
    now: deps.now(),
  })
  if (done.manifest.plugins.some(plugin => plugin.installed)) {
    const checked = run(['plugin', 'validate', join(root, 'plugins', 'token-info')], cwd)
    if (!checked.ok) {
      done.warnings.push(`claude plugin validate reported a problem:\n${checked.output}`)
    }
  }
  for (const warning of done.warnings) {
    out(`warning: ${warning}`)
  }
  out(`\nDone. Backup: ${done.dir}\nUndo with: npx tuneup undo\nIn your next session, run /doctor to check the setup and /tokens to open the dashboard.`)

  return 0
}

export const main = async (argv: string[], deps: Deps): Promise<number> => {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        profile: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        yes: { type: 'boolean', short: 'y', default: false },
        marketplace: { type: 'string' },
        help: { type: 'boolean', short: 'h', default: false },
      },
    })
    const [command, ...rest] = positionals
    if (values.help) {
      deps.out(USAGE)

      return 0
    }
    if (rest.length > 0 || (command !== undefined && command !== 'undo')) {
      throw new Error(`Unknown command "${positionals.join(' ')}".\n\n${USAGE}`)
    }
    if (command === 'undo') {
      return runUndo(deps)
    }

    return await runInstall(
      { profile: values.profile, dryRun: values['dry-run'], yes: values.yes, marketplace: values.marketplace },
      deps,
    )
  } catch (error) {
    deps.out(`tuneup: ${error instanceof Error ? error.message : String(error)}`)

    return 1
  }
}
