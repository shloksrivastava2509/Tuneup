import { atom, read, update } from 'claude-code'
import type { Elements, EngineInterface, Register, RenderInput } from 'claude-code'

import type { Tab, Tokens, Totals } from '../types'
import type { ReceiptProps } from './receipt'
import { card, receipt, summary, tailOf } from './format'
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

// The Token info mark: a small gold coin, drawn by the mod rather than taken from an emoji
// font. The Desktop app draws it as an SVG; the terminal as a gold disc.
const GOLD = '#E8B923'
const COIN_GLYPH = '\u25C9'
const COIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
  '<defs><radialGradient id="g" cx="35%" cy="30%" r="75%">' +
  '<stop offset="0" stop-color="#FFF1A8"/><stop offset="0.55" stop-color="#E8B923"/><stop offset="1" stop-color="#A97C0F"/>' +
  '</radialGradient></defs>' +
  '<circle cx="8" cy="8" r="7.25" fill="url(#g)" stroke="#8A6508" stroke-width="1"/>' +
  '<circle cx="8" cy="8" r="4.75" fill="none" stroke="#FFF1A8" stroke-opacity="0.6" stroke-width="1"/>' +
  '</svg>'
// At or above this share of the context window, remind the person to /compact.
const COMPACT_AT = 60
// Below this, after a /compact, the reminder may show again.
const REMIND_AGAIN_BELOW = 50
const RECEIPTS_KEPT = 30
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

const session = atom({ plugin: 'token-info', key: 'session' } as const, zero())
const project = atom({ plugin: 'token-info', key: 'project' } as const, zero())
const all = atom({ plugin: 'token-info', key: 'all' } as const, zero())
const tab = atom({ plugin: 'token-info', key: 'tab' } as const, 'session')
const isOpen = atom({ plugin: 'token-info', key: 'isOpen' } as const, false)
const receipts = atom({ plugin: 'token-info', key: 'receipts' } as const, [])
const context = atom({ plugin: 'token-info', key: 'context' } as const, null)
const isReminded = atom({ plugin: 'token-info', key: 'isReminded' } as const, false)

// What this session used since the last write to the store.
let pending = zero()
let writes: Promise<void> = Promise.resolve()
// The main conversation's tokens and cost per turn still running, which its receipt reports.
// `usd` is null once a request of the turn had no known rates.
const turns = new Map<string, { tokens: Tokens; usd: number | null }>()

// The Desktop app's SVG element, which draws the gold coin; undefined on a surface without it.
function coinSvg($: EngineInterface, e: RenderInput): Elements['desktop']['Svg'] | undefined {
  if (e.surface !== 'desktop') {
    return undefined
  }

  return $.ui.resolve(e as RenderInput<RenderInput['component'], 'desktop'>).Svg
}

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
      description: 'Show or hide Token info: token use, cache share, cost and context',
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
    // The terminal and the Desktop app draw the receipt themselves, under the answer, with the coin.
    if (surfaces.includes('terminal') || surfaces.includes('desktop')) {
      const tail = tailOf(e.answer)
      if (tail.length > 0) {
        await update($, receipts, held => [...held, { tail, line }].slice(-RECEIPTS_KEPT))
      }

      return result
    }

    return { ...result, text: result.text === e.answer ? line : `${result.text}\n${line}` }
  })

  on('session.measure', async ($, e, next) => {
    const used = e.context.percent
    if (used !== undefined) {
      await update($, context, () => ({ percent: used, window: e.context.window }))
      const wasReminded = await read($, isReminded)
      if (used >= COMPACT_AT && !wasReminded) {
        $.ui.toast(`Context is ${used}% full. Run /compact to keep replies fast and cheap.`, { timeoutMs: 10_000 })
        await update($, isReminded, () => true)
      } else if (used < REMIND_AGAIN_BELOW && wasReminded) {
        await update($, isReminded, () => false)
      }
    }

    return next(e)
  })

  // The receipt, under the answer it belongs to: a coin and the turn's figures, lit like
  // moonlight under the pointer, and a click opens Token info above the prompt.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const theirs = await next(e)
    const tail = tailOf(e.props.text)
    if (e.props.isSummary || tail.length === 0) {
      return theirs
    }
    const found = (await read($, receipts)).findLast(held => held.tail.endsWith(tail))
    if (found === undefined) {
      return theirs
    }
    const elements = $.ui.resolve(e)
    // Only the terminal and the Desktop app draw a Client; elsewhere the answer is left as it is.
    if (!('Client' in elements)) {
      return theirs
    }
    const { Box, Client } = elements
    const Svg = coinSvg($, e)
    const props: ReceiptProps = { line: found.line, coin: Svg === undefined ? COIN_GLYPH : null, coinColor: GOLD }

    // The receipt is a Client the mod draws itself: it fades its own colour in and out under the
    // pointer and takes the click, with none of the chrome a Button gets in the Desktop app.
    return (
      <Box flexDirection="column">
        {theirs}
        <Box key={`receipt-${e.requestId}`} columnGap={1} alignItems="center">
          {Svg !== undefined ? <Svg source={COIN_SVG} alt="Token info" width={14} height={14} /> : null}
          <Client key={`glow-${e.requestId}`} module="./receipt.tsx" props={props} />
        </Box>
      </Box>
    )
  })

  // A click on a receipt opens Token info above the prompt, and a second click closes it.
  on('ui.message', async ($, e, next) => {
    const data = e.data as { type?: unknown } | null
    if (data?.type !== 'toggle-token-info') {
      return next(e)
    }
    await update($, isOpen, shown => !shown)

    return {}
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
    const Svg = coinSvg($, e)
    const active = await read($, tab)
    const shown = { session: await read($, session), project: await read($, project), all: await read($, all) }
    const totals = shown[active]
    const filled = await read($, context)
    const { headline, detail, usage } = card(totals, filled)
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
          {Svg !== undefined ? <Svg source={COIN_SVG} alt="Token info" width={14} height={14} /> : <Text color={GOLD}>{COIN_GLYPH}</Text>}
          <Text bold>Token info</Text>
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
        <Box columnGap={3} flexWrap="wrap">
          {usage.map(([label, value]) => (
            <Box key={`usage-${label}`} columnGap={1}>
              <Text dimColor>{label}</Text>
              {label === 'Context used' && filled !== null && filled.percent >= COMPACT_AT ? (
                <Text color="yellow">{`${value}, run /compact`}</Text>
              ) : (
                <Text>{value}</Text>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
