# Tuneup

Open-source setup kit for Claude Code. Two parts:

1. **Installer** (`npx tuneup`): interviews the user, picks a profile, previews changes, backs up, then merges lean config into `settings.json`, `CLAUDE.md`, rules, agents and MCP config.
2. **Dashboard mod** (`plugins/tuneup-dashboard`): a Claude Code mod that shows tokens per session/project, waiting time and context health inside Claude Code.

Design details live in `architecture.md`. Read it before changing structure.

## Layout

- `installer/` – `bin.ts` (entry), `cli.ts` (flow), pure core (`merge.ts`, `catalog.ts`, `plan.ts`, `preview.ts`), I/O (`backup.ts`, `apply.ts`, `undo.ts`, `claude.ts`), tests beside them (`*.test.ts`)
- `catalog/features.json` – version-gated list of Claude Code features the installer can enable
- `profiles/` – one JSON file per profile (e.g. `web-solo-budget.json`)
- `templates/` – CLAUDE.md, rules, agents and skills the installer copies
- `plugins/tuneup-dashboard/` – the mod (`.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`, `types/`, `tests/`)
- `.claude-plugin/marketplace.json` – makes this repo a plugin marketplace

## Commands

- Install dev dependencies: `npm install`
- Mod, validate: `npm run validate:mod` (add `-- --strict` to fail on warnings)
- Mod, tests: `npm run test:mod` (`claude plugin test`, runs `plugins/tuneup-dashboard/tests/*.test.ts`)
- Mod, try in a session: `claude --plugin-dir ./plugins/tuneup-dashboard`, then `/tokens`
- Mod, headless smoke test (no model call): `claude -p --plugin-dir ./plugins/tuneup-dashboard "/tokens"`
- Installer, tests: `npm test`
- Installer, build: `npm run build` (output in `dist/`)
- Installer, run locally: `node dist/installer/cli.js --dry-run` (set `TUNEUP_HOME` to a temp dir to keep backups out of `~/.tuneup`)
- Type-check both: `npm run typecheck`. The mod half needs `plugins/tuneup-dashboard/.claude-plugin/types/`, which Claude Code writes the first time it loads the mod in an interactive session (it is git-ignored).
- Validate the marketplace: `claude plugin validate .`

## Rules

- **Never overwrite user files.** Back up to `~/.tuneup/backups/<timestamp>/`, merge JSON keys, and edit `CLAUDE.md` only inside `<!-- tuneup:start -->` / `<!-- tuneup:end -->` markers. Every write must be undoable.
- **The mod is read-only.** No network calls, no file writes outside `$.store`, never adds text to Claude's context. It must cost zero tokens.
- **Profiles and the catalog are data, not code.** New features or profiles go in JSON; every catalog entry needs `minVersion`.
- **Lean by default.** Anything that adds always-loaded context (MCP servers, CLAUDE.md lines) is opt-in. Templates stay short.
- **Cross-platform.** Test paths on Windows; hooks must work with Git Bash or PowerShell.
- TypeScript, strict mode, for both installer and mod.
- **Installer tests never touch the real machine.** `main(argv, deps)` takes its `claude` runner, cwd and env as arguments; tests pass a fake runner and temp dirs. Keep new I/O behind `deps`.

## Mod gotchas

- The mod has no build step: Claude Code loads `hooks/register.tsx` directly. `hooks.json` must name that file, and `plugin.json` must name the state contract (`"types": "./types/index.d.ts"`).
- Register each event once per matcher, or the module fails to load.
- A helper that takes `$` must be a top-level function declaration in `register.tsx`, and `read`/`update` must be given an atom by name (no lookup tables), or `claude plugin validate` refuses the module.
- `ui.render` hooks can read `$.state` but not write it; write from callbacks or other hooks. A state write redraws its readers, so no redraw timer is needed.
- `turn.step` hooks are async generators (`async function*`, `yield* next(e)`). Usage is on the result, snake_case (`cache_read_input_tokens`), and can be `null`.
- `turn.step` and `turn.complete` also fire for subagents; check `e.agentId`.
- A `command.run` answer's `text` is read by the model on its next turn. Return `{}` when a pane can draw.
- `Raster` is terminal-only: check `e.surface` and fall back to text.
- Panes opened without user action only show in terminals ≥144 columns, so open the pane from `/tokens`.
- In tests the engine's `$` has no `$.store`: answer `store.get`/`store.set`/`store.keys` from a `Map` in the test.
- Requires Claude Code v2.1.287+ (terminal) or v2.1.286+ (Desktop).
