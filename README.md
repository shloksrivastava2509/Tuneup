# Tuneup

**Role-specific setups for Claude Code, benchmarked before they ship.**

Tuneup configures Claude Code for the work you actually do. A data scientist, a front-end developer and a back-end developer need different instructions, different skills and different tools connected. Tuneup gives each role a profile that sets those up in one command, and it only publishes a profile once a benchmark shows it beats plain Claude Code at little extra cost.

The first profile, **Token info**, is available now: a dashboard mod that shows token use, cache share, cost and context inside Claude Code, so the cost side of every profile is visible while you work.

> **Status:** early development. The Token info profile and the installer foundation work today. Role profiles are the next phase and are not yet available. The package is not on npm yet, so everything is installed from this repository.

---

## Contents

- [What Tuneup does](#what-tuneup-does)
- [Role profiles (in development)](#role-profiles-in-development)
- [How profiles are benchmarked](#how-profiles-are-benchmarked)
- [Token info profile](#token-info-profile)
- [Installer](#installer)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What Tuneup does

| Part | What it is | Available |
| --- | --- | --- |
| **Role profiles** | A setup per role: a professional `CLAUDE.md`, role-specific skills, and connections to the tools that role uses every day | In development |
| **Installer** | Previews, backs up and applies a profile to a project, and can undo it | Yes, with two starter profiles |
| **Token info profile** | Token use, cache share, API-equivalent cost and context inside Claude Code, in the terminal and the Desktop app | Yes |

Three principles run through all of it:

- **Proven, not promised.** A profile is published only when a benchmark shows it does better than plain Claude Code.
- **Token-efficient.** Every line of `CLAUDE.md` and every connected tool is sent with every request. Profiles keep that to the minimum that earns its cost, so smaller models such as Claude Haiku stay useful.
- **Safe to try.** The installer never overwrites your files. It shows a diff first, backs up everything it touches, and can put it all back.

---

## Role profiles (in development)

Each role gets at least three features on top of plain Claude Code:

1. **A role-specific `CLAUDE.md`** that sets Claude up to work as a professional in that role: conventions, checks and habits that matter for the job.
2. **Role-specific skills**, which load only when needed, so they cost nothing until they are used.
3. **Connections to everyday tools**, so Claude Code can work with the software the role relies on. For a data scientist, that might be spreadsheets and notebooks.

Planned roles include:

- Front-end developer
- Back-end developer
- Data scientist
- "Vibe coder" (building with Claude without writing much code by hand)

For each role, the work is either a new profile or an improvement to the features that role already has. When you run Tuneup for a role, it applies that role's features to your project, using the same preview, backup and undo as the rest of the installer.

---

## How profiles are benchmarked

A profile passes when Claude Code **with** the profile's `CLAUDE.md` and skills does better than Claude Code **without** them, at the minimum extra cost needed.

Both halves count:

- **Better:** the profile must improve results on that role's tasks.
- **Minimum extra cost:** the extra tokens a profile adds must be as small as possible. A profile that is slightly better but much more expensive does not pass.

Results are checked on smaller models such as Claude Haiku as well as larger ones, since a lean, well-targeted setup should make a small model noticeably more capable.

The exact task sets and scoring for each role are being designed and will be published alongside the first role profiles.

---

## Token info profile

Tuneup's first profile, available now. It adds a receipt under each answer and a compact token summary above the prompt, in the terminal and the Desktop app, and costs zero tokens to run.

```text
◉ Done in 42s  ·  18.4k tokens  ·  71% from cache  ·  $0.12
```

- **Receipt** under every answer, marked with a gold coin. It glows softly under the pointer, and a click opens the Token info box.
- **Token info box** above the prompt: total tokens, cache share, API-equivalent cost, turns, the four token types, and how full the context is, for this session, this project or all projects.
- **Compact reminder** when the context passes 60% full.

**Install in two commands:**

```bash
claude plugin marketplace add shloksrivastava2509/Tuneup
```

```bash
claude plugin install tuneup-dashboard@tuneup
```

Then start a new session. Full details, usage and troubleshooting: **[Token info README](plugins/tuneup-dashboard/README.md)**.

---

## Installer

The installer applies a profile to the project you run it in.

### What it changes

- **`.claude/settings.json`:** the profile's model, effort and safe permission rules, merged into what is already there. Existing keys are never removed, and lists such as permission rules are combined rather than replaced.
- **`CLAUDE.md`:** a short block written between `<!-- tuneup:start -->` and `<!-- tuneup:end -->` markers. Nothing outside the markers is touched. If the project uses `AGENTS.md` and has no `CLAUDE.md`, no `CLAUDE.md` is created.
- **The Token info mod:** installed for the project, if your Claude Code version supports it.

It writes only inside the current project. Your global `~/.claude` folder is read, never changed.

### Safety

1. **Preview.** Every change is shown as a diff, with an estimate of how many tokens it adds to each request, before anything is written.
2. **Backup.** Every file it will touch is copied to `~/.tuneup/backups/<timestamp>/`, with a manifest, before the first write.
3. **Undo.** `undo` restores each file byte for byte, deletes files it created, and uninstalls the mod. If you edited a file after the install, your version is saved next to the backup before it is restored.

### Profiles available now

`token-info` is the first profile. The two `web-solo` profiles exist to test the installer and will be replaced by role profiles.

| Profile | Model | Effort | Also adds |
| --- | --- | --- | --- |
| `token-info` | Unchanged | Unchanged | The Token info mod only; no settings or `CLAUDE.md` changes |
| `web-solo-budget` | Sonnet | Medium | Safe git and test permissions, short `CLAUDE.md` block, Token info mod |
| `web-solo-speed` | Opus | High | Same as above |

### Run from a clone

Requires Node.js 20 or later.

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

| Option | Does |
| --- | --- |
| `--profile <id>` | Apply this profile (asked for when left out) |
| `--dry-run` | Show the preview and stop |
| `-y`, `--yes` | Apply without asking for confirmation |
| `--marketplace <source>` | Where to install the mod from: a path, a git URL or `owner/repo` |
| `undo` | Restore this project's most recent backup |

---

## Repository layout

```text
Tuneup/
├── installer/                     The installer (TypeScript)
│   ├── bin.ts, cli.ts             Entry point and command-line flow
│   ├── merge.ts, plan.ts, ...     Pure logic: merging, planning, previews
│   ├── backup.ts, apply.ts, undo.ts   File changes, backups and undo
│   └── *.test.ts                  Tests, run against temporary folders
├── catalog/features.json          Features a profile can enable, each with a minimum Claude Code version
├── profiles/                      One JSON file per profile
├── templates/                     CLAUDE.md blocks and other files profiles copy
├── plugins/tuneup-dashboard/      The Token info profile's mod, with its own README
│   ├── hooks/register.tsx         Event hooks and the /tokens box
│   ├── hooks/totals.ts, format.ts Token arithmetic and display text
│   ├── hooks/rates.ts             Per-model prices and the date they were checked
│   └── tests/                     Mod tests
├── .claude-plugin/marketplace.json  Makes this repository a plugin marketplace
├── architecture.md                Design details
└── CLAUDE.md                      Rules and commands for working on this repository
```

Profiles and the feature catalog are data, not code: adding a profile or a feature means adding JSON, not changing the installer.

---

## Development

```bash
npm install
```

| Task | Command |
| --- | --- |
| Installer tests | `npm test` |
| Mod tests | `npm run test:mod` |
| Check the mod will load | `npm run validate:mod` |
| Build the installer | `npm run build` |
| Type-check | `npm run typecheck` |

### Working on the mod

An installed mod runs from a frozen, versioned copy, so edits don't reach it until the version is bumped, the plugin is updated and a new session is started. For day-to-day work, load the mod straight from this folder instead.

For one terminal session, which reloads when you save:

```bash
claude --plugin-dir ./plugins/tuneup-dashboard
```

For every session, including the Desktop app, add these under `env` in `~/.claude/settings.json`, and disable the installed copy so two copies don't both run:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "/absolute/path/to/Tuneup/plugins/tuneup-dashboard",
    "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"
  }
}
```

```bash
claude plugin disable tuneup-dashboard@tuneup
```

When releasing a change to the mod, bump `version` in `plugins/tuneup-dashboard/.claude-plugin/plugin.json`.

See [`CLAUDE.md`](CLAUDE.md) for the project rules and [`architecture.md`](architecture.md) for the design.

---

## Roadmap

**Now: role profiles**

- Define the benchmark for each role: tasks, scoring and cost measurement
- Build the first role profiles: `CLAUDE.md`, skills and tool connections
- Publish a role only once it passes its benchmark

**Next**

- Publish to npm, so the installer runs as `npx tuneup`
- A short interview that picks the right role profile for you
- `tuneup update`, to offer new Claude Code features as they ship
- In Token info: waiting-time tracking and a 14-day token history

**Later**

- Team profiles
- `tuneup report`, with CSV export of token use
- Community-contributed role profiles, held to the same benchmark

---

## Contributing

Tuneup is early and its structure is still changing. Issues with ideas for roles, the tools those roles use every day, or problems with the mod are welcome. Before opening a pull request, run `npm test` and `npm run test:mod`, and read [`CLAUDE.md`](CLAUDE.md) for the project rules.

## License

[MIT](LICENSE)
