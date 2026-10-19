import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Totals } from '../types'

const ROOT = '/work/app'
const NOON = new Date(2026, 9, 11, 12).getTime()
// The numbers of a real session: 4 input, 1.7k output, 32.3k cache read, 52.1k cache write.
const USAGE = {
  input_tokens: 4,
  output_tokens: 1700,
  cache_read_input_tokens: 32_300,
  cache_creation_input_tokens: 52_100,
}
const SEEN = { input: 4, output: 1700, cacheRead: 32_300, cacheWrite: 52_100 }
const NONE = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
const STARTED = 1_791_716_185_546

// Dollars as whole millionths, so sums of fractions compare exactly.
const micro = (dollars: number | null): number => Math.round((dollars ?? Number.NaN) * 1_000_000)
const BAND = { plugin: 'tuneup-dashboard', component: 'AbovePrompt' } as const
const PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 12,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 11 },
  view: {},
} as const
const SURFACES = ['terminal', 'desktop'] as const

type World = {
  entries?: Record<string, unknown>
  model?: string
  surfaces?: ('terminal' | 'desktop')[]
  // Collects the lines the mod logs to the transcript.
  logs?: string[]
  // When the session first started, which names its saved totals.
  startedAt?: () => number
  // Collects the toasts the mod shows.
  toasts?: string[]
}

// The engine beneath the mod: each call the mod makes is answered from here.
const world = (on: On, { entries = {}, model = 'claude-sonnet-5-5', surfaces = ['terminal'], logs = [], startedAt = () => STARTED, toasts = [] }: World = {}) => {
  // A store of the test's own, so a test reads and writes it as another session would.
  const store = new Map<string, unknown>(Object.entries(entries))
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)

    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...store.keys()] }))
  on('store.delete', (_, e) => {
    store.delete(e.key)

    return { value: undefined }
  })
  on('session.usage', () => ({
    value: { startedAt: startedAt(), context: { window: 200_000 }, rateLimits: [] },
  }))
  mock.clock(on, { now: NOON })
  on('session.root', () => ({ value: ROOT }))
  on('session.surfaces', () => ({ value: surfaces }))
  on('ui.log', (_, e) => {
    logs.push(e.text)

    return { value: undefined }
  })
  on('ui.invalidate', () => ({ value: undefined }))
  on('ui.toast', (_, e) => {
    toasts.push(e.text)

    return { value: undefined }
  })
  on('session.measure', (_, e) => ({ changed: e.changed }))
  // Claude Code's own drawing of an answer.
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return Text({ children: [e.props.text] })
  })
  // What the band holds when no mod draws in it.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)

    return Box({ key: 'empty' })
  })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.end', () => ({ sessionId: 's1' }))
  on('classic.SessionStart', () => ({}))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model } }
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
  $.turn.complete({ answer: 'ok', durationMs: 42_000, isAborted: false, turnId: 't1', reason: 'answer', usage: { ...USAGE, model: 'claude-sonnet-5-5' }, agentId })

const tokens = ($: Engine) =>
  $.command.run({
    command: 'tokens',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  })

const stored = (store: Map<string, unknown>, key: string) => store.get(key) as Totals

const band = ($: Engine, surface: 'terminal' | 'desktop', props: { hasSurvey?: boolean; bodyColumns?: number } = {}) =>
  $.ui.mount({ ...BAND, surface, props: { ...PROPS, ...props } })

// Whether the open box shows `value` somewhere, on that surface.
const shows = async ($: Engine, surface: 'terminal' | 'desktop', value: string) => {
  const ui = await band($, surface)
  const found = await ui.find({ type: 'Text', text: value })
  await ui.unmount()

  return found !== undefined
}

const RECEIPT = 'Done in 42s  ·  86.1k tokens  ·  38% from cache  ·  $0.15'
// The terminal's coin: a gold disc. The Desktop app draws an SVG coin instead.
const COIN = '\u25C9'

// Claude Code drawing an answer whose text is `text`, on that surface.
const answer = ($: Engine, surface: 'terminal' | 'desktop', text = 'ok', requestId = 'm1') =>
  $.ui.mount({ plugin: 'tuneup-dashboard', component: 'AssistantMessage', surface, requestId, props: { text, isFirstOfReply: true } })

