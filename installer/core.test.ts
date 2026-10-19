import assert from 'node:assert/strict'
import { test } from 'node:test'

import { compareVersions, loadCatalog, loadProfiles, resolveFeatures } from './catalog.js'
import { END, START, deepMerge, mergeSettings, upsertBlock } from './merge.js'
import { packageRoot } from './paths.js'
import { buildPlan } from './plan.js'
import { diffLines } from './preview.js'

const root = packageRoot()
const catalog = loadCatalog(root)
const budget = loadProfiles(root).find(profile => profile.id === 'web-solo-budget')
assert.ok(budget)
const templates = { 'templates/CLAUDE.md': '## Tuneup\n\n- one\n' }
const planFor = (files: { [path: string]: string | null }, version = '2.1.296') =>
  buildPlan({ profile: budget, resolved: resolveFeatures(budget, catalog, version), files, templates })

test('deepMerge keeps user keys, unions arrays and lets the profile set scalars', () => {
  const user = { model: 'opus', env: { A: '1' }, permissions: { allow: ['Bash(ls)', 'Bash(git status)'], deny: ['Read(./.env)'] } }
  const patch = { model: 'sonnet', permissions: { allow: ['Bash(git status)', 'Bash(npm test)'] } }

  assert.deepEqual(deepMerge(user, patch), {
    model: 'sonnet',
    env: { A: '1' },
    permissions: { allow: ['Bash(ls)', 'Bash(git status)', 'Bash(npm test)'], deny: ['Read(./.env)'] },
  })
})

test('mergeSettings refuses a file it cannot parse', () => {
  assert.throws(() => mergeSettings('{ "model": ', {}, '.claude/settings.json'), /not valid JSON/)
  assert.throws(() => mergeSettings('[]', {}, '.claude/settings.json'), /JSON object/)
  assert.equal(mergeSettings(null, { model: 'sonnet' }, 'x'), '{\n  "model": "sonnet"\n}\n')
})

test('upsertBlock appends once, then only rewrites between the markers', () => {
  const mine = '# My project\n\nMy own notes.\n'
  const first = upsertBlock(mine, 'one')
  assert.equal(first, `${mine}\n${START}\none\n${END}\n`)
  assert.equal(upsertBlock(first, 'one'), first)

  const edited = first.replace('My own notes.', 'Changed by me.') + '\nA line after the block.\n'
  const second = upsertBlock(edited, 'two\nlines')
  assert.equal(second, edited.replace(`${START}\none\n${END}`, `${START}\ntwo\nlines\n${END}`))
})

test('upsertBlock keeps CRLF files CRLF and rejects a lone marker', () => {
  assert.equal(upsertBlock('a\r\n', 'x\ny'), `a\r\n\r\n${START}\r\nx\r\ny\r\n${END}\r\n`)
  assert.throws(() => upsertBlock(`a\n${START}\n`, 'x'), /one tuneup marker/)
  assert.equal(upsertBlock(null, 'x'), `${START}\nx\n${END}\n`)
})

test('versions compare by number, not by text', () => {
  assert.ok(compareVersions('2.1.296', '2.1.287') > 0)
  assert.ok(compareVersions('2.1.99', '2.1.287') < 0)
  assert.equal(compareVersions('2.1.287', '2.1.287'), 0)
})

test('every catalog entry has a minVersion and every profile resolves', () => {
  for (const feature of catalog) {
    assert.match(feature.minVersion, /^\d+\.\d+\.\d+$/)
  }
  const profiles = loadProfiles(root)
  assert.deepEqual(profiles.map(profile => profile.id), ['token-info', 'web-solo-budget', 'web-solo-speed'])
  for (const profile of profiles) {
    assert.equal(resolveFeatures(profile, catalog, '2.1.296').skipped.length, 0)
  }
})

test('a feature newer than the installed Claude Code is skipped and said so', () => {
  const plan = planFor({}, '2.1.200')

  assert.deepEqual(plan.plugins, [])
  assert.match(plan.notes.join('\n'), /Skipped dashboard-mod: needs Claude Code 2\.1\.287, found 2\.1\.200/)
})

test('a fresh project gets settings, a CLAUDE.md block and the plugin', () => {
  const plan = planFor({})

  assert.deepEqual(plan.changes.map(change => [change.path, change.before]), [
    ['.claude/settings.json', null],
    ['CLAUDE.md', null],
  ])
  assert.equal(JSON.parse(plan.changes[0]!.after).model, 'sonnet')
  assert.deepEqual(plan.plugins, ['token-info@tuneup'])
  assert.equal(plan.alwaysLoadedChars, plan.changes[1]!.after.length)
})

test('a project on AGENTS.md alone gets no CLAUDE.md', () => {
  const plan = planFor({ 'AGENTS.md': '# Agents\n' })

  assert.deepEqual(plan.changes.map(change => change.path), ['.claude/settings.json'])
  assert.match(plan.notes.join('\n'), /AGENTS\.md/)
})

test('planning twice changes nothing the second time', () => {
  const first = planFor({ 'CLAUDE.md': '# Mine\n' })
  const files = Object.fromEntries(first.changes.map(change => [change.path, change.after]))

  assert.deepEqual(planFor(files).changes, [])
})

test('the diff marks added and removed lines', () => {
  assert.deepEqual(diffLines('a\nb\nc\n', 'a\nx\nc\nd\n'), ['  a', '- b', '+ x', '  c', '+ d'])
  assert.deepEqual(diffLines(null, 'a\n'), ['+ a'])
})

test('the Token info profile installs only the mod, and creates no settings file', () => {
  const tokenInfo = loadProfiles(root).find(profile => profile.id === 'token-info')
  assert.ok(tokenInfo)
  const plan = buildPlan({ profile: tokenInfo, resolved: resolveFeatures(tokenInfo, catalog, '2.1.296'), files: {}, templates })

  assert.deepEqual(plan.changes, [])
  assert.deepEqual(plan.plugins, ['token-info@tuneup'])
  assert.equal(plan.alwaysLoadedChars, 0)
})
