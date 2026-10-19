# Token info

**See what every Claude Code turn costs, right where you work.**

Token info is the first [Tuneup](../../README.md) profile. It adds a receipt under each answer and a compact token summary above the prompt, in the Claude Code terminal and in the Code tab of the Claude Desktop app.

![Claude Code](https://img.shields.io/badge/Claude_Code-2.1.287%2B-D97757) ![Cost to run](https://img.shields.io/badge/context_cost-0_tokens-2E7D32) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Install

You need Claude Code v2.1.287 or later (v2.1.286 or later in the Desktop app). Check with `claude --version`.

**1. Add the Tuneup marketplace**

```bash
claude plugin marketplace add shloksrivastava2509/Tuneup
```

**2. Install Token info**

```bash
claude plugin install tuneup-dashboard@tuneup
```

**3. Start a new session**

Open a new Claude Code session in the terminal, or click **+ New** in the Desktop app's Code tab. Send any prompt, and the receipt appears under the answer.

> **Prefer to stay inside Claude Code?** Run `/plugin marketplace add shloksrivastava2509/Tuneup`, then `/plugin install tuneup-dashboard@tuneup`, then `/reload-plugins`.

---

## What you get

### A receipt under every answer

```text
◉ Done in 42s  ·  18.4k tokens  ·  71% from cache  ·  $0.12
```

- A small **gold coin** marks each receipt.
- Move the pointer over it and the text **glows softly**, from dim grey to pale blue-white, then fades back when the pointer leaves.
- **Click it** to open the Token info box. Click again to close it.

### The Token info box

A compact summary above the prompt, with three views:

```text
╭──────────────────────────────────────────────────────────────────────────╮
│ ◉ Token info    1: This session   2: This project   3: All projects      │
│ Total tokens       From cache         API-equivalent cost  Turns         │
│ 58.1k              77%                $0.10                1             │
│ Input (uncached) 2   Output 1.2k   Cache read 44.1k   Cache write 12.9k  │
│ Per turn 58.1k   Context used 31% of 200.0k                              │
╰──────────────────────────────────────────────────────────────────────────╯
```

| Figure | What it means |
| --- | --- |
| Total tokens | Every token sent and received |
| From cache | Share of the prompt served from the prompt cache. Green at 50% or more, yellow below |
| API-equivalent cost | What the tokens would cost at Anthropic's published API prices |
| Turns | Prompts answered |
| Input (uncached), Output, Cache read, Cache write | The four token types behind the total |
| Subagents | Share of tokens used by subagents |
| Per turn | Average tokens per answer |
| Context used | How full the context window is. Yellow, with a `/compact` hint, past 60% |

### A reminder to compact

When the context window passes **60% full**, a short notice suggests running `/compact`. It appears once each time the context fills up, so it never nags.

---

## How to use it

| To | Do this |
| --- | --- |
| Open or close the Token info box | Type `/tokens`, or click any receipt |
| Switch between session, project and all projects | Type `1`, `2` or `3` into an empty prompt, or click the tab |
| Hide the box for now | Click the `[-]` beside it |
| Free up context | Run `/compact` when the reminder appears |

---

## How costs are calculated

- Each request is priced from its four token types at the model's published list price. Prices and the date they were last checked live in one file: [`hooks/rates.ts`](hooks/rates.ts).
- A model without a published price, such as a non-Anthropic model, shows `—` instead of a number.
- Figures are **API-equivalent estimates**. Pro and Max subscriptions are not billed per token.
- Cache writes are priced at the 5-minute cache rate, because Claude Code does not report which cache lifetime a request used.

---

## Privacy and cost

- **No network calls.** Everything is computed on your machine.
- **Nothing added to Claude's context.** Token info costs zero tokens to run.
- **One place it writes:** its own store under `~/.claude/plugins/store/`, holding your token totals.

---

## Where it works

| Where you run Claude Code | Receipt | Token info box |
| --- | --- | --- |
| Terminal | Under each answer | Above the prompt |
| Desktop app, Code tab | Under each answer | Above the prompt |
| VS Code chat panel, `claude -p`, Agent SDK | Plain text, where shown | `/tokens` prints a text summary |

---

## Update and uninstall

Update to the latest version, then start a new session:

```bash
claude plugin update tuneup-dashboard@tuneup
```

Remove it:

```bash
claude plugin uninstall tuneup-dashboard@tuneup
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| No receipt under answers | Start a new session: a session that was already open keeps the version it started with. Then check `claude --version` is 2.1.287 or later. |
| `/tokens` is not a command | Run `claude plugin list` and check `tuneup-dashboard@tuneup` is enabled. |
| Cost shows `—` | The model has no published Anthropic price, so its cost is not estimated. |
| Receipt shows twice | Two copies are loaded, usually an installed copy plus a development copy. Disable one with `claude plugin disable tuneup-dashboard@tuneup`. |

---

## For developers

The mod's source is in this folder: [`hooks/register.tsx`](hooks/register.tsx) (events and drawing), [`hooks/receipt.tsx`](hooks/receipt.tsx) (the glowing receipt), [`hooks/totals.ts`](hooks/totals.ts) and [`hooks/format.ts`](hooks/format.ts) (arithmetic and text), and [`tests/`](tests/). Run the tests with `claude plugin test .` from this folder. See the main [README](../../README.md#development) for the development setup.

## License

[MIT](../../LICENSE)
