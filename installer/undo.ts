import { existsSync, readdirSync, rmSync, rmdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { copyInto, hashFile, latestBackup, saveManifest } from './backup.js'
import type { Run } from './claude.js'

export type UndoResult = { dir: string; restored: string[]; removed: string[]; kept: string[]; warnings: string[] } | null

// Puts back the newest backup of this project. A file changed since the run is copied aside first.
export const undo = (home: string, projectDir: string, run: Run, now: Date): UndoResult => {
  const found = latestBackup(home, projectDir)
  if (found === null) {
    return null
  }
  const { dir, manifest } = found
  const result = { dir, restored: [] as string[], removed: [] as string[], kept: [] as string[], warnings: [] as string[] }

  const edited = manifest.files.filter(file => {
    const path = join(projectDir, file.path)

    return existsSync(path) && file.writtenHash !== '' && hashFile(path) !== file.writtenHash
  })
  for (const file of edited) {
    copyInto(join(projectDir, file.path), join(dir, 'before-undo', file.path))
    result.kept.push(file.path)
  }

  for (const plugin of manifest.plugins) {
    if (plugin.installed) {
      const removed = run(['plugin', 'uninstall', plugin.id, '--scope', 'project'], projectDir)
      if (!removed.ok) {
        result.warnings.push(`Could not uninstall ${plugin.id}: ${removed.output}`)
      }
    }
  }

  for (const name of manifest.marketplaces ?? []) {
    const removed = run(['plugin', 'marketplace', 'remove', name], projectDir)
    if (!removed.ok) {
      result.warnings.push(`Could not remove the ${name} marketplace: ${removed.output}`)
    }
  }

  for (const file of manifest.files) {
    const path = join(projectDir, file.path)
    if (file.existed) {
      copyInto(join(dir, 'files', file.path), path)
      result.restored.push(file.path)
    } else {
      rmSync(path, { force: true })
      // A folder the run made, such as .claude, goes when nothing else is in it.
      const parent = dirname(path)
      if (parent !== projectDir && existsSync(parent) && readdirSync(parent).length === 0) {
        rmdirSync(parent)
      }
      result.removed.push(file.path)
    }
  }

  saveManifest(dir, { ...manifest, undoneAt: now.toISOString() })

  return result
}
