import { expect, test } from 'claude-code/testing'

import { compact, cost, duration, receipt, usd } from '../hooks/format'
import { RATES } from '../hooks/rates'
import { cacheShare, costOf, dayKey, parse, rateFor, zero } from '../hooks/totals'

// The numbers of a real session: 4 input, 1.7k output, 32.3k cache read, 52.1k cache write.
const SEEN = { input: 4, output: 1700, cacheRead: 32_300, cacheWrite: 52_100 }

// Dollars as whole millionths, so sums of fractions compare exactly.
const micro = (dollars: number | null): number => Math.round((dollars ?? Number.NaN) * 1_000_000)

test('numbers read short', () => {
  expect(compact(999)).toBe('999')
  expect(compact(18_400)).toBe('18.4k')
  expect(compact(2_500_000)).toBe('2.5M')
  expect(duration(42_000)).toBe('42s')
  expect(duration(185_000)).toBe('3m 05s')
  expect(usd(0)).toBe('$0.00')
  expect(usd(0.0033)).toBe('$0.0033')
  expect(usd(1.239)).toBe('$1.24')
})

test('from cache is cache read over the whole prompt, in the receipt too', () => {
  expect(micro(cacheShare(SEEN))).toBe(382_683)
  expect(receipt(42_000, SEEN, 0.150488)).toBe('✓ Done in 42s  ·  86.1k tokens  ·  38% from cache  ·  $0.15')
  expect(receipt(42_000, SEEN, null)).toBe('✓ Done in 42s  ·  86.1k tokens  ·  38% from cache')
  expect(receipt(12_000, SEEN, 0.0033)).toBe('✓ Done in 12s  ·  86.1k tokens  ·  38% from cache  ·  $0.0033')
  expect(cacheShare({ input: 0, output: 5, cacheRead: 0, cacheWrite: 0 })).toBe(0)
})

test('cost prices input, output, cache read and cache write separately', () => {
  expect(micro(costOf(SEEN, 'claude-sonnet-5-5'))).toBe(150_488)
  expect(micro(costOf(SEEN, 'claude-opus-5-5'))).toBe(300_976)
  expect(micro(costOf(SEEN, 'claude-fable-5-1'))).toBe(744_365)
  // Output and cache writes carry almost all of it; the old figure was $0.01.
  expect(usd(costOf(SEEN, 'claude-sonnet-5-5') ?? 0)).toBe('$0.15')
})

test('a model id with a date, a provider prefix or a context suffix reads as its base model', () => {
  expect(rateFor('claude-haiku-4-5-20251001')).toBe(RATES['claude-haiku-4-5'])
  expect(rateFor('us.anthropic.claude-opus-5-5')).toBe(RATES['claude-opus-5-5'])
  expect(rateFor('claude-sonnet-5-5[1m]')).toBe(RATES['claude-sonnet-5-5'])
  expect(rateFor('claude-opus-5')).toBe(RATES['claude-opus-5'])
  expect(rateFor('qwen3-coder:latest')).toBe(null)
  expect(rateFor('claude-opus-9')).toBe(null)
})

test('a long prompt on a model with long-prompt prices pays them', () => {
  const short = { input: 50_000, output: 1000, cacheRead: 0, cacheWrite: 0 }
  const long = { input: 150_000, output: 1000, cacheRead: 0, cacheWrite: 0 }

  expect(micro(costOf(short, 'claude-haiku-5-5'))).toBe(5_500)
  expect(micro(costOf(long, 'claude-haiku-5-5'))).toBe(77_500)
})

test('cost shows a dash when nothing could be priced, and says when it is partial', () => {
  expect(costOf(SEEN, 'qwen3-coder:latest')).toBe(null)
  expect(cost({ ...zero(), unpriced: 86_104 })).toBe('—')
  expect(cost({ ...zero(), usd: 0.150488 })).toBe('$0.15')
  expect(cost({ ...zero(), usd: 0.150488, unpriced: 500 })).toBe('$0.15 (partial)')
})

test('every rate row has all four prices and a 1-hour write price', () => {
  for (const [model, rate] of Object.entries(RATES)) {
    for (const price of [rate.input, rate.output, rate.cacheRead, rate.cacheWrite, rate.cacheWrite1h]) {
      expect(price > 0, model).toBe(true)
    }
    expect(rate.output > rate.input && rate.cacheWrite > rate.input && rate.cacheRead < rate.input, model).toBe(true)
  }
})

test('store values that are not totals read as zero, and old records as unpriced', () => {
  expect(parse(undefined)).toEqual(zero())
  expect(parse({ main: {}, sub: {}, usd: 'x', turns: 1 })).toEqual(zero())
  expect(parse({ ...zero(), usd: 2 }).usd).toBe(2)
  const old = { main: SEEN, sub: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, usd: 0.01, turns: 1 }
  expect(parse(old)).toMatchObject({ usd: 0, unpriced: 86_104, turns: 1 })
})

test('a day key carries the local date', () => {
  expect(dayKey('/work/app', new Date(2026, 9, 11, 12).getTime())).toBe('day:/work/app:2026-10-11')
})
