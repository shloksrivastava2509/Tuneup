# Tuneup architecture

Tuneup has two independent parts: an **installer** that runs once and edits config files, and a **dashboard mod** that runs inside every Claude Code session and only reads events and draws. The mod can be installed on its own by people who already have a setup they like.

```mermaid
flowchart LR
    U[User] -->|npx tuneup| I[Installer CLI]
    I -->|reads| D[Existing config + claude --version]
    I -->|picks| P[Profile JSON]
    I -->|checks| C[Feature catalog]
    I -->|backs up, then merges| F[Config files<br/>settings.json · CLAUDE.md<br/>rules · agents · MCP]
    I -->|installs| PL[tuneup plugin]
    PL --> M[Dashboard mod]
    PL --> H[Settings hooks · skills · subagents]
    M -->|turn.step / turn.complete / Notification| S[($.store per project)]
    S --> V[/tokens pane · context band · receipts · toasts/]
```

## 1. Installer

Distributed as an npm package so `npx tuneup` works on macOS, Linux and Windows. No .exe.

### Flow

1. **Detect** – Claude Code installed? `claude --version`. Read `~/.claude/settings.json`, project `.claude/`, `CLAUDE.md`, `AGENTS.md`. Detect OS, shell, `jq`, Git Bash.
2. **Interview** – about six questions: what they build, solo or team, API key or Pro/Max subscription, cost vs speed, services used (GitHub, database, Figma, browser).
3. **Pick a profile** – map answers to a file in `profiles/`.
4. **Resolve features** – filter `catalog/features.json` by the profile and the installed Claude Code version.
5. **Preview** – show a diff of every file to be created or changed, plus an estimate of always-loaded context added.
6. **Back up and merge** – copy touched files to `~/.tuneup/backups/<timestamp>/`, then merge.
7. **Install the plugin** – add this repo as a marketplace and install `tuneup-dashboard@tuneup`.
8. **Verify** – run `claude plugin validate`; suggest `/doctor` in the first session.

### Commands

| Command | Does |
| --- | --- |
| `npx tuneup` | Full flow above. `--profile <id>`, `--dry-run` (stop after the preview), `--yes`, `--marketplace <source>` |
| `npx tuneup undo` | Restore this project's most recent backup |
| `npx tuneup update` | Re-check the catalog against the installed version, offer new features |
| `npx tuneup report` | Print token totals from the mod's saved data |

### Merge rules

- **JSON settings:** deep-merge keys. Never delete user keys. Arrays (e.g. permission allow rules) are unioned.
- **CLAUDE.md:** write only between `<!-- tuneup:start -->` and `<!-- tuneup:end -->`. If the repo already uses `AGENTS.md` and has no `CLAUDE.md`, don't create a duplicate.
- **Scope:** the installer writes only inside the project it runs in (`.claude/settings.json`, `CLAUDE.md`) and installs the plugin at project scope. `~/.claude` is read, never written; backups go to `~/.tuneup/backups/` (`TUNEUP_HOME` moves it).
- **Formatting:** a settings file that already holds every key is left byte for byte as it is.
- **Every run writes a manifest** of what changed, before the first write. `undo` uses it to restore files byte for byte, delete files the run created, uninstall the plugin and remove a marketplace the run registered. A file edited after the run is copied to `before-undo/` in the backup first.

## 2. What the installer configures

| Piece | Writes | Why |
| --- | --- | --- |
| Settings | Default model and effort per profile, allow rules for safe commands, prompt cache TTL | Fewer permission stops, cheaper defaults |
| CLAUDE.md | Short template, ~60 line cap | Less always-loaded context |
| Path rules | `.claude/rules/*.md` with `paths:` frontmatter | Instructions load only when relevant |
| MCP servers | Only the ones the user picked, project-scoped | Each server's tools cost context every request |
| Subagents | Researcher + test runner on a cheaper model | Heavy reading stays out of the main context |
| Skills | 2–3 small skills | Full text loads only when used |
| Settings hooks | `SessionStart` stale-resume warning using `context_tokens` and `estimated_cache_write_usd` | Warns before an expensive uncached resume |
| Status line | Model, context %, session cost | Fallback where mods can't draw |

## 3. Dashboard mod

A Claude Code mod (plugin with JS/TS function hooks). Requires Claude Code v2.1.287+ in the terminal or v2.1.286+ in the Desktop app.

### Files

```text
plugins/tuneup-dashboard/
├── .claude-plugin/plugin.json   # names the state contract: "types": "./types/index.d.ts"
├── hooks/hooks.json             # { "modules": ["./register.tsx"] }, loaded as-is, no build step
├── hooks/register.tsx           # hook wiring
├── hooks/totals.ts · format.ts  # pure helpers
├── types/index.d.ts             # $.state declarations
└── tests/*.test.ts              # claude plugin test
```

### Events used

