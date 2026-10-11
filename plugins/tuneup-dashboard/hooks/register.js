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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
var claude_code_1 = require("claude-code");
var format_1 = require("./format");
var totals_1 = require("./totals");
var PANE = 'tokens';
var TITLE = 'Tokens';
var TABS = [
    { id: 'session', label: 'This session' },
    { id: 'project', label: 'This project' },
    { id: 'all', label: 'All projects' },
];
var session = (0, claude_code_1.atom)({ plugin: 'tuneup-dashboard', key: 'session' }, (0, totals_1.zero)());
var project = (0, claude_code_1.atom)({ plugin: 'tuneup-dashboard', key: 'project' }, (0, totals_1.zero)());
var all = (0, claude_code_1.atom)({ plugin: 'tuneup-dashboard', key: 'all' }, (0, totals_1.zero)());
var tab = (0, claude_code_1.atom)({ plugin: 'tuneup-dashboard', key: 'tab' }, 'session');
// What this session used since the last write to the store.
var pending = (0, totals_1.zero)();
var writes = Promise.resolve();
function refresh($) {
    return __awaiter(this, void 0, void 0, function () {
        var own, _a, sum, mine, _i, _b, key, totals, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = totals_1.projectKey;
                    return [4 /*yield*/, $.session.root()];
                case 1:
                    own = _a.apply(void 0, [_d.sent()]);
                    sum = (0, totals_1.zero)();
                    mine = (0, totals_1.zero)();
                    _i = 0;
                    return [4 /*yield*/, $.store.keys()];
                case 2:
                    _b = _d.sent();
                    _d.label = 3;
                case 3:
                    if (!(_i < _b.length)) return [3 /*break*/, 6];
                    key = _b[_i];
                    if (!key.startsWith(totals_1.PROJECT)) {
                        return [3 /*break*/, 5];
                    }
                    _c = totals_1.parse;
                    return [4 /*yield*/, $.store.get(key)];
                case 4:
                    totals = _c.apply(void 0, [_d.sent()]);
                    sum = (0, totals_1.addTotals)(sum, totals);
                    if (key === own) {
                        mine = totals;
                    }
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, (0, claude_code_1.update)($, project, function () { return mine; })];
                case 7:
                    _d.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, all, function () { return sum; })];
                case 8:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function write($, delta) {
    return __awaiter(this, void 0, void 0, function () {
        var root, _i, _a, _b, _c, _d, key, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, $.session.root()
                    // Other sessions share the store: each key is read again right before it is written.
                ];
                case 1:
                    root = _k.sent();
                    _i = 0;
                    _b = [(0, totals_1.projectKey)(root)];
                    _c = totals_1.dayKey;
                    _d = [root];
                    return [4 /*yield*/, $.clock.now()];
                case 2:
                    _a = _b.concat([_c.apply(void 0, _d.concat([_k.sent()]))]);
                    _k.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    key = _a[_i];
                    _f = (_e = $.store).set;
                    _g = [key];
                    _h = totals_1.addTotals;
                    _j = totals_1.parse;
                    return [4 /*yield*/, $.store.get(key)];
                case 4: return [4 /*yield*/, _f.apply(_e, _g.concat([_h.apply(void 0, [_j.apply(void 0, [_k.sent()]), delta])]))];
                case 5:
                    _k.sent();
                    _k.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7: return [4 /*yield*/, refresh($)];
                case 8:
                    _k.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function flush($) {
    var delta = pending;
    pending = (0, totals_1.zero)();
    if ((0, totals_1.isEmpty)(delta)) {
        return writes;
    }
    writes = writes
        .then(function () { return write($, delta); })
        .catch(function () {
        pending = (0, totals_1.addTotals)(pending, delta);
    });
    return writes;
}
// The session's cost so far is the baseline the next reading is measured from.
function seed($) {
    return __awaiter(this, void 0, void 0, function () {
        var usage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.session.usage()];
                case 1:
                    usage = _a.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, session, function () { var _a, _b; return (__assign(__assign({}, (0, totals_1.zero)()), { usd: (_b = (_a = usage.cost) === null || _a === void 0 ? void 0 : _a.usd) !== null && _b !== void 0 ? _b : 0 })); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var register = function (on) {
    on('session.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var held;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.command.register({
                        name: 'tokens',
                        description: 'Show token usage for this session and project',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, $.state.get({ plugin: 'tuneup-dashboard', key: 'session' })];
                case 2:
                    held = _a.sent();
                    if (!(held.version === 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, seed($)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, refresh($)];
                case 5:
                    _a.sent();
                    return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('classic.SessionStart', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(e.source === 'clear' || e.source === 'resume' || e.source === 'fork')) return [3 /*break*/, 4];
                    return [4 /*yield*/, flush($)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, seed($)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, refresh($)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, next(e)];
            }
        });
    }); }).catch(function (_, e, next) { return next(e); });
    on('session.end', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, flush($)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('turn.step', function ($, e, next) {
        return __asyncGenerator(this, arguments, function () {
            var result, tokens_1, side_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [5 /*yield**/, __values(__asyncDelegator(__asyncValues(next(e))))];
                    case 1: return [4 /*yield*/, __await.apply(void 0, [_a.sent()])];
                    case 2:
                        result = _a.sent();
                        if (!result.usage) return [3 /*break*/, 4];
                        tokens_1 = (0, totals_1.fromUsage)(result.usage);
                        side_1 = e.agentId === undefined ? 'main' : 'sub';
                        pending = (0, totals_1.bump)(pending, side_1, tokens_1);
                        return [4 /*yield*/, __await((0, claude_code_1.update)($, session, function (totals) { return (0, totals_1.bump)(totals, side_1, tokens_1); }))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, __await(result)];
                    case 5: return [2 /*return*/, _a.sent()];
                }
            });
        });
    });
    on('session.measure', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var cost, previous;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cost = e.cost;
                    if (!cost) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, claude_code_1.read)($, session)];
                case 1:
                    previous = (_a.sent()).usd;
                    if (!(cost.usd !== previous)) return [3 /*break*/, 4];
                    pending = __assign(__assign({}, pending), { usd: pending.usd + (0, totals_1.costDelta)(previous, cost.usd) });
                    return [4 /*yield*/, (0, claude_code_1.update)($, session, function (totals) { return (__assign(__assign({}, totals), { usd: cost.usd })); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, flush($)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('turn.complete', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var result, isMain, line;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    result = _a.sent();
                    isMain = e.agentId === undefined;
                    if (!isMain) return [3 /*break*/, 3];
                    pending = __assign(__assign({}, pending), { turns: pending.turns + 1 });
                    return [4 /*yield*/, (0, claude_code_1.update)($, session, function (totals) { return (__assign(__assign({}, totals), { turns: totals.turns + 1 })); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, flush($)];
                case 4:
                    _a.sent();
                    if (!isMain || e.reason !== 'answer' || !e.usage) {
                        return [2 /*return*/, result];
                    }
                    line = (0, format_1.receipt)(e.durationMs, (0, totals_1.fromUsage)(e.usage));
                    return [2 /*return*/, __assign(__assign({}, result), { text: result.text === e.answer ? line : "".concat(result.text, "\n").concat(line) })];
            }
        });
    }); });
    on('command.run', { command: 'tokens' }, function ($) { return __awaiter(void 0, void 0, void 0, function () {
        var surfaces, _a, _b, _c, _d, _e;
        var _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, refresh($)];
                case 1:
                    _g.sent();
                    return [4 /*yield*/, $.session.surfaces()];
                case 2:
                    surfaces = _g.sent();
                    if (!(surfaces.includes('terminal') || surfaces.includes('desktop'))) return [3 /*break*/, 4];
                    return [4 /*yield*/, $.ui.open({ id: PANE, title: TITLE })
                        // No text: a command's text is a row the model reads on its next turn.
                    ];
                case 3:
                    _g.sent();
                    // No text: a command's text is a row the model reads on its next turn.
                    return [2 /*return*/, {}];
                case 4:
                    _f = {};
                    _a = format_1.summary;
                    _b = ['This session'];
                    return [4 /*yield*/, (0, claude_code_1.read)($, session)];
                case 5:
                    _c = [
                        _a.apply(void 0, _b.concat([_g.sent()]))
                    ];
                    _d = format_1.summary;
                    _e = ['This project'];
                    return [4 /*yield*/, (0, claude_code_1.read)($, project)];
                case 6: return [2 /*return*/, (_f.text = _c.concat([
                        _d.apply(void 0, _e.concat([_g.sent()]))
                    ]).join('\n'),
                        _f)];
            }
        });
    }); });
    on('ui.render', { component: 'Pane', requestId: PANE }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, Box, Button, Text, active, shown, totals;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = $.ui.resolve(e), Box = _a.Box, Button = _a.Button, Text = _a.Text;
                    return [4 /*yield*/, (0, claude_code_1.read)($, tab)];
                case 1:
                    active = _c.sent();
                    _b = {};
                    return [4 /*yield*/, (0, claude_code_1.read)($, session)];
                case 2:
                    _b.session = _c.sent();
                    return [4 /*yield*/, (0, claude_code_1.read)($, project)];
                case 3:
                    _b.project = _c.sent();
                    return [4 /*yield*/, (0, claude_code_1.read)($, all)];
                case 4:
                    shown = (_b.all = _c.sent(), _b);
                    totals = shown[active];
                    return [2 /*return*/, (<Box flexDirection="column" gap={1}>
        <Box gap={2}>
          {TABS.map(function (one) { return (<Button key={one.id} label={one.id === active ? "[".concat(one.label, "]") : one.label} onPress={function () { return (0, claude_code_1.update)($, tab, function () { return one.id; }); }}/>); })}
        </Box>
        <Box flexDirection="column">
          {(0, format_1.rows)(totals).map(function (_a) {
                                var label = _a[0], value = _a[1];
                                return (<Box>
              <Text dimColor>{label.padEnd(21)}</Text>
              <Text>{value}</Text>
            </Box>);
                            })}
        </Box>
      </Box>)];
            }
        });
    }); });
};
exports.register = register;
