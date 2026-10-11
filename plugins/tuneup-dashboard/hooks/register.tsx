import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Tab, Tokens, Totals } from '../types'
import { card, receipt, summary } from './format'
import {
  NO_TOKENS,
  PROJECT,
  addTokens,
  addTotals,
  bump,
  cacheShare,
  costOf,
  dayKey,
  fromUsage,
  isEmpty,
  parse,
  projectKey,
  sessionKey,
  sumTotals,
  staleSessions,
  zero,
} from './totals'

// The box is drawn no wider than this, however wide the band is.
const BOX_COLUMNS = 84
// One headline figure: a column of its own, so figures line up in any font.
const TILE_COLUMNS = 19
// At or above this share of the prompt read from cache, the figure is drawn as healthy.
const GOOD_CACHE_SHARE = 0.5
const TABS: { id: Tab; label: string; hotkey: string }[] = [
  { id: 'session', label: 'This session', hotkey: '1' },
  { id: 'project', label: 'This project', hotkey: '2' },
  { id: 'all', label: 'All projects', hotkey: '3' },
]

const session = atom({ plugin: 'tuneup-dashboard', key: 'session' } as const, zero())
const project = atom({ plugin: 'tuneup-dashboard', key: 'project' } as const, zero())
const all = atom({ plugin: 'tuneup-dashboard', key: 'all' } as const, zero())
const tab = atom({ plugin: 'tuneup-dashboard', key: 'tab' } as const, 'session')
const isOpen = atom({ plugin: 'tuneup-dashboard', key: 'isOpen' } as const, false)

// What this session used since the last write to the store.
let pending = zero()
let writes: Promise<void> = Promise.resolve()
// The main conversation's tokens and cost per turn still running, which its receipt reports.
// `usd` is null once a request of the turn had no known rates.
const turns = new Map<string, { tokens: Tokens; usd: number | null }>()

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
  const { startedAt } = await $.session.usage()
  // Other sessions share the store: each key is read again right before it is written.
  for (const key of [projectKey(root), dayKey(root, await $.clock.now()), sessionKey(startedAt)]) {
    await $.store.set(key, addTotals(parse(await $.store.get(key)), delta))
  }
  await refresh($)
}

// Puts this session's saved totals back: `$.state` is empty in a new process, and the
// Desktop app resumes a conversation in one.
async function restore($: EngineInterface) {
  const { startedAt } = await $.session.usage()
  const saved = parse(await $.store.get(sessionKey(startedAt)))
  await update($, session, () => saved)
}

async function prune($: EngineInterface) {
  for (const key of staleSessions(await $.store.keys())) {
    await $.store.delete(key)
  }
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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'tokens',
      description: 'Show or hide token use, cache share and cost above the prompt',
    })
    await restore($)
    await prune($)
    await refresh($)
    // This also runs after a reload: a pane left open is drawn again by the new code.
    $.ui.invalidate('ui.render')

    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      await flush($)
      if (e.source === 'clear') {
        await update($, session, () => zero())
      } else {
        await restore($)
      }
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
      const model = result.usage.model
      const side = e.agentId === undefined ? 'main' : 'sub'
      if (side === 'main') {
        const held = turns.get(e.turnId) ?? { tokens: NO_TOKENS, usd: 0 }
        const spent = costOf(tokens, model)
        turns.set(e.turnId, {
          tokens: addTokens(held.tokens, tokens),
          usd: held.usd === null || spent === null ? null : held.usd + spent,
        })
      }
      pending = bump(pending, side, tokens, model)
      await update($, session, totals => bump(totals, side, tokens, model))
    }

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const isMain = e.agentId === undefined
    if (isMain) {
      pending = { ...pending, turns: pending.turns + 1 }
      await update($, session, totals => ({ ...totals, turns: totals.turns + 1 }))
    }
    await flush($)
    // The same requests the pane counted, so the receipt and the pane agree.
    const fallback = e.usage ? { tokens: fromUsage(e.usage), usd: costOf(fromUsage(e.usage), e.usage.model) } : undefined
    const counted = turns.get(e.turnId) ?? fallback
    turns.delete(e.turnId)
    if (!isMain || e.reason !== 'answer' || counted === undefined) {
      return result
    }
    const line = receipt(e.durationMs, counted.tokens, counted.usd)
    const surfaces = await $.session.surfaces()
    // Only the terminal draws a turn's returned text. The Desktop app draws its own
    // footer, so the receipt goes there as a transcript line, which the model never reads.
    if (surfaces.includes('desktop') && !surfaces.includes('terminal')) {
      $.ui.log(line)

      return result
    }

    return { ...result, text: result.text === e.answer ? line : `${result.text}\n${line}` }
  })

  on('command.run', { command: 'tokens' }, async $ => {
    await refresh($)
    const surfaces = await $.session.surfaces()
    if (surfaces.includes('terminal') || surfaces.includes('desktop')) {
      await update($, isOpen, shown => !shown)

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

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOpen))) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    const active = await read($, tab)
    const shown = { session: await read($, session), project: await read($, project), all: await read($, all) }
    const totals = shown[active]
    const { headline, detail } = card(totals)
    const isCached = cacheShare(sumTotals(totals)) >= GOOD_CACHE_SHARE

    return (
      <Box
        key="tokens"
        flexDirection="column"
        borderStyle="round"
        paddingX={1}
        width={Math.min(e.props.bodyColumns, BOX_COLUMNS)}
      >
        <Box columnGap={3}>
          <Text bold>Tokens</Text>
          {TABS.map(one => (
            <Button
              key={one.id}
              label={one.label}
              hotkey={one.hotkey}
              plain
              dimColor={one.id !== active}
              onPress={() => update($, tab, () => one.id)}
            />
          ))}
        </Box>
        <Box columnGap={2} flexWrap="wrap">
          {headline.map(([label, value]) => (
            <Box key={`tile-${label}`} flexDirection="column" width={TILE_COLUMNS} flexShrink={0}>
              <Text dimColor>{label}</Text>
              {label === 'From cache' ? (
                <Text bold color={isCached ? 'green' : 'yellow'}>
                  {value}
                </Text>
              ) : (
                <Text bold>{value}</Text>
              )}
            </Box>
          ))}
        </Box>
        <Box columnGap={3} flexWrap="wrap">
          {detail.map(([label, value]) => (
            <Box key={`detail-${label}`} columnGap={1}>
              <Text dimColor>{label}</Text>
              <Text>{value}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
