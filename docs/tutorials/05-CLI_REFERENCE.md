# Tutorial 5: CLI Reference

Every command, flag and message of `speckit-ai` in one place. For the story behind the flow, read tutorials 1–2 first.

- Run commands with `npx speckit-ai <command>` from your **project root**.
- Exit code `0` = success, `1` = error (including a failed `lint`, `done` gate or `review`).
- Paths in messages use your OS separator (`\` on Windows).
- `<name>` means the name of an active work (see `speckit-ai status`). You only need it when more than one work is active.

| Command | One line |
|---|---|
| [`speckit-ai [--mode=...]`](#scaffold-speckit-ai---modenewexistingauto) | Set up docs, specs folders, templates and AI skills |
| [`--init-hook [--force]`](#--init-hook---force) | Run `lint` before every commit |
| [`idea`](#idea-title) | Save an idea in the backlog |
| [`start`](#start-title-or-idea---affectsab) | Start a new feature, or a change to existing features |
| [`status`](#status---json) | Active works and ideas in dependency order |
| [`done`](#done-name---force) | Check the gates, write the specs, archive the work files |
| [`generate adr\|contract`](#generate-adrcontract-title---forfeature---workname) | Decision record / contract |
| [`generate tests`](#generate-tests-name) | Test skeleton from the acceptance criteria |
| [`lint`](#lint) | Check spec structure |
| [`handoff`](#handoff-name) / [`review`](#review-name---refpath) | AI progress summary / independent code review |
| [`serve`](#serve) | Browse docs and specs in a browser |

---

## Scaffold: `speckit-ai [--mode=new|existing|auto]`

Sets up a project. Safe to run again: files that already exist are **never overwritten** (they show as `[skip]`).

| Mode | What you get |
|---|---|
| `--mode=new` (default) | Best-practice docs for the detected framework |
| `--mode=existing` | Skeleton docs with `<!-- AI-PROMPT: ... -->` markers for your AI agent to fill from the real code |
| `--mode=auto` | The CLI sends your project structure and config files (`package.json`, `go.mod`, ...) to an LLM and writes `docs/technology.md` and `docs/project-overview.md` |

`--mode=auto` needs an API key in the environment or in the project's `.env`: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (Gemini wins if several are set).

It creates `.agents/`, `CLAUDE.md`, `.cursorrules`, `docs/`, and `specs/` (`_template.md`, `_workflow.md`, `ideas/`, `active/`, `features/`, `decisions/`, `contracts/`), then adds those paths to `.git/info/exclude` ("stealth": nothing is ever committed unless you decide to).

Errors: `Invalid --mode="x". Valid values: new, existing, auto`.

## `--init-hook [--force]`

```bash
npx speckit-ai --init-hook
```

Writes `.git/hooks/pre-commit`, which runs `npx speckit-ai lint` and blocks the commit if it fails (skip once with `git commit --no-verify`).

- Re-running updates a hook created by `speckit-ai`.
- A `pre-commit` hook written by someone else is **not** overwritten: the command stops. Add `--force` to replace it.
- Removes the old `commit-msg` hook of speckit-ai 1.x if present.

## `idea "<Title>"`

```bash
npx speckit-ai idea "Order refund"
# [speckit-ai] ✅ Created idea: specs/ideas/order-refund.md
```

Creates `specs/ideas/<slug>.md` from `specs/ideas/_template.md`. Optional metadata lines under the title:

| Line | Meaning |
|---|---|
| `> **Depends-on**: auth, order` | Slugs of features that must be finished first |
| `> **Affects**: auth` | Existing features this idea will change (used by `start` if you pass no `--affects`) |

Errors: `Title is required`, `Idea already exists: ...`, `Template not found ...` (run the scaffold first).

## `start "<Title or idea>" [--affects=a,b] [--baseline]`

```bash
npx speckit-ai start "Order refund"                       # new feature (uses the idea of the same name if there is one)
npx speckit-ai start "Add 2FA" --affects=auth             # change an existing feature
npx speckit-ai start "Change token" --affects=auth,order  # one change, several features
npx speckit-ai start "Checkout" --baseline                # spec of code that already exists
```

`--baseline` is for code that already works and only lacks a spec: you describe its **current** behavior, there is no new code to plan or review. The work has no `tasks.md`, and `done` skips the tasks and review checks (all checks on the spec itself still apply). The Changelog line says `baseline (từ code hiện có)` instead of the review types. `--baseline` creates a new feature, so it cannot be combined with `--affects` (or with an idea that lists `Affects`).

Creates `specs/active/<slug>/`:

```
proposal.md            why and what (an idea of the same name becomes the proposal and is removed)
tasks.md               four empty phases: Setup, Logic, UI / API, Tests
targets/<feature>.md   the spec(s) to write: a new spec from the template, or a COPY of each affected spec
work.json              fingerprints (sha256) of the original specs. Do not edit.
```

- Several works can be active at the same time. The same name twice is refused.
- Nothing is created if any check fails.

| Error | Meaning |
|---|---|
| `Active work already exists: <slug>` | That name is taken; pick another title or finish the work |
| `Feature(s) not found in specs/features/: x` | `--affects` needs `specs/features/x/spec.md` |
| `Feature "x" already exists. To change it run: ... --affects=x` | Starting a *new* feature with the name of an existing one |
| `--affects requires a value, e.g. --affects=<value>` | You wrote `--affects` without `=` and a list |
| `--baseline ... cannot be combined with --affects` | A baseline creates a new feature; changing an existing one needs the full flow |
| `--baseline does not take a value` | Write `--baseline` alone, without `=` |

## `status [--json]`

```text
[speckit-ai] Active (0):
[speckit-ai] Ideas (2), in dependency order:
  1. auth
  2. order-refund  (blocked by: auth)
[speckit-ai] Features done (0):
```

- **Active**: works in `specs/active/`.
- **Ideas**: in dependency order; `blocked by` lists dependencies that are not finished features yet.
- **Features done**: folders in `specs/features/` that have a `spec.md`.
- `--json` prints the same data as JSON (`active`, `ideas[]` with `slug`, `title`, `dependsOn`, `affects`, `blockedBy`, and `features`).
- A dependency loop between ideas is an error: `Dependency cycle between ideas: a → b → a`.

## `done [<name>] [--force]`

Finishes a work. It runs **all** checks first and writes nothing unless every one passes.

| Check | Fix |
|---|---|
| No unchecked `- [ ]` under `## Open Questions` in each `targets/*.md` | Answer (`- [x]`) or delete them |
| At least one `### AC-n: <name>` heading | Write the acceptance criteria in that form |
| No unfilled `<placeholder>` (code blocks, inline code and HTML comments are ignored) | Replace them |
| `Decisions` / `Contracts` references exist | `> **Decisions**: 0003` → `specs/decisions/0003-*.md`; `> **Contracts**: auth-api` → `specs/contracts/auth-api.md` |
| `tasks.md` has a Tests phase and every task is checked (`## 🔄 Handoff Session` blocks are ignored) | Tick or remove tasks; keep a `## Phase 4: Tests` |
| `review.md` exists and is not empty | Write the review |
| The specs you are replacing were **not changed** since `start` (sha256) | Merge the other change into your `targets/<feature>.md`, then `--force` |

When everything passes:

```text
[speckit-ai] ✅ Done: auth
[speckit-ai]   → specs/features/auth/spec.md
[speckit-ai]   → work files kept in specs/.history/2026-09-30-auth
```

1. Each `targets/<feature>.md` becomes `specs/features/<feature>/spec.md`, with one line appended to its `## Changelog`.
2. ADRs and contracts of the work move next to the feature (work with one target) or to `specs/decisions/`, `specs/contracts/` (several targets). ADRs are renumbered in their new folder.
3. The work folder is **moved** (not deleted) to `specs/.history/<date>-<name>/`. Delete it whenever you like.

For a work started with `--baseline`, the `tasks.md` and `review.md` checks do not apply.

`--force` skips the checks that can be skipped and records `forced: <checks>` in the Changelog line. It can **not** skip: a missing `work.json` or target file, a *new* feature whose `spec.md` already exists, or a contract with the same name already at the destination.

The Changelog line:

```markdown
- 2026-09-30 · auth · Let users sign in with a password · review: code, test · chi tiết: .history/2026-09-30-auth
```

Example when checks fail:

```text
[speckit-ai] ❌ Error: Cannot finish "auth":
  - targets/auth.md: 1 unresolved item(s) under "Open Questions".
  - targets/auth.md: unfilled placeholder(s): <role>, <action>, <benefit>, <Short name>
  - tasks.md has no completed tasks.
  - review.md is missing or empty.
Use --force to bypass these checks (recorded in the Changelog).
```

## `generate adr|contract "<Title>" [--for=<feature>] [--work=<name>]`

```bash
npx speckit-ai generate adr "Use TOTP for 2FA"
npx speckit-ai generate contract "Auth API" --for=auth
```

Aliases: `g`, and `a` / `c` for the type. Where the file goes:

| Situation | Destination |
|---|---|
| `--for=<feature>` (always wins) | `specs/features/<feature>/decisions/` or `contracts/` |
| A work is active | `specs/active/<name>/decisions/` or `contracts/` (moved by `done`) |
| Several works are active | Choose one with `--work=<name>` |
| No active work and no `--for` | `specs/decisions/` or `specs/contracts/` (project-wide) |

- ADRs are numbered per folder: `0001-use-totp.md`, `0002-...`. Contracts are named `<slug>.md`.
- Existing files are never overwritten.
- Errors: `Feature "x" not found in specs/features/.`, `File already exists: ...`, `Unknown type: ...`, `Multiple active works found (a, b). Please specify a name.`

## `generate tests [<name>]`

```bash
npx speckit-ai generate tests
# [speckit-ai] ✅ Found 1 Acceptance Criteria for "Spec: auth"
# [speckit-ai] ✅ Generated test skeleton: tests/specs/spec-auth.test.js
```

Reads the `### AC-n:` headings of every `targets/*.md` of the work and writes one `tests/specs/<slug>.test.js` per spec (`.ts` if the project has a `tsconfig.json`). Nothing is written if one of the files already exists.

## `lint`

Checks **structure only** (this is what the pre-commit hook runs):

- every `targets/*.md` and `specs/features/*/spec.md` contains every `##` section of `specs/_template.md`;
- every ADR in any `decisions/` folder contains every section of `specs/decisions/0000-template.md`.

`proposal.md`, `plan.md`, `tasks.md`, `review.md`, `ideas/` and `specs/.history/` are not checked. The stricter content checks belong to `done`.

```text
[speckit-ai] ❌ Error in specs/active/change-token/targets/auth.md
             - Missing required section: "Feature Type"
             - Missing required section: "Changelog"

[speckit-ai] 💥 Lint failed. 1 file(s) are missing required sections.
```

## `handoff [<name>]`

Runs `git diff` (plus the list of untracked files), asks an LLM to summarize what is done and what is left, and appends the summary as a `## 🔄 Handoff Session` block to the work's `tasks.md`. A fresh AI chat can pick the work up from there. Needs an API key (see the scaffold section). Only the first 15,000 characters of the diff are sent.

Errors: `No active work found ...`, `No uncommitted changes found. Nothing to handoff.`, `API Key is missing ...`.

## `review [<name>] [--ref=<path>]`

Sends the work's `targets/*.md`, `.agents/AGENTS.md` and your `git diff HEAD` (plus the optional reference file) to an LLM that acts as a strict reviewer. Exit code `0` = passed, `1` = violations (listed). Because of the exit code you can use it in CI. Needs an API key.

`--ref=<path>` is a file of your project that shows the style to follow (path from the project root).

Errors: `No target specs found ...`, `No code changes to review.`, `API Key is missing ...`.

## `serve`

Starts a local server (`http://localhost:3000`, next free port if taken) and opens the browser with a sidebar of `docs/` and `specs/`. Hidden folders such as `specs/.history/` are not listed. The page loads the docsify viewer from a CDN, so it needs internet access. Stop it with `Ctrl+C`.

---

## Other messages

| Message | Meaning |
|---|---|
| `Unknown command: x` | Not a command. Removed since 2.0: `propose`, `archive`, `generate feature` |
| `Unknown option --afects for "start". Did you mean --affects? Valid options: ...` | A flag the command does not have (usually a typo). Nothing is created; fix the flag and run again |
| `verify-commit was removed in 2.0. Run "npx speckit-ai --init-hook" ...` | Printed by an old `commit-msg` hook; it only warns and exits 0, so your commit still goes through |
| `No active work found in specs/active/. Run: npx speckit-ai start "<title>"` | Nothing to work on yet |
| `Multiple active works found (a, b). Please specify a name.` | Pass the work name (`done a`, `review a`, `--work=a`) |
| `Type is required. Example: speckit-ai generate adr "Use JWT"` | `generate` needs `adr`, `contract` or `tests` |

---

## Adopting speckit-ai in an existing project

### Existing code, no specs

Run `npx speckit-ai --mode=existing` (or `--mode=auto`) to get the docs. Code that already exists has no spec, and `--affects=checkout` is refused until `specs/features/checkout/spec.md` exists. Two practical ways:

- **New work only:** just use `idea` / `start` for whatever you build from now on.
- **Change an existing area:** write its spec the first time you touch it, with `--baseline`:

  ```bash
  npx speckit-ai start "Checkout" --baseline   # describe the CURRENT behavior in targets/checkout.md (let the AI draft it from the code)
  npx speckit-ai done                          # no tasks or review needed: there is no new code
  npx speckit-ai start "Add refund" --affects=checkout   # from now on it works like any feature
  ```

  Documenting a little at a time (only what you touch) is cheaper than specifying the whole system up front, and the specs stay accurate.

### Project that already used speckit-ai 1.x

Running the scaffold again is safe, but it never overwrites files, so **old docs and skills stay old**. Your AI agent keeps following whatever is on disk.

| What you have | What happens with 2.x | What to do |
|---|---|---|
| `specs/_workflow.md`, `specs/_template.md`, `.agents/AGENTS.md`, `.agents/skills/*` | Kept as they are (`[skip]`): the agent still reads the old flow | Back up your changes, delete them, run `npx speckit-ai` again to get the new versions |
| `specs/features/<slug>/spec.md` in the old format | `lint` fails (missing sections such as `Changelog`); `start --affects` copies them as they are and `done` then requires the new format | Bring the spec to the new template when you next change it, or move old specs to `specs/.history/legacy/` |
| `specs/features/<slug>/` with `plan.md`, `tasks.md`, `review.md` | Ignored by `lint`; harmless | Delete when convenient |
| `specs/features/done/<slug>/` | **Invisible**: `--affects=<slug>` says the feature is not found | Move it to `specs/features/<slug>/` (or to `specs/.history/legacy/`) |
| `changes/` and `archive/` | Not recognized by `status`, `done`, `handoff` | Finish in-flight changes first, or recreate them with `start`; then delete the folders |
| `docs/adrs/` | Not used; `generate adr` writes to `specs/decisions/` or next to a feature and starts at `0001` | Copy old ADRs into `specs/decisions/` if you want them checked by `lint` |
| A `commit-msg` hook from 1.x | `verify-commit` only prints a warning and exits 0, so commits are not blocked | Run `npx speckit-ai --init-hook` (it removes the old hook and updates `pre-commit`), or delete `.git/hooks/commit-msg` |
| `requireCommitPrefix` in `.speckitrc` | Ignored (the feature was removed) | Remove it |

The stealth rules are kept, and new ones (`.speckitrc`, `speckit.config.json`) are added the next time you run the scaffold.
