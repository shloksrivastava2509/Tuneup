import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import type { Run } from './claude.js'
import { main } from './cli.js'
import type { Deps } from './cli.js'

const SETTINGS = join('.claude', 'settings.json')

// A project folder and a tuneup home of the test's own, and a `claude` that only records its calls.
const sandbox = (files: { [path: string]: string | Buffer } = {}, version: string | null = '2.1.296', known: string[] = []) => {
  const cwd = mkdtempSync(join(tmpdir(), 'tuneup-project-'))
  const home = mkdtempSync(join(tmpdir(), 'tuneup-home-'))
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(cwd, path, '..'), { recursive: true })
    writeFileSync(join(cwd, path), content)
  }
  const calls: string[] = []
  const lines: string[] = []
  const marketplaces = new Set(known)
  const run: Run = (args, dir) => {
    calls.push(args.join(' '))
    if (args[1] === 'marketplace') {
      if (args[2] === 'add') {
        marketplaces.add('tuneup')
      }

      return { ok: true, output: args[2] === 'list' ? JSON.stringify([...marketplaces].map(name => ({ name }))) : '' }
    }
    if (args[0] === '--version') {
      return version === null ? { ok: false, output: 'command not found' } : { ok: true, output: `${version} (Claude Code)` }
    }
    // As the real CLI does at project scope, installing and uninstalling rewrite .claude/settings.json.
    if (args[1] === 'install' || args[1] === 'uninstall') {
      const path = join(dir, SETTINGS)
      const settings = JSON.parse(readFileSync(path, 'utf8'))
      settings.enabledPlugins = args[1] === 'install' ? { [args[2]!]: true } : {}
      writeFileSync(path, JSON.stringify(settings, null, 2))
    }

    return { ok: true, output: '' }
  }
  const deps: Deps = { cwd, env: { TUNEUP_HOME: home }, run, out: line => lines.push(line), ask: null, now: () => new Date() }
  // Every file under the project with its bytes, and every folder, to compare before and after.
  const snapshot = () =>
    Object.fromEntries(
      readdirSync(cwd, { recursive: true, withFileTypes: true })
        .map(entry => [join(entry.parentPath, entry.name), entry.isFile()] as const)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, isFile]) => [path.slice(cwd.length), isFile ? readFileSync(path).toString('base64') : 'dir']),
    )

  return { cwd, home, deps, calls, lines, snapshot, text: (path: string) => readFileSync(join(cwd, path), 'utf8') }
}

test('a dry run prints the preview and writes nothing', async () => {
  const box = sandbox({ 'CLAUDE.md': '# Mine\n' })
  const before = box.snapshot()

  assert.equal(await main(['--profile', 'web-solo-budget', '--dry-run'], box.deps), 0)
  assert.deepEqual(box.snapshot(), before)
  assert.equal(existsSync(join(box.home, 'backups')), false)
  assert.match(box.lines.join('\n'), /create \.claude[\\/]settings\.json/)
  assert.match(box.lines.join('\n'), /Always-loaded context added: about \d+ tokens/)
  assert.deepEqual(box.calls, ['--version'])
})

test('install then undo leaves an existing project byte for byte as it was', async () => {
  const box = sandbox({
    'CLAUDE.md': '# Mine\r\n\r\nNotes with CRLF.\r\n',
    [SETTINGS]: Buffer.from('﻿{ "model": "opus",\n    "permissions": { "allow": ["Bash(ls)"] } }', 'utf8').subarray(3),
    'src/app.ts': 'export {}\n',
  })
  const before = box.snapshot()

  assert.equal(await main(['--profile', 'web-solo-speed', '--yes'], box.deps), 0)
  const settings = JSON.parse(box.text(SETTINGS))
  assert.equal(settings.effortLevel, 'high')
  assert.ok(settings.permissions.allow.includes('Bash(ls)'))
  assert.ok(settings.permissions.allow.includes('Bash(git status)'))
  assert.deepEqual(settings.enabledPlugins, { 'tuneup-dashboard@tuneup': true })
  assert.ok(box.text('CLAUDE.md').startsWith('# Mine\r\n\r\nNotes with CRLF.\r\n'))
  assert.match(box.text('CLAUDE.md'), /<!-- tuneup:start -->\r\n[\s\S]+<!-- tuneup:end -->\r\n$/)
  assert.ok(box.calls.some(call => call.startsWith('plugin marketplace add ') && call.endsWith('--scope project')))
  assert.ok(box.calls.includes('plugin install tuneup-dashboard@tuneup --scope project'))

  assert.equal(await main(['undo'], box.deps), 0)
  assert.deepEqual(box.snapshot(), before)
  assert.ok(box.calls.includes('plugin uninstall tuneup-dashboard@tuneup --scope project'))
  assert.doesNotMatch(box.lines.join('\n'), /edited after tuneup ran/)

  assert.equal(await main(['undo'], box.deps), 1)
})