// Every Text a drawn tree holds, in order, with its colour.
const textsOf = (node: unknown): { text: string; color: unknown }[] => {
  if (typeof node !== 'object' || node === null) {
    return []
  }
  const drawn = node as { type?: string; props?: { color?: unknown }; children?: unknown[] }
  const own = drawn.type === 'Text' ? [{ text: (drawn.children ?? []).filter(child => typeof child === 'string').join(''), color: drawn.props?.color }] : []

  return [...own, ...(drawn.children ?? []).flatMap(textsOf)]
}

type Mounted = Awaited<ReturnType<typeof answer>>

// The receipt drawn under an answer: what its Client shows, or undefined where there is none.
const receiptOf = async (ui: Mounted, id = 'm1') => {
  try {
    return textsOf(await ui.drawn({ in: `glow-${id}` }))
  } catch {
    return undefined
  }
}

// The colour the receipt's line is drawn in right now.
const lineColour = async (ui: Mounted, id = 'm1') => (await receiptOf(ui, id))?.find(text => text.text.startsWith('Done'))?.color

const measure = ($: Engine, percent: number) =>
  $.session.measure({ context: { window: 200_000, tokens: percent * 2000, percent }, rateLimits: [], changed: ['context'] })

test('the receipt is drawn under its answer with a gold coin, not the plugin name, on both surfaces', async ($, on) => {
  const logs: string[] = []
  world(on, { surfaces: ['terminal', 'desktop'], logs })
  await start($)
  await step($)

  // 32,300 / (4 + 32,300 + 52,100) = 38%; 4 x $2 + 1,700 x $10 + 32,300 x $0.10 + 52,100 x $2.50 = $0.15
  expect((await complete($)).text).toBe('ok')
  expect(logs).toEqual([])
  for (const surface of SURFACES) {
    const ui = await answer($, surface)
    const texts = await receiptOf(ui)
    expect(texts?.map(text => text.text).join(' '), surface).toContain(RECEIPT)
    // No emoji: the coin is drawn by the mod, in gold, and there is no button to draw a box.
    expect(JSON.stringify(texts), surface).not.toContain('\u{1FA99}')
    expect(await ui.find({ type: 'Button' }), surface).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'ok' }), surface).toBeDefined()
    if (surface === 'desktop') {
      const svg = await ui.find({ type: 'Svg' })
      expect(svg?.props).toMatchObject({ alt: 'Token info', width: 14, height: 14 })
      expect(String(svg?.props.source)).toContain('#E8B923')
    } else {
      expect(texts?.[0]).toEqual({ text: COIN, color: '#E8B923' })
    }
    await ui.unmount()
  }
})

test('under the pointer the receipt glows in gradually, and fades out the same way', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)

  for (const surface of SURFACES) {
    const ui = await answer($, surface)
    expect(await lineColour(ui), surface).toBe('#8b9099')

    await ui.pointer({ type: 'enter', x: 3, y: 0, in: 'glow-m1' })
    await ui.advance(80)
    const rising = await lineColour(ui)
    expect(rising, surface).not.toBe('#8b9099')
    expect(rising, surface).not.toBe('#eaf0ff')

    await ui.advance(400)
    expect(await lineColour(ui), surface).toBe('#eaf0ff')

    await ui.pointer({ type: 'leave', x: 3, y: 0, in: 'glow-m1' })
    await ui.advance(80)
    expect(await lineColour(ui), surface).not.toBe('#eaf0ff')
    await ui.advance(400)
    expect(await lineColour(ui), surface).toBe('#8b9099')
    await ui.unmount()
  }
})

test('another answer gets no receipt', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)

  const ui = await answer($, 'terminal', 'Something else entirely.', 'm2')
  expect(await receiptOf(ui, 'm2')).toBeUndefined()
  await ui.unmount()
})

