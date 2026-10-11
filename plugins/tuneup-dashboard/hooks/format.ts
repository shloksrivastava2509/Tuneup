import type { Tokens, Totals } from '../types'
import { cacheShare, subShare, sumTokens, sumTotals } from './totals'

export const compact = (n: number): string => {
  if (n < 1000) {
    return String(Math.round(n))
  }
  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(1)}k`
  }

  return `${(n / 1_000_000).toFixed(1)}M`
}

export const duration = (ms: number): string => {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

export const percent = (share: number): string => `${Math.round(share * 100)}%`

// Amounts under a cent keep four decimals, so a cheap turn does not read as nothing.
export const usd = (amount: number): string => {
  if (amount === 0) {
    return '$0.00'
  }

  return amount < 0.01 ? `$${amount.toFixed(4)}` : `$${amount.toFixed(2)}`
}

// A dash when no token could be priced; marked partial when only some could.
export const cost = (totals: Totals): string => {
  if (totals.unpriced === 0) {
    return usd(totals.usd)
  }

  return totals.usd === 0 ? '—' : `${usd(totals.usd)} (partial)`
}

// The line under an answer. `spent` is the turn's cost, or null when its model has no known rates.
export const receipt = (durationMs: number, tokens: Tokens, spent: number | null): string =>
  [
    `✓ Done in ${duration(durationMs)}`,
    `${compact(sumTokens(tokens))} tokens`,
    `${percent(cacheShare(tokens))} from cache`,
    ...(spent === null ? [] : [usd(spent)]),
  ].join('  ·  ')

export type Stat = [label: string, value: string]

// What the box shows: the figures to read at a glance, then the breakdown behind them.
export const card = (totals: Totals): { headline: Stat[]; detail: Stat[] } => {
  const tokens = sumTotals(totals)

  return {
    headline: [
      ['Total tokens', compact(sumTokens(tokens))],
      ['From cache', percent(cacheShare(tokens))],
      ['API-equivalent cost', cost(totals)],
      ['Turns', String(totals.turns)],
    ],
    detail: [
      ['Input (uncached)', compact(tokens.input)],
      ['Output', compact(tokens.output)],
      ['Cache read', compact(tokens.cacheRead)],
      ['Cache write', compact(tokens.cacheWrite)],
      ['Subagents', percent(subShare(totals))],
    ],
  }
}

export const summary = (title: string, totals: Totals): string => {
  const { headline, detail } = card(totals)

  return `${title}: ${[...headline, ...detail].map(([label, value]) => `${label} ${value}`).join(' · ')}`
}
