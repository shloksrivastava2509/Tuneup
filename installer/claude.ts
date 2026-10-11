import { spawnSync } from 'node:child_process'

export type RunResult = { ok: boolean; output: string }

// Runs the `claude` CLI with these arguments in this directory.
export type Run = (args: string[], cwd: string) => RunResult

export const runClaude: Run = (args, cwd) => {
  // On Windows `claude` is a .cmd shim, which only a shell resolves.
  const isWindows = process.platform === 'win32'
  const result = spawnSync('claude', isWindows ? args.map(arg => (/\s/.test(arg) ? `"${arg}"` : arg)) : args, {
    cwd,
    encoding: 'utf8',
    shell: isWindows,
  })

  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() }
}

export const claudeVersion = (run: Run, cwd: string): string | null => {
  const result = run(['--version'], cwd)

  return result.ok ? (/\d+\.\d+\.\d+/.exec(result.output)?.[0] ?? null) : null
}

// The names of the marketplaces Claude Code knows; null when they cannot be listed.
export const knownMarketplaces = (run: Run, cwd: string): string[] | null => {
  const result = run(['plugin', 'marketplace', 'list', '--json'], cwd)
  try {
    const list = JSON.parse(result.output) as { name: string }[]

    return result.ok ? list.map(one => one.name) : null
  } catch {
    return null
  }
}