test('a long answer is matched by its end, whatever its line breaks', async ($, on) => {
  world(on)
  await start($)
  await step($)
  const long = `${'word '.repeat(200)}and the\nlast   line.`
  await $.turn.complete({ answer: long, durationMs: 42_000, isAborted: false, turnId: 't1', reason: 'answer', usage: { ...USAGE, model: 'claude-sonnet-5-5' } })

  const ui = await answer($, 'desktop', long.replace(/\n/g, '\n\n'), 'm3')
  expect(await receiptOf(ui, 'm3')).toBeDefined()
  await ui.unmount()
})

test('clicking the receipt opens Token info above the prompt, and clicking again closes it', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)

  for (const surface of SURFACES) {
    const row = await answer($, surface)
    await row.pointer({ type: 'down', x: 3, y: 0, button: 'left', in: 'glow-m1' })
    await row.pointer({ type: 'up', x: 3, y: 0, button: 'left', in: 'glow-m1' })
    await row.unmount()
    const ui = await band($, surface)
    expect(await ui.find({ key: 'tokens' }), surface).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Token info' }), surface).toBeDefined()
    await ui.unmount()

    const again = await answer($, surface)
    await again.pointer({ type: 'down', x: 3, y: 0, button: 'left', in: 'glow-m1' })
    await again.pointer({ type: 'up', x: 3, y: 0, button: 'left', in: 'glow-m1' })
    await again.unmount()
    const closed = await band($, surface)
    expect(await closed.find({ key: 'tokens' }), surface).toBeUndefined()
    await closed.unmount()
  }
})

test('where nothing draws, the receipt is the text under the answer', async ($, on) => {
  world(on, { surfaces: [] })
  await start($)
  await step($)

  expect((await complete($)).text).toBe(RECEIPT)
})

test("a subagent's turn and an interrupted turn get no receipt", async ($, on) => {
  world(on)
  await start($)
  await complete($, 'agent-1')
  await $.turn.complete({ answer: '', durationMs: 5, isAborted: true, turnId: 't2', reason: 'aborted' })

  const ui = await answer($, 'terminal')
  expect(await receiptOf(ui)).toBeUndefined()
  await ui.unmount()
})

test('a toast reminds to /compact once the context passes 60%, once per filling', async ($, on) => {
  const toasts: string[] = []
  world(on, { toasts })
  await start($)

  await measure($, 55)
  expect(toasts).toEqual([])
  await measure($, 62)
  expect(toasts).toEqual(['Context is 62% full. Run /compact to keep replies fast and cheap.'])
  await measure($, 75)
  expect(toasts.length).toBe(1)

  // After /compact the context drops, and the next filling reminds again.
  await measure($, 20)
  await measure($, 64)
  expect(toasts.length).toBe(2)
})

test('Token info shows how full the context is, and flags it past 60%', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)
  await tokens($)

  await measure($, 41)
  expect(await shows($, 'terminal', '41% of 200.0k')).toBe(true)
  expect(await shows($, 'terminal', '86.1k')).toBe(true)
  await measure($, 63)
  expect(await shows($, 'desktop', '63% of 200.0k, run /compact')).toBe(true)
})

test('a model with unknown rates gets a receipt without a cost and a dash in the box', async ($, on) => {
  const store = world(on, { model: 'qwen3-coder:latest' })
  await start($)
  await step($)

  await complete($)
  const row = await answer($, 'terminal')
  expect((await receiptOf(row))?.map(text => text.text)).toEqual([COIN, 'Done in 42s  ·  86.1k tokens  ·  38% from cache'])
  await row.unmount()
  const project = stored(store, `project:${ROOT}`)
  expect(project.usd).toBe(0)
  expect(project.unpriced).toBe(86_104)
  await tokens($)
  expect(await shows($, 'terminal', '—')).toBe(true)
  expect(await shows($, 'terminal', '$0.00')).toBe(false)
})

test('nothing is drawn above the prompt until /tokens, which shows the box and then hides it', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)

  for (const surface of SURFACES) {
    const ui = await band($, surface)
    expect(await ui.find({ key: 'tokens' })).toBeUndefined()
    await ui.unmount()
  }

  expect(await tokens($)).toEqual({})
  for (const surface of SURFACES) {
    const ui = await band($, surface)
    expect(await ui.find({ key: 'tokens' })).toBeDefined()
    await ui.unmount()
  }

  expect(await tokens($)).toEqual({})
  const ui = await band($, 'terminal')
  expect(await ui.find({ key: 'tokens' })).toBeUndefined()
  await ui.unmount()
})

