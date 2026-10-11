# Tuneup

A setup kit for Claude Code. Two parts, usable separately:

- **Installer**: `npx tuneup` previews, backs up, then merges a lean, right-sized config into the project you run it in. `npx tuneup undo` puts everything back.
- **Dashboard mod**: `/tokens` opens a pane with token use for this session, this project and all projects, and each turn ends with a receipt such as `Done in 42s · 18.4k tokens · 71% from cache`.

Requires Claude Code v2.1.287 or later for the mod (v2.1.286 in the Desktop app).

## Installer

```bash
npx tuneup --dry-run
```

```bash
npx tuneup --profile web-solo-budget
```

```bash
npx tuneup undo
```

Profiles: `web-solo-budget`, `web-solo-speed`. The installer only writes inside the current project (`.claude/settings.json` and a marked block in `CLAUDE.md`), and keeps backups in `~/.tuneup/backups/`.

## Dashboard mod on its own

```bash
claude --plugin-dir ./plugins/tuneup-dashboard
```

The mod makes no network calls, writes only to its own store, and adds nothing to Claude's context. Dollar figures are API-equivalent: subscriptions are not billed per token.

## Development

See `CLAUDE.md` for commands and rules, and `architecture.md` for the design.