| Event | Used for |
| --- | --- |
| `session.start` | Register `/tokens` command, load saved totals (a `$.state` write redraws its readers, so no timer) |
| `classic.SessionStart` (`clear`, `resume`, `fork`) | Reload totals into `$.state` after resets |
| `turn.step` | Async generator hook. Read `result.usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`; may be `null`) per request; split by `e.agentId` |
| `turn.complete` | `durationMs` and `usage` for the turn receipt, returned as `{ text }` (shown under the answer, not recorded in the transcript). Also fires for subagent runs: no receipt when `e.agentId` is set. Saves to `$.store` |
| `session.measure` | Session cost from Claude Code's own ledger (`cost.usd`); the increase since the last reading is added to the project and day totals |
| `session.end` | Save anything not yet written |
| `classic.Notification` (`permission_prompt`, `idle_prompt`) | Start the "Claude waited for you" clock |
| `prompt.submit` / `tool.check` resolving | Stop the waiting clock |
| `command.run` (`tokens`) | Open the pane and return `{}`: a command's `text` is read by the model, so text is returned only where nothing can draw |
| `ui.render` (`Pane`, `AbovePrompt`) | Draw sidebar and context band |

### State

| Where | What |
| --- | --- |
| Module variables | Usage not yet saved, waiting-clock start time |
| `$.state` | Current session totals, loaded project and all-project totals, active tab (survive module reload, redraw automatically) |
| `$.store` | Per-project totals and daily history, keyed `project:<path>` and `day:<project>:<yyyy-mm-dd>`, where the path is `$.session.root()` |

Write each project/day under its own key and re-read before writing, because several sessions share one store.

### What the user sees

- **`/tokens` pane** – tabs: This session · This project · All projects. Tokens by type, API-equivalent cost, subagent share.
- **Sparkline** – tokens per day, last 14 days (`Raster`, terminal only; text in Desktop).
- **Context band** above the prompt – context bar and a `/compact` hint past a threshold.
- **Turn receipt** – "Done in 42s · 18.4k tokens · 71% from cache".
- **Toasts** – daily budget thresholds the user set.

### Constraints

- Read-only: no network, no file writes outside `$.store`, never adds to Claude's context.
- Open the pane only from `/tokens`; self-opened panes need ≥144 columns.
- VS Code chat panel and `claude -p` run hooks but don't draw; fall back to the status line and receipt text.
- Dollar figures are labeled "API-equivalent"; subscriptions aren't billed per token.

## 4. Feature catalog

`catalog/features.json`, one entry per feature:

```json
{
  "id": "dashboard-mod",
  "minVersion": "2.1.287",
  "profiles": ["*"],
  "install": { "plugin": "tuneup-dashboard@tuneup" },
  "why": "Token sidebar and waiting timer inside Claude Code"
}
```

`install` is one of `{ "plugin": "<name>@<marketplace>" }`, `{ "settings": { ... } }` (merged into `settings.json`) or `{ "claudeMd": "templates/<file>" }` (written between the tuneup markers).

A weekly GitHub Action diffs the official Claude Code changelog and opens an issue per new feature; a maintainer decides whether it enters a profile.

## 5. Profiles

`profiles/<name>.json` selects catalog entries and template variables. `settings` holds real `settings.json` keys and is merged as written:

```json
{
  "id": "web-solo-budget",
  "match": { "stack": "web", "team": false, "priority": "cost" },
  "title": "Web, solo, lowest cost",
  "features": ["dashboard-mod", "lean-claude-md", "safe-allow-rules"],
  "settings": { "model": "sonnet", "effortLevel": "medium" },
  "mcp": []
}
```

## 6. Repo layout

```text
tuneup/
├── installer/
├── catalog/features.json
├── profiles/
├── templates/
├── plugins/tuneup-dashboard/
├── .claude-plugin/marketplace.json
├── .github/workflows/
├── CLAUDE.md
└── architecture.md
```

## 7. Roadmap

| Phase | Scope | Gate to next |
| --- | --- | --- |
| MVP | Dashboard mod (`/tokens` pane, turn receipts), installer with 2 profiles, backup/preview/undo | 10 testers use it for a week with no broken configs |
| v1 | Interview + 6 profiles, waiting timer, context band, sparkline, catalog + `update` | Catalog CI passes on the latest Claude Code release |
| v2 | Team profiles, `report` with CSV export, community profile PRs, changelog bot | — |

## 8. Decisions

| Decision | Reason |
| --- | --- |
| npm/npx, not .exe | Cross-platform, inspectable, no antivirus flags |
| Right-sized, not "enable everything" | Every MCP server and always-loaded file costs tokens per request |
| Mod separate from installer | Mod is low-risk and useful alone; ship it first |
| TypeScript everywhere | One language for contributors |
| Repo is its own marketplace | `claude plugin install` works without npm |
