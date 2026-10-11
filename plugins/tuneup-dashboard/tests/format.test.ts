import { expect, test } from 'claude-code/testing'

import { compact, duration, receipt, usd } from '../hooks/format'
import { cacheShare, costDelta, dayKey, parse, zero } from '../hooks/totals'

test('numbers read short', () => {
  expect(compact(999)).toBe('999')
  expect(compact(18_400)).toBe('18.4k')
  expect(compact(2_500_000)).toBe('2.5M')
  expect(duration(42_000)).toBe('42s')
  expect(duration(185_000)).toBe('3m 05s')
  expect(usd(0.004)).toBe('<$0.01')
  expect(usd(1.239)).toBe('$1.24')
})

test('the receipt gives duration, tokens and cache share', () => {
  const tokens = { input: 1000, output: 400, cacheRead: 7000, cacheWrite: 2000 }

  expect(cacheShare(tokens)).toBe(0.7)
  expect(receipt(42_000, tokens)).toBe('Done in 42s · 10.4k tokens · 70% from cache')
})

test('a turn with no prompt tokens has no cache share', () => {
  expect(cacheShare({ input: 0, output: 5, cacheRead: 0, cacheWrite: 0 })).toBe(0)
})

test('a smaller cost reading counts as a ledger that started over', () => {
  expect(costDelta(1, 1.5)).toBe(0.5)
  expect(costDelta(5, 0.25)).toBe(0.25)
})

test('store values that are not totals read as zero', () => {
  expect(parse(undefined)).toEqual(zero())
  expect(parse({ main: {}, sub: {}, usd: 'x', turns: 1 })).toEqual(zero())
  expect(parse({ ...zero(), usd: 2 }).usd).toBe(2)
})

test('a day key carries the local date', () => {
  expect(dayKey('/work/app', new Date(2026, 9, 11, 12).getTime())).toBe('day:/work/app:2026-10-11')
})
