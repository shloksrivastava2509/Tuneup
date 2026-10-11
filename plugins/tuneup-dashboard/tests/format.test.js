"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var format_1 = require("../hooks/format");
var totals_1 = require("../hooks/totals");
(0, testing_1.test)('numbers read short', function () {
    (0, testing_1.expect)((0, format_1.compact)(999)).toBe('999');
    (0, testing_1.expect)((0, format_1.compact)(18400)).toBe('18.4k');
    (0, testing_1.expect)((0, format_1.compact)(2500000)).toBe('2.5M');
    (0, testing_1.expect)((0, format_1.duration)(42000)).toBe('42s');
    (0, testing_1.expect)((0, format_1.duration)(185000)).toBe('3m 05s');
    (0, testing_1.expect)((0, format_1.usd)(0.004)).toBe('<$0.01');
    (0, testing_1.expect)((0, format_1.usd)(1.239)).toBe('$1.24');
});
(0, testing_1.test)('the receipt gives duration, tokens and cache share', function () {
    var tokens = { input: 1000, output: 400, cacheRead: 7000, cacheWrite: 2000 };
    (0, testing_1.expect)((0, totals_1.cacheShare)(tokens)).toBe(0.7);
    (0, testing_1.expect)((0, format_1.receipt)(42000, tokens)).toBe('Done in 42s · 10.4k tokens · 70% from cache');
});
(0, testing_1.test)('a turn with no prompt tokens has no cache share', function () {
    (0, testing_1.expect)((0, totals_1.cacheShare)({ input: 0, output: 5, cacheRead: 0, cacheWrite: 0 })).toBe(0);
});
(0, testing_1.test)('a smaller cost reading counts as a ledger that started over', function () {
    (0, testing_1.expect)((0, totals_1.costDelta)(1, 1.5)).toBe(0.5);
    (0, testing_1.expect)((0, totals_1.costDelta)(5, 0.25)).toBe(0.25);
});
(0, testing_1.test)('store values that are not totals read as zero', function () {
    (0, testing_1.expect)((0, totals_1.parse)(undefined)).toEqual((0, totals_1.zero)());
    (0, testing_1.expect)((0, totals_1.parse)({ main: {}, sub: {}, usd: 'x', turns: 1 })).toEqual((0, totals_1.zero)());
    (0, testing_1.expect)((0, totals_1.parse)(__assign(__assign({}, (0, totals_1.zero)()), { usd: 2 })).usd).toBe(2);
});
(0, testing_1.test)('a day key carries the local date', function () {
    (0, testing_1.expect)((0, totals_1.dayKey)('/work/app', new Date(2026, 9, 11, 12).getTime())).toBe('day:/work/app:2026-10-11');
});