test('the box gives way to a survey', async ($, on) => {
  world(on)
  await start($)
  await tokens($)

  const ui = await band($, 'terminal', { hasSurvey: true })
  expect(await ui.find({ key: 'tokens' })).toBeUndefined()
  await ui.unmount()
})

test('the box is a small bordered card with the same figures as the receipt, on both surfaces', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)
  await tokens($)

  for (const surface of SURFACES) {
    const ui = await band($, surface)
    expect((await ui.find({ key: 'tokens' }))?.props).toMatchObject({ borderStyle: 'round', width: 84 })

    const tiles = (await ui.findAll({ type: 'Box' })).filter(box => box.key?.startsWith('tile-'))
    expect(tiles.map(tile => tile.key)).toEqual([
      'tile-Total tokens',
      'tile-From cache',
      'tile-API-equivalent cost',
      'tile-Turns',
    ])
    for (const tile of tiles) {
      expect(tile.props, surface).toMatchObject({ width: 19, flexShrink: 0 })
    }
    for (const value of ['86.1k', '38%', '$0.15', '1.7k', '32.3k', '52.1k']) {
      expect(await ui.find({ type: 'Text', text: value }), `${surface} ${value}`).toBeDefined()
    }
    // No padding with spaces anywhere: the Desktop app's font is proportional.
    for (const text of await ui.findAll({ type: 'Text' })) {
      expect(text.text, surface).toBe(text.text.trim())
    }
    await ui.unmount()
  }
})

test('the box never asks for more width than the band has', async ($, on) => {
  world(on)
  await start($)
  await tokens($)

  const ui = await band($, 'terminal', { bodyColumns: 60 })
  expect((await ui.find({ key: 'tokens' }))?.props.width).toBe(60)
  await ui.unmount()
})

test('a low cache share is drawn as a warning and a high one as healthy', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await complete($)
  await tokens($)

  // 38% from cache: under half.
  const ui = await band($, 'terminal')
  expect((await ui.find({ type: 'Text', text: '38%' }))?.props.color).toBe('yellow')
  await ui.unmount()
})

test('tabs are plain buttons, only the inactive ones are dim, and they switch the figures', async ($, on) => {
  const other = { main: { input: 50_000, output: 0, cacheRead: 0, cacheWrite: 0 }, sub: NONE, usd: 0, unpriced: 0, turns: 9 }
  world(on, { entries: { 'project:/work/other': other } })
  await start($)
  await step($)
  await complete($)
  await tokens($)

  for (const surface of SURFACES) {
    const ui = await band($, surface)
    const tab = async (key: string) => (await ui.find({ key }))?.props
    expect(await tab('session')).toMatchObject({ label: 'This session', plain: true, dimColor: false })
    expect(await tab('project')).toMatchObject({ label: 'This project', plain: true, dimColor: true })
    expect(await tab('all')).toMatchObject({ label: 'All projects', plain: true, dimColor: true })
    expect((await ui.findAll({ type: 'Button' })).some(button => String(button.props.label).includes('['))).toBe(false)

    await ui.press({ key: 'all' })
    expect(await tab('session')).toMatchObject({ dimColor: true })
    expect(await tab('all')).toMatchObject({ dimColor: false })
    expect(await ui.find({ type: 'Text', text: '136.1k' })).toBeDefined()

    await ui.press({ key: 'session' })
    await ui.unmount()
  }
})

test('the uncached input figure says so', async ($, on) => {
  world(on)
  await start($)
  await step($)
  await tokens($)
  const ui = await band($, 'terminal')

  const labels = (await ui.findAll({ type: 'Text' })).map(text => text.text)
  expect(labels).toContain('Input (uncached)')
  expect(labels).not.toContain('Input')
  await ui.unmount()
})

