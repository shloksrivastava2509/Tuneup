import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { backupsDir } from './paths.js'
import type { Plan } from './plan.js'

export type Manifest = {
  version: 1
  createdAt: string
  projectDir: string
  profile: string
  // `writtenHash` is the file as the run left it, so undo can tell a later edit by the user.
  files: { path: string; existed: boolean; writtenHash: string }[]
  plugins: { id: string; installed: boolean }[]
  // Marketplaces this run registered with Claude Code, which undo removes again.
  marketplaces: string[]
  undoneAt?: string
}

export const MANIFEST = 'manifest.json'

export const hashFile = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex')

export const saveManifest = (dir: string, manifest: Manifest): void =>
  writeFileSync(join(dir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`)

export const copyInto = (from: string, to: string): void => {
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
}

// Copies every file the plan touches, byte for byte, and writes the manifest before anything changes.
export const createBackup = (home: string, projectDir: string, profile: string, plan: Plan, now: Date) => {
  // No ":" in the folder name: Windows does not allow it.
  const stamp = now.toISOString().replace(/[:.]/g, '-')
  let dir = join(backupsDir(home), stamp)
  for (let n = 2; existsSync(dir); n++) {
    dir = join(backupsDir(home), `${stamp}-${n}`)
  }
  mkdirSync(dir, { recursive: true })

  const manifest: Manifest = {
    version: 1,
    createdAt: now.toISOString(),
    projectDir,
    profile,
    files: plan.changes.map(change => ({ path: change.path, existed: change.before !== null, writtenHash: '' })),
    plugins: plan.plugins.map(id => ({ id, installed: false })),
    marketplaces: [],
  }
  for (const file of manifest.files) {
    if (file.existed) {
      copyInto(join(projectDir, file.path), join(dir, 'files', file.path))
    }
  }
  saveManifest(dir, manifest)

  return { dir, manifest }
}

// The newest backup of this project that has not been undone.
export const latestBackup = (home: string, projectDir: string): { dir: string; manifest: Manifest } | null => {
  const root = backupsDir(home)
  if (!existsSync(root)) {
    return null
  }
  for (const name of readdirSync(root).sort().reverse()) {
    const dir = join(root, name)
    if (!existsSync(join(dir, MANIFEST))) {
      continue
    }
    const manifest = JSON.parse(readFileSync(join(dir, MANIFEST), 'utf8')) as Manifest
    if (manifest.projectDir === projectDir && manifest.undoneAt === undefined) {
      return { dir, manifest }
    }
  }

  return null
}
