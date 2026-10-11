# Tuneup

An open-source setup kit for Claude Code. It has two parts that work independently:

- **Dashboard mod** – shows token use, cache share and cost inside Claude Code.
- **Installer** – previews, backs up and applies a lean, right-sized configuration to a project, and can undo it.

**Status:** early MVP, under active development. The package is not on npm yet, so both parts are installed from this repository.

## Dashboard mod

After each turn, a receipt appears under the answer:

```text
✓ Done in 42s  ·  18.4k tokens  ·  71% from cache  ·  $0.12
```

`/tokens` shows or hides a small box above the prompt, with tabs for this session, this project and all projects:

```text
╭──────────────────────────────────────────────────────────────────────────╮
│ Tokens   1: This session   2: This project   3: All projects             │
│ Total tokens       From cache         API-equivalent cost  Turns         │
│ 58.1k              77%                $0.10                1             │
│ Input (uncached) 2   Output 1.2k   Cache read 44.1k   Cache write 12.9k  │
╰──────────────────────────────────────────────────────────────────────────╯
```

The mod only reads events and draws. It makes no network calls, writes only to its own store, and adds nothing to Claude's context. Cost figures are API-equivalent estimates from published list prices; subscriptions are not billed per token.

### Install

Requires Claude Code v2.1.287 or later (v2.1.286 in the Desktop app).

```bash
claude plugin marketplace add shloksrivastava2509/Tuneup
```

```bash
claude plugin install tuneup-dashboard@tuneup
```

To try it for one session without installing, clone the repository and run:

```bash
claude --plugin-dir ./plugins/tuneup-dashboard
```

## Installer

The installer writes only inside the project it runs in: `.claude/settings.json` and a marked block in `CLAUDE.md`. It shows a diff before changing anything, backs up every file it touches to `~/.tuneup/backups/`, and never removes existing settings.

Two profiles are available:

| Profile | Model | Effort |
| --- | --- | --- |
| `web-solo-budget` | Sonnet | Medium |
| `web-solo-speed` | Opus | High |

### Run from a clone

```bash
git clone https://github.com/shloksrivastava2509/Tuneup.git && cd Tuneup && npm install && npm run build
```

Then, from the project you want to configure (replace the path with your clone's location):

```bash
node /path/to/Tuneup/dist/installer/bin.js --dry-run
```

```bash
node /path/to/Tuneup/dist/installer/bin.js --profile web-solo-budget
```

```bash
node /path/to/Tuneup/dist/installer/bin.js undo
```

## Roadmap

**Next**

- Publish to npm, so the installer runs as `npx tuneup`
- A short interview that picks the profile for you, and more profiles
- "Waiting time" tracking: how long Claude waited for you, and you for Claude
- A context health band with a hint when it is time to compact
- A 14-day token history chart
- `tuneup update`, to offer new Claude Code features as they ship

**Later**

- Team profiles
- `tuneup report` with CSV export
- Community-contributed profiles

## Development

```bash
npm install
```

```bash
npm test
```

```bash
npm run test:mod
```

`CLAUDE.md` lists all commands and project rules, and `architecture.md` describes the design.

## License

MIT