test('undo removes the files and the folder a run created', async () => {
  const box = sandbox({ 'README.md': 'hi\n' })
  const before = box.snapshot()

  assert.equal(await main(['--profile', 'web-solo-budget', '-y'], box.deps), 0)
  assert.ok(existsSync(join(box.cwd, SETTINGS)))
  assert.ok(existsSync(join(box.cwd, 'CLAUDE.md')))

  assert.equal(await main(['undo'], box.deps), 0)
  assert.deepEqual(box.snapshot(), before)
  assert.equal(existsSync(join(box.cwd, '.claude')), false)
  assert.ok(box.calls.includes('plugin marketplace remove tuneup'))
})

test('undo leaves a marketplace that was registered before the run', async () => {
  const box = sandbox({}, '2.1.296', ['tuneup'])
  await main(['--profile', 'web-solo-budget', '-y'], box.deps)

  assert.equal(await main(['undo'], box.deps), 0)
  assert.equal(box.calls.includes('plugin marketplace remove tuneup'), false)
})

test('undo keeps a copy of a file the user edited after the run', async () => {
  const box = sandbox({ 'CLAUDE.md': '# Mine\n' })
  await main(['--profile', 'web-solo-budget', '-y'], box.deps)
  writeFileSync(join(box.cwd, 'CLAUDE.md'), `${box.text('CLAUDE.md')}\nWritten after tuneup.\n`)

  assert.equal(await main(['undo'], box.deps), 0)
  assert.equal(box.text('CLAUDE.md'), '# Mine\n')
  const [backup] = readdirSync(join(box.home, 'backups'))
  assert.match(readFileSync(join(box.home, 'backups', backup!, 'before-undo', 'CLAUDE.md'), 'utf8'), /Written after tuneup\./)
})

test('a second run changes no file', async () => {
  const box = sandbox()
  await main(['--profile', 'web-solo-budget', '-y'], box.deps)
  const after = box.snapshot()

  box.lines.length = 0
  assert.equal(await main(['--profile', 'web-solo-budget', '--dry-run'], box.deps), 0)
  assert.deepEqual(box.snapshot(), after)
  assert.match(box.lines.join('\n'), /No file changes/)
})

test('broken settings, a missing Claude Code and a missing answer all stop before any write', async () => {
  const broken = sandbox({ [SETTINGS]: '{ "model": ' })
  const before = broken.snapshot()
  assert.equal(await main(['--profile', 'web-solo-budget', '-y'], broken.deps), 1)
  assert.deepEqual(broken.snapshot(), before)
  assert.match(broken.lines.join('\n'), /not valid JSON/)

  const absent = sandbox({}, null)
  assert.equal(await main(['--profile', 'web-solo-budget', '-y'], absent.deps), 1)
  assert.match(absent.lines.join('\n'), /Claude Code was not found/)

  const silent = sandbox()
  assert.equal(await main([], silent.deps), 1)
  assert.match(silent.lines.join('\n'), /Pass --profile/)
  assert.equal(await main(['--profile', 'web-solo-budget'], silent.deps), 1)
  assert.equal(existsSync(join(silent.cwd, '.claude')), false)
})

test('an older Claude Code gets the config without the mod', async () => {
  const box = sandbox({}, '2.1.200')

  assert.equal(await main(['--profile', 'web-solo-budget', '-y'], box.deps), 0)
  assert.equal(box.calls.some(call => call.startsWith('plugin')), false)
  assert.match(box.lines.join('\n'), /Skipped dashboard-mod/)
})
