import type { Tokens, Totals } from '../types'

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export type Side = 'main' | 'sub'

const NO_TOKENS: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

export const zero = (): Totals => ({
  main: { ...NO_TOKENS },
  sub: { ...NO_TOKENS },
  usd: 0,
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
  turns: a.turns + b.turns,
})

export const bump = (totals: Totals, side: Side, tokens: Tokens): Totals => ({
  ...totals,
  [side]: addTokens(totals[side], tokens),
})

export const sumTokens = (t: Tokens): number =>
  t.input + t.output + t.cacheRead + t.cacheWrite

export const sumTotals = (totals: Totals): Tokens => addTokens(totals.main, totals.sub)

// Share of the prompt the cache served: output tokens are never cached.
export const cacheShare = (t: Tokens): number => {
  const prompt = t.input + t.cacheRead + t.cacheWrite

  return prompt === 0 ? 0 : t.cacheRead / prompt
}

export const subShare = (totals: Totals): number => {
  const all = sumTokens(sumTotals(totals))

  return all === 0 ? 0 : sumTokens(totals.sub) / all
}

export const isEmpty = (totals: Totals): boolean =>
  sumTokens(sumTotals(totals)) === 0 && totals.usd === 0 && totals.turns === 0

// The ledger only grows within a session; a smaller reading means it started over.
export const costDelta = (previous: number, now: number): number =>
  now >= previous ? now - previous : now

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
  if (!isTokens(t.main) || !isTokens(t.sub) || !isCount(t.usd) || !isCount(t.turns)) {
    return zero()
  }

  return { main: t.main, sub: t.sub, usd: t.usd, turns: t.turns }
}

export const PROJECT = 'project:'

export const projectKey = (path: string): string => `${PROJECT}${path}`

export const dayKey = (path: string, now: number): string => {
  const d = new Date(now)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')

  return `day:${path}:${d.getFullYear()}-${month}-${date}`
}
