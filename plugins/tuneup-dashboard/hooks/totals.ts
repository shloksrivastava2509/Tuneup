import type { Tokens, Totals } from '../types'
import { RATES } from './rates'
import type { Rate } from './rates'

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export type Side = 'main' | 'sub'

export const NO_TOKENS: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

export const zero = (): Totals => ({
  main: { ...NO_TOKENS },
  sub: { ...NO_TOKENS },
  usd: 0,
  unpriced: 0,
  turns: 0,
})

export const fromUsage = (usage: Usage): Tokens => ({
  input: usage.input_tokens,
  output: usage.output_tokens,
  cacheRead: usage.cache_read_input_tokens,
  cacheWrite: usage.cache_creation_input_tokens,
})

export const addTokens = (a: Tokens, b: Tokens): Tokens => ({
  input: a.input + b.input,
  output: a.output + b.output,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
})

export const addTotals = (a: Totals, b: Totals): Totals => ({
  main: addTokens(a.main, b.main),
  sub: addTokens(a.sub, b.sub),
  usd: a.usd + b.usd,
  unpriced: a.unpriced + b.unpriced,
  turns: a.turns + b.turns,
})

export const sumTokens = (t: Tokens): number =>
  t.input + t.output + t.cacheRead + t.cacheWrite

// The rates of the model a request names: a dated or provider-prefixed id reads as its base id.
export const rateFor = (model: string): Rate | null => {
  const at = model.indexOf('claude-')
  if (at === -1) {
    return null
  }
  const id = model.slice(at)
  const known = Object.keys(RATES)
    .filter(key => id === key || id.startsWith(`${key}-`) || id.startsWith(`${key}@`) || id.startsWith(`${key}[`))
    .sort((a, b) => b.length - a.length)[0]

  return known === undefined ? null : (RATES[known] ?? null)
}

// What one request costs at API list prices, all four token types; null when the model's rates are unknown.
export const costOf = (tokens: Tokens, model: string): number | null => {
  const rate = rateFor(model)
  if (rate === null) {
    return null
  }
  const prompt = tokens.input + tokens.cacheRead + tokens.cacheWrite
  const price = rate.long !== undefined && prompt > rate.long.above ? rate.long : rate

  return (
    (tokens.input * price.input +
      tokens.output * price.output +
      tokens.cacheRead * price.cacheRead +
      tokens.cacheWrite * price.cacheWrite) /
    1_000_000
  )
}

// Adds one request: its tokens to the side that made it, and its cost, or its tokens to the unpriced count.
export const bump = (totals: Totals, side: Side, tokens: Tokens, model: string): Totals => {
  const cost = costOf(tokens, model)

  return {
    ...totals,
    [side]: addTokens(totals[side], tokens),
    usd: totals.usd + (cost ?? 0),
    unpriced: totals.unpriced + (cost === null ? sumTokens(tokens) : 0),
  }
}

export const sumTotals = (totals: Totals): Tokens => addTokens(totals.main, totals.sub)

// The one definition of "from cache": cache_read / (input + cache_read + cache_write).
export const cacheShare = (t: Tokens): number => {
  const prompt = t.input + t.cacheRead + t.cacheWrite

  return prompt === 0 ? 0 : t.cacheRead / prompt
}

export const subShare = (totals: Totals): number => {
  const all = sumTokens(sumTotals(totals))

  return all === 0 ? 0 : sumTokens(totals.sub) / all
}

export const isEmpty = (totals: Totals): boolean =>
  sumTokens(sumTotals(totals)) === 0 && totals.turns === 0

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

const isTokens = (v: unknown): v is Tokens => {
  if (typeof v !== 'object' || v === null) {
    return false
  }
  const t = v as Record<string, unknown>

  return isCount(t.input) && isCount(t.output) && isCount(t.cacheRead) && isCount(t.cacheWrite)
}

// What the store holds is shared with other sessions and versions: never trusted as typed.
export const parse = (v: unknown): Totals => {
  if (typeof v !== 'object' || v === null) {
    return zero()
  }
  const t = v as Record<string, unknown>
  if (!isTokens(t.main) || !isTokens(t.sub) || !isCount(t.turns)) {
    return zero()
  }
  // A record saved before costs came from the rates file: its cost is not known.
  if (!isCount(t.usd) || !isCount(t.unpriced)) {
    return { main: t.main, sub: t.sub, usd: 0, unpriced: sumTokens(addTokens(t.main, t.sub)), turns: t.turns }
  }

  return { main: t.main, sub: t.sub, usd: t.usd, unpriced: t.unpriced, turns: t.turns }
}

export const PROJECT = 'project:'
export const SESSION = 'session:'
// Saved sessions kept in the store; older ones are dropped.
export const SESSIONS_KEPT = 50

// A session is known by when it first started: that moment survives a resume into a new
// process, where the session's id does not, and /clear starts a new one.
export const sessionKey = (startedAt: number): string => `${SESSION}${startedAt}`

// The saved sessions past the newest `SESSIONS_KEPT`, oldest first.
export const staleSessions = (keys: string[]): string[] =>
  keys
    .filter(key => key.startsWith(SESSION))
    .sort((a, b) => Number(a.slice(SESSION.length)) - Number(b.slice(SESSION.length)))
    .slice(0, -SESSIONS_KEPT)

export const projectKey = (path: string): string => `${PROJECT}${path}`

export const dayKey = (path: string, now: number): string => {
  const d = new Date(now)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')

  return `day:${path}:${d.getFullYear()}-${month}-${date}`
}
