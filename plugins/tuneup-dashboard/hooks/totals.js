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
exports.dayKey = exports.projectKey = exports.PROJECT = exports.parse = exports.costDelta = exports.isEmpty = exports.subShare = exports.cacheShare = exports.sumTotals = exports.sumTokens = exports.bump = exports.addTotals = exports.addTokens = exports.fromUsage = exports.zero = void 0;
var NO_TOKENS = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
var zero = function () { return ({
    main: __assign({}, NO_TOKENS),
    sub: __assign({}, NO_TOKENS),
    usd: 0,
    turns: 0,
}); };
exports.zero = zero;
var fromUsage = function (usage) { return ({
    input: usage.input_tokens,
    output: usage.output_tokens,
    cacheRead: usage.cache_read_input_tokens,
    cacheWrite: usage.cache_creation_input_tokens,
}); };
exports.fromUsage = fromUsage;
var addTokens = function (a, b) { return ({
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
}); };
exports.addTokens = addTokens;
var addTotals = function (a, b) { return ({
    main: (0, exports.addTokens)(a.main, b.main),
    sub: (0, exports.addTokens)(a.sub, b.sub),
    usd: a.usd + b.usd,
    turns: a.turns + b.turns,
}); };
exports.addTotals = addTotals;
var bump = function (totals, side, tokens) {
    var _a;
    return (__assign(__assign({}, totals), (_a = {}, _a[side] = (0, exports.addTokens)(totals[side], tokens), _a)));
};
exports.bump = bump;
var sumTokens = function (t) {
    return t.input + t.output + t.cacheRead + t.cacheWrite;
};
exports.sumTokens = sumTokens;
var sumTotals = function (totals) { return (0, exports.addTokens)(totals.main, totals.sub); };
exports.sumTotals = sumTotals;
// Share of the prompt the cache served: output tokens are never cached.
var cacheShare = function (t) {
    var prompt = t.input + t.cacheRead + t.cacheWrite;
    return prompt === 0 ? 0 : t.cacheRead / prompt;
};
exports.cacheShare = cacheShare;
var subShare = function (totals) {
    var all = (0, exports.sumTokens)((0, exports.sumTotals)(totals));
    return all === 0 ? 0 : (0, exports.sumTokens)(totals.sub) / all;
};
exports.subShare = subShare;
var isEmpty = function (totals) {
    return (0, exports.sumTokens)((0, exports.sumTotals)(totals)) === 0 && totals.usd === 0 && totals.turns === 0;
};
exports.isEmpty = isEmpty;
// The ledger only grows within a session; a smaller reading means it started over.
var costDelta = function (previous, now) {
    return now >= previous ? now - previous : now;
};
exports.costDelta = costDelta;
var isCount = function (v) { return typeof v === 'number' && Number.isFinite(v) && v >= 0; };
var isTokens = function (v) {
    if (typeof v !== 'object' || v === null) {
        return false;
    }
    var t = v;
    return isCount(t.input) && isCount(t.output) && isCount(t.cacheRead) && isCount(t.cacheWrite);
};
// What the store holds is shared with other sessions and versions: never trusted as typed.
var parse = function (v) {
    if (typeof v !== 'object' || v === null) {
        return (0, exports.zero)();
    }
    var t = v;
    if (!isTokens(t.main) || !isTokens(t.sub) || !isCount(t.usd) || !isCount(t.turns)) {
        return (0, exports.zero)();
    }
    return { main: t.main, sub: t.sub, usd: t.usd, turns: t.turns };
};
exports.parse = parse;
exports.PROJECT = 'project:';
var projectKey = function (path) { return "".concat(exports.PROJECT).concat(path); };
exports.projectKey = projectKey;
var dayKey = function (path, now) {
    var d = new Date(now);
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var date = String(d.getDate()).padStart(2, '0');
    return "day:".concat(path, ":").concat(d.getFullYear(), "-").concat(month, "-").concat(date);
};
exports.dayKey = dayKey;
