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

export const usd = (amount: number): string =>
  amount > 0 && amount < 0.01 ? '<$0.01' : `$${amount.toFixed(2)}`

export const receipt = (durationMs: number, tokens: Tokens): string =>
  `Done in ${duration(durationMs)} · ${compact(sumTokens(tokens))} tokens · ${percent(cacheShare(tokens))} from cache`

export const rows = (totals: Totals): [label: string, value: string][] => {
  const tokens = sumTotals(totals)

  return [
    ['Input', compact(tokens.input)],
    ['Output', compact(tokens.output)],
    ['Cache read', compact(tokens.cacheRead)],
    ['Cache write', compact(tokens.cacheWrite)],
    ['Total', compact(sumTokens(tokens))],
    ['From cache', percent(cacheShare(tokens))],
    ['Subagents', percent(subShare(totals))],
    ['Turns', String(totals.turns)],
    ['API-equivalent cost', usd(totals.usd)],
  ]
}

export const summary = (title: string, totals: Totals): string =>
  `${title}: ${rows(totals)
    .map(([label, value]) => `${label} ${value}`)
    .join(' · ')}`
