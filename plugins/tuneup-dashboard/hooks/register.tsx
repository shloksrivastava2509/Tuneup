import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Tab, Totals } from '../types'
import { receipt, rows, summary } from './format'
import {
  PROJECT,
  addTotals,
  bump,
  costDelta,
  dayKey,
  fromUsage,
  isEmpty,
  parse,
  projectKey,
  zero,
} from './totals'

const PANE = 'tokens'
const TITLE = 'Tokens'
const TABS: { id: Tab; label: string }[] = [
  { id: 'session', label: 'This session' },
  { id: 'project', label: 'This project' },
  { id: 'all', label: 'All projects' },
]

const session = atom({ plugin: 'tuneup-dashboard', key: 'session' } as const, zero())
const project = atom({ plugin: 'tuneup-dashboard', key: 'project' } as const, zero())
const all = atom({ plugin: 'tuneup-dashboard', key: 'all' } as const, zero())
const tab = atom({ plugin: 'tuneup-dashboard', key: 'tab' } as const, 'session')

// What this session used since the last write to the store.
let pending = zero()
let writes: Promise<void> = Promise.resolve()

async function refresh($: EngineInterface) {
  const own = projectKey(await $.session.root())
  let sum = zero()
  let mine = zero()
  for (const key of await $.store.keys()) {
    if (!key.startsWith(PROJECT)) {
      continue
    }
    const totals = parse(await $.store.get(key))
    sum = addTotals(sum, totals)
    if (key === own) {
      mine = totals
    }
  }
  await update($, project, () => mine)
  await update($, all, () => sum)
}

async function write($: EngineInterface, delta: Totals) {
  const root = await $.session.root()
  // Other sessions share the store: each key is read again right before it is written.
  for (const key of [projectKey(root), dayKey(root, await $.clock.now())]) {
    await $.store.set(key, addTotals(parse(await $.store.get(key)), delta))
  }
  await refresh($)
}

function flush($: EngineInterface) {
  const delta = pending
  pending = zero()
  if (isEmpty(delta)) {
    return writes
  }
  writes = writes
    .then(() => write($, delta))
    .catch(() => {
      pending = addTotals(pending, delta)
    })

  return writes
}

// The session's cost so far is the baseline the next reading is measured from.
async function seed($: EngineInterface) {
  const usage = await $.session.usage()
  await update($, session, () => ({ ...zero(), usd: usage.cost?.usd ?? 0 }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'tokens',
      description: 'Show token usage for this session and project',
    })
    const held = await $.state.get({ plugin: 'tuneup-dashboard', key: 'session' } as const)
    if (held.version === 0) {
      await seed($)
    }
    await refresh($)

    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      await flush($)
      await seed($)
      await refresh($)
    }

    return next(e)
  }).catch((_, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    await flush($)

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    if (result.usage) {
      const tokens = fromUsage(result.usage)
      const side = e.agentId === undefined ? 'main' : 'sub'
      pending = bump(pending, side, tokens)
      await update($, session, totals => bump(totals, side, tokens))
    }

    return result
  })

  on('session.measure', async ($, e, next) => {
    const cost = e.cost
    if (cost) {
      const previous = (await read($, session)).usd
      if (cost.usd !== previous) {
        pending = { ...pending, usd: pending.usd + costDelta(previous, cost.usd) }
        await update($, session, totals => ({ ...totals, usd: cost.usd }))
        await flush($)
      }
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const isMain = e.agentId === undefined
    if (isMain) {
      pending = { ...pending, turns: pending.turns + 1 }
      await update($, session, totals => ({ ...totals, turns: totals.turns + 1 }))
    }
    await flush($)
    if (!isMain || e.reason !== 'answer' || !e.usage) {
      return result
    }
    const line = receipt(e.durationMs, fromUsage(e.usage))

    return { ...result, text: result.text === e.answer ? line : `${result.text}\n${line}` }
  })

  on('command.run', { command: 'tokens' }, async $ => {
    await refresh($)
    const surfaces = await $.session.surfaces()
    if (surfaces.includes('terminal') || surfaces.includes('desktop')) {
      await $.ui.open({ id: PANE, title: TITLE })

      // No text: a command's text is a row the model reads on its next turn.
      return {}
    }

    return {
      text: [
        summary('This session', await read($, session)),
        summary('This project', await read($, project)),
      ].join('\n'),
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const active = await read($, tab)
    const shown = { session: await read($, session), project: await read($, project), all: await read($, all) }
    const totals = shown[active]

    return (
      <Box flexDirection="column" gap={1}>
        <Box gap={2}>
          {TABS.map(one => (
            <Button
              key={one.id}
              label={one.id === active ? `[${one.label}]` : one.label}
              onPress={() => update($, tab, () => one.id)}
            />
          ))}
        </Box>
        <Box flexDirection="column">
          {rows(totals).map(([label, value]) => (
            <Box>
              <Text dimColor>{label.padEnd(21)}</Text>
              <Text>{value}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