test('usage is saved per project and per day, split by main and subagent', async ($, on) => {
  const store = world(on)
  await start($)
  await step($)
  await step($, 'agent-1')
  await complete($)

  const project = stored(store, `project:${ROOT}`)
  expect(project.main).toEqual(SEEN)
  expect(project.sub).toEqual(SEEN)
  expect(project.turns).toBe(1)
  expect(stored(store, `day:${ROOT}:2026-10-11`)).toEqual(project)
})

test('a write adds to what another session saved meanwhile', async ($, on) => {
  const before = { main: { input: 5, output: 5, cacheRead: 5, cacheWrite: 5 }, sub: NONE, usd: 1, unpriced: 0, turns: 3 }
  const store = world(on, { entries: { [`project:${ROOT}`]: before } })
  await start($)
  await step($)
  store.set(`project:${ROOT}`, { ...before, turns: 4 })
  await complete($)

  const project = stored(store, `project:${ROOT}`)
  expect(project.turns).toBe(5)
  expect(project.main.input).toBe(9)
})

test("cost counts all four token types at the model's own rates", async ($, on) => {
  const store = world(on, { model: 'claude-sonnet-5-5' })
  await start($)
  await step($)
  await complete($)
  await tokens($)

  // 4 x $2 + 1,700 x $10 + 32,300 x $0.10 + 52,100 x $2.50, per million
  expect(micro(stored(store, `project:${ROOT}`).usd)).toBe(150_488)
  expect(await shows($, 'terminal', '$0.15')).toBe(true)
  expect(await shows($, 'terminal', '$0.01')).toBe(false)
})

test('a session resumed in a new process shows what it used before', async ($, on) => {
  // What an earlier process of this same session saved: one turn of the real numbers.
  const saved = { main: SEEN, sub: NONE, usd: 0.150488, unpriced: 0, turns: 1 }
  world(on, { entries: { [`session:${STARTED}`]: saved }, surfaces: ['desktop'] })
  await start($)
  await tokens($)

  expect(await shows($, 'desktop', '86.1k')).toBe(true)

  await step($)
  await complete($)
  expect(await shows($, 'desktop', '172.2k')).toBe(true)
})

test("each turn is saved under the session's start time, and a resume reads it back", async ($, on) => {
  const store = world(on)
  await start($)
  await step($)
  await complete($)
  await tokens($)

  expect(stored(store, `session:${STARTED}`).main).toEqual(SEEN)
  await $.classic.SessionStart({ source: 'resume' })
  expect(await shows($, 'terminal', '86.1k')).toBe(true)
})

test('/clear starts the session count over, and the old session stays saved', async ($, on) => {
  let startedAt = STARTED
  const store = world(on, { startedAt: () => startedAt })
  await start($)
  await step($)
  await complete($)
  await tokens($)

  startedAt = STARTED + 60_000
  await $.classic.SessionStart({ source: 'clear' })
  expect(await shows($, 'terminal', '86.1k')).toBe(false)

  await step($)
  await complete($)
  expect(stored(store, `session:${STARTED}`).turns).toBe(1)
  expect(stored(store, `session:${STARTED + 60_000}`).turns).toBe(1)
})

test('only the newest saved sessions are kept', async ($, on) => {
  const one = { main: SEEN, sub: NONE, usd: 0, unpriced: 0, turns: 1 }
  const old = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`session:${1000 + i}`, one]))
  const store = world(on, { entries: { ...old, [`project:${ROOT}`]: one } })
  await start($)

  const kept = [...store.keys()].filter(key => key.startsWith('session:'))
  expect(kept.length).toBe(50)
  expect(kept).not.toContain('session:1000')
  expect(kept).toContain('session:1059')
  expect(store.has(`project:${ROOT}`)).toBe(true)
})

test('/tokens answers in text where nothing can draw', async ($, on) => {
  world(on, { surfaces: [] })
  await start($)
  await step($)
  await complete($)

  const { text } = await tokens($)
  expect(text).toContain('This session: Total tokens 86.1k · From cache 38% · API-equivalent cost $0.15')
  expect(text).toContain('Input (uncached) 4')
  expect(text).toContain('This project: Total tokens 86.1k')
})
