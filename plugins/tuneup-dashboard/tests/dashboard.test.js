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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var ROOT = '/work/app';
var NOON = new Date(2026, 9, 11, 12).getTime();
var USAGE = {
    input_tokens: 1000,
    output_tokens: 400,
    cache_read_input_tokens: 7000,
    cache_creation_input_tokens: 2000,
    model: 'test-model',
};
var PANE = { plugin: 'tuneup-dashboard', component: 'Pane', requestId: 'tokens' };
var PROPS = {
    title: 'Tokens',
    isFocused: true,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
};
// The engine beneath the mod: each call the mod makes is answered from here.
var world = function (on, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.entries, entries = _c === void 0 ? {} : _c, _d = _b.usd, usd = _d === void 0 ? function () { return 0; } : _d, _e = _b.surfaces, surfaces = _e === void 0 ? ['terminal'] : _e;
    // A store of the test's own, so a test reads and writes it as another session would.
    var store = new Map(Object.entries(entries));
    on('store.get', function (_, e) { return ({ value: store.get(e.key) }); });
    on('store.set', function (_, e) {
        store.set(e.key, e.value);
        return { value: undefined };
    });
    on('store.keys', function () { return ({ value: __spreadArray([], store.keys(), true) }); });
    testing_1.mock.clock(on, { now: NOON });
    on('session.root', function () { return ({ value: ROOT }); });
    on('session.surfaces', function () { return ({ value: surfaces }); });
    on('session.usage', function () { return ({
        value: { startedAt: 0, context: { window: 200000 }, rateLimits: [], cost: { usd: usd() } },
    }); });
    on('command.register', function (_, e) { return ({ value: { command: e.name } }); });
    on('ui.open', function () { return ({ value: { isPlaced: true } }); });
    on('session.start', function (_, e) { return ({ cwd: e.cwd }); });
    on('session.end', function () { return ({ sessionId: 's1' }); });
    on('session.measure', function (_, e) { return ({ changed: e.changed }); });
    on('classic.SessionStart', function () { return ({}); });
    on('turn.complete', function (_, e) { return ({ text: e.answer }); });
    on('turn.step', function (_, e) {
        return __asyncGenerator(this, arguments, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, __await({ turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage: USAGE })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    });
    return store;
};
var start = function ($) { return $.session.start({ cwd: ROOT, surface: 'terminal', isInteractive: true }); };
var step = function ($, agentId) { return __awaiter(void 0, void 0, void 0, function () {
    var stream, _a, stream_1, stream_1_1, _, e_1_1;
    var _b, e_1, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                stream = $.turn.step({ turnId: 't1', index: 0, model: 'test-model', messageCount: 1, agentId: agentId });
                _e.label = 1;
            case 1:
                _e.trys.push([1, 6, 7, 12]);
                _a = true, stream_1 = __asyncValues(stream);
                _e.label = 2;
            case 2: return [4 /*yield*/, stream_1.next()];
            case 3:
                if (!(stream_1_1 = _e.sent(), _b = stream_1_1.done, !_b)) return [3 /*break*/, 5];
                _d = stream_1_1.value;
                _a = false;
                _ = _d;
                _e.label = 4;
            case 4:
                _a = true;
                return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_1_1 = _e.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 12];
            case 7:
                _e.trys.push([7, , 10, 11]);
                if (!(!_a && !_b && (_c = stream_1.return))) return [3 /*break*/, 9];
                return [4 /*yield*/, _c.call(stream_1)];
            case 8:
                _e.sent();
                _e.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: return [4 /*yield*/, stream.result];
            case 13:
                _e.sent();
                return [2 /*return*/];
        }
    });
}); };
var complete = function ($, agentId) {
    return $.turn.complete({ answer: 'ok', durationMs: 42000, isAborted: false, turnId: 't1', reason: 'answer', usage: USAGE, agentId: agentId });
};
var tokens = function ($) {
    return $.command.run({
        command: 'tokens',
        args: '',
        origin: { kind: 'composer' },
        presentation: { isFullscreen: true, columns: 120 },
    });
};
var stored = function (store, key) { return store.get(key); };
(0, testing_1.test)('a main turn ends with a receipt', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                world(on);
                return [4 /*yield*/, start($)];
            case 1:
                _b.sent();
                return [4 /*yield*/, step($)];
            case 2:
                _b.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, complete($)];
            case 3:
                _a.apply(void 0, [(_b.sent()).text]).toBe('Done in 42s · 10.4k tokens · 70% from cache');
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)("a subagent's turn and an interrupted turn get no receipt", function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                world(on);
                return [4 /*yield*/, start($)];
            case 1:
                _c.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, complete($, 'agent-1')];
            case 2:
                _a.apply(void 0, [(_c.sent()).text]).toBe('ok');
                _b = testing_1.expect;
                return [4 /*yield*/, $.turn.complete({ answer: '', durationMs: 5, isAborted: true, turnId: 't2', reason: 'aborted' })];
            case 3:
                _b.apply(void 0, [(_c.sent()).text]).toBe('');
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('usage is saved per project and per day, split by main and subagent', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var store, project;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                store = world(on);
                return [4 /*yield*/, start($)];
            case 1:
                _a.sent();
                return [4 /*yield*/, step($)];
            case 2:
                _a.sent();
                return [4 /*yield*/, step($, 'agent-1')];
            case 3:
                _a.sent();
                return [4 /*yield*/, complete($)];
            case 4:
                _a.sent();
                project = stored(store, "project:".concat(ROOT));
                (0, testing_1.expect)(project.main).toEqual({ input: 1000, output: 400, cacheRead: 7000, cacheWrite: 2000 });
                (0, testing_1.expect)(project.sub).toEqual(project.main);
                (0, testing_1.expect)(project.turns).toBe(1);
                (0, testing_1.expect)(stored(store, "day:".concat(ROOT, ":2026-10-11"))).toEqual(project);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a write adds to what another session saved meanwhile', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var before, store, project;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                before = { main: { input: 5, output: 5, cacheRead: 5, cacheWrite: 5 }, sub: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, usd: 1, turns: 3 };
                store = world(on, { entries: (_a = {}, _a["project:".concat(ROOT)] = before, _a) });
                return [4 /*yield*/, start($)];
            case 1:
                _b.sent();
                return [4 /*yield*/, step($)];
            case 2:
                _b.sent();
                store.set("project:".concat(ROOT), __assign(__assign({}, before), { turns: 4 }));
                return [4 /*yield*/, complete($)];
            case 3:
                _b.sent();
                project = stored(store, "project:".concat(ROOT));
                (0, testing_1.expect)(project.turns).toBe(5);
                (0, testing_1.expect)(project.main.input).toBe(1005);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('only cost spent after the session was first seen is added to the project', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var usd, store;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                usd = 2;
                store = world(on, { usd: function () { return usd; } });
                return [4 /*yield*/, start($)];
            case 1:
                _a.sent();
                usd = 2.5;
                return [4 /*yield*/, $.session.measure({ context: { window: 200000 }, rateLimits: [], cost: { usd: usd }, changed: ['cost'] })];
            case 2:
                _a.sent();
                (0, testing_1.expect)((stored(store, "project:".concat(ROOT))).usd).toBe(0.5);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('the pane draws on terminal and desktop and switches tabs', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var other, _i, _a, surface, ui, _b, _c, _d, _e;
    var _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                other = { main: { input: 50000, output: 0, cacheRead: 0, cacheWrite: 0 }, sub: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, usd: 0, turns: 9 };
                world(on, { entries: { 'project:/work/other': other } });
                return [4 /*yield*/, start($)];
            case 1:
                _h.sent();
                return [4 /*yield*/, step($)];
            case 2:
                _h.sent();
                return [4 /*yield*/, complete($)];
            case 3:
                _h.sent();
                _i = 0, _a = ['terminal', 'desktop'];
                _h.label = 4;
            case 4:
                if (!(_i < _a.length)) return [3 /*break*/, 14];
                surface = _a[_i];
                return [4 /*yield*/, $.ui.mount(__assign(__assign({}, PANE), { surface: surface, props: PROPS }))];
            case 5:
                ui = _h.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'session' })];
            case 6:
                _b.apply(void 0, [(_f = (_h.sent())) === null || _f === void 0 ? void 0 : _f.props.label]).toBe('[This session]');
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: '10.4k' })];
            case 7:
                _c.apply(void 0, [_h.sent()]).toBeDefined();
                return [4 /*yield*/, ui.press({ key: 'all' })];
            case 8:
                _h.sent();
                _d = testing_1.expect;
                return [4 /*yield*/, ui.find({ key: 'all' })];
            case 9:
                _d.apply(void 0, [(_g = (_h.sent())) === null || _g === void 0 ? void 0 : _g.props.label]).toBe('[All projects]');
                _e = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Text', text: '60.4k' })];
            case 10:
                _e.apply(void 0, [_h.sent()]).toBeDefined();
                return [4 /*yield*/, ui.press({ key: 'session' })];
            case 11:
                _h.sent();
                return [4 /*yield*/, ui.unmount()];
            case 12:
                _h.sent();
                _h.label = 13;
            case 13:
                _i++;
                return [3 /*break*/, 4];
            case 14: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('/tokens opens the pane and leaves no text for the model', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                world(on);
                return [4 /*yield*/, start($)];
            case 1:
                _b.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, tokens($)];
            case 2:
                _a.apply(void 0, [_b.sent()]).toEqual({});
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('/tokens answers in text where nothing can draw', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var text;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                world(on, { surfaces: [] });
                return [4 /*yield*/, start($)];
            case 1:
                _a.sent();
                return [4 /*yield*/, step($)];
            case 2:
                _a.sent();
                return [4 /*yield*/, complete($)];
            case 3:
                _a.sent();
                return [4 /*yield*/, tokens($)];
            case 4:
                text = (_a.sent()).text;
                (0, testing_1.expect)(text).toContain('This session: Input 1.0k');
                (0, testing_1.expect)(text).toContain('This project: Input 1.0k');
                return [2 /*return*/];
        }
    });
}); });
