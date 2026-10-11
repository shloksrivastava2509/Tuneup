import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Totals } from '../types'

const ROOT = '/work/app'
const NOON = new Date(2026, 9, 11, 12).getTime()
const USAGE = {
  input_tokens: 1000,
  output_tokens: 400,
  cache_read_input_tokens: 7000,
  cache_creation_input_tokens: 2000,
  model: 'test-model',
}
const PANE = { plugin: 'tuneup-dashboard', component: 'Pane', requestId: 'tokens' } as const
const PROPS = {
  title: 'Tokens',
  isFocused: true,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
} as const

type World = { entries?: Record<string, unknown>; usd?: () => number; surfaces?: ('terminal' | 'desktop')[] }

// The engine beneath the mod: each call the mod makes is answered from here.
const world = (on: On, { entries = {}, usd = () => 0, surfaces = ['terminal'] }: World = {}) => {
  // A store of the test's own, so a test reads and writes it as another session would.
  const store = new Map<string, unknown>(Object.entries(entries))
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)

    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...store.keys()] }))
  mock.clock(on, { now: NOON })
  on('session.root', () => ({ value: ROOT }))
  on('session.surfaces', () => ({ value: surfaces }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200_000 }, rateLimits: [], cost: { usd: usd() } },
  }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.end', () => ({ sessionId: 's1' }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('classic.SessionStart', () => ({}))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage: USAGE }
  })

  return store
}

const start = ($: Engine) => $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true })

const step = async ($: Engine, agentId?: string) => {
  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'test-model', messageCount: 1, agentId })
  for await (const _ of stream) {
    // drained
  }
  await stream.result
}

const complete = ($: Engine, agentId?: string) =>
  $.turn.complete({ answer: 'ok', durationMs: 42_000, isAborted: false, turnId: 't1', reason: 'answer', usage: USAGE, agentId })

const tokens = ($: Engine) =>
  $.command.run({
    command: 'tokens',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  })

const stored = (store: Map<string, unknown>, key: string) => store.get(key) as Totals

test('a main turn ends with a receipt', async ($, on) => {
  world(on)
  await start($)
  await step($)

  expect((await complete($)).text).toBe('Done in 42s · 10.4k tokens · 70% from cache')
})

test("a subagent's turn and an interrupted turn get no receipt", async ($, on) => {
  world(on)
  await start($)

  expect((await complete($, 'agent-1')).text).toBe('ok')
  expect(
    (await $.turn.complete({ answer: '', durationMs: 5, isAborted: true, turnId: 't2', reason: 'aborted' })).text,
  ).toBe('')
})

test('usage is saved per project and per day, split by main and subagent', async ($, on) => {
  const store = world(on)
  await start($)
  await step($)
  await step($, 'agent-1')
  await complete($)

  const project = stored(store, `project:${ROOT}`)
  expect(project.main).toEqual({ input: 1000, output: 400, cacheRead: 7000, cacheWrite: 2000 })
  expect(project.sub).toEqual(project.main)
  expect(project.turns).toBe(1)
  expect(stored(store, `day:${ROOT}:2026-10-11`)).toEqual(project)
})

test('a write adds to what another session saved meanwhile', async ($, on) => {
  const before = { main: { input: 5, output: 5, cacheRead: 5, cacheWrite: 5 }, sub: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, usd: 1, turns: 3 }
  const store = world(on, { entries: { [`project:${ROOT}`]: before } })
  await start($)
  await step($)
  store.set(`project:${ROOT}`, { ...before, turns: 4 })
  await complete($)

  const project = stored(store, `project:${ROOT}`)
  expect(project.turns).toBe(5)
  expect(project.main.input).toBe(1005)
})

test('only cost spent after the session was first seen is added to the project', async ($, on) => {
  let usd = 2
  const store = world(on, { usd: () => usd })
  await start($)
  usd = 2.5
  await $.session.measure({ context: { window: 200_000 }, rateLimits: [], cost: { usd }, changed: ['cost'] })

  expect((stored(store, `project:${ROOT}`)).usd).toBe(0.5)
})

test('the pane draws on terminal and desktop and switches tabs', async ($, on) => {
  const other = { main: { input: 50_000, output: 0, cacheRead: 0, cacheWrite: 0 }, sub: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, usd: 0, turns: 9 }
  world(on, { entries: { 'project:/work/other': other } })
  await start($)
  await step($)
  await complete($)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface, props: PROPS })
    expect((await ui.find({ key: 'session' }))?.props.label).toBe('[This session]')
    expect(await ui.find({ type: 'Text', text: '10.4k' })).toBeDefined()

    await ui.press({ key: 'all' })
    expect((await ui.find({ key: 'all' }))?.props.label).toBe('[All projects]')
    expect(await ui.find({ type: 'Text', text: '60.4k' })).toBeDefined()

    await ui.press({ key: 'session' })
    await ui.unmount()
  }
})

test('/tokens opens the pane and leaves no text for the model', async ($, on) => {
  world(on)
  await start($)

  expect(await tokens($)).toEqual({})
})

test('/tokens answers in text where nothing can draw', async ($, on) => {
  world(on, { surfaces: [] })
  await start($)
  await step($)
  await complete($)

  const { text } = await tokens($)
  expect(text).toContain('This session: Input 1.0k')
  expect(text).toContain('This project: Input 1.0k')
})
