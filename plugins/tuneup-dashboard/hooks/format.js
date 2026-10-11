"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summary = exports.rows = exports.receipt = exports.usd = exports.percent = exports.duration = exports.compact = void 0;
var totals_1 = require("./totals");
var compact = function (n) {
    if (n < 1000) {
        return String(Math.round(n));
    }
    if (n < 1000000) {
        return "".concat((n / 1000).toFixed(1), "k");
    }
    return "".concat((n / 1000000).toFixed(1), "M");
};
exports.compact = compact;
var duration = function (ms) {
    var seconds = Math.round(ms / 1000);
    if (seconds < 60) {
        return "".concat(seconds, "s");
    }
    return "".concat(Math.floor(seconds / 60), "m ").concat(String(seconds % 60).padStart(2, '0'), "s");
};
exports.duration = duration;
var percent = function (share) { return "".concat(Math.round(share * 100), "%"); };
exports.percent = percent;
var usd = function (amount) {
    return amount > 0 && amount < 0.01 ? '<$0.01' : "$".concat(amount.toFixed(2));
};
exports.usd = usd;
var receipt = function (durationMs, tokens) {
    return "Done in ".concat((0, exports.duration)(durationMs), " \u00B7 ").concat((0, exports.compact)((0, totals_1.sumTokens)(tokens)), " tokens \u00B7 ").concat((0, exports.percent)((0, totals_1.cacheShare)(tokens)), " from cache");
};
exports.receipt = receipt;
var rows = function (totals) {
    var tokens = (0, totals_1.sumTotals)(totals);
    return [
        ['Input', (0, exports.compact)(tokens.input)],
        ['Output', (0, exports.compact)(tokens.output)],
        ['Cache read', (0, exports.compact)(tokens.cacheRead)],
        ['Cache write', (0, exports.compact)(tokens.cacheWrite)],
        ['Total', (0, exports.compact)((0, totals_1.sumTokens)(tokens))],
        ['From cache', (0, exports.percent)((0, totals_1.cacheShare)(tokens))],
        ['Subagents', (0, exports.percent)((0, totals_1.subShare)(totals))],
        ['Turns', String(totals.turns)],
        ['API-equivalent cost', (0, exports.usd)(totals.usd)],
    ];
};
exports.rows = rows;
var summary = function (title, totals) {
    return "".concat(title, ": ").concat((0, exports.rows)(totals)
        .map(function (_a) {
        var label = _a[0], value = _a[1];
        return "".concat(label, " ").concat(value);
    })
        .join(' · '));
};
exports.summary = summary;
