import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The package root, whether this runs from installer/ (tests) or dist/installer/ (published).
export const packageRoot = (): string => {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir)
    if (parent === dir) {
      throw new Error('tuneup: package.json not found above the installer')
    }
    dir = parent
  }

  return dir
}

export const tuneupHome = (env: NodeJS.ProcessEnv = process.env): string =>
  env.TUNEUP_HOME ?? join(homedir(), '.tuneup')

export const backupsDir = (home: string): string => join(home, 'backups')

export const SETTINGS = join('.claude', 'settings.json')
export const CLAUDE_MD = 'CLAUDE.md'
export const AGENTS_MD = 'AGENTS.md'
