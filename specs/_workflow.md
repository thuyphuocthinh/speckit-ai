# SDD Workflow

## Cycle Overview

```
idea "X"                     → specs/ideas/x.md                 Backlog (optional)
start X [--affects=a,b]      → specs/active/x/                  Work in progress
   Step 1  targets/<feature>.md   Requirements + Acceptance Criteria
   Step 2  plan.md                Technical approach
   Step 3  tasks.md               Implementation checklist
   Step 4  implement              Code according to tasks.md
   Step 5  review.md              AI self-review
done                         → specs/features/<slug>/spec.md    Baseline (plan/tasks/review are archived)
```

`speckit-ai` runs the parts that must be deterministic: `start`, `done`, `lint`, `status`.
The AI writes the content of each step.

---

## Where things live

```
specs/
├── _template.md            ← Spec template (lint compares specs against it)
├── _workflow.md            ← This file
├── ideas/<slug>.md         ← Backlog: one small file per idea
├── active/<name>/          ← Work in progress (usually one, several are allowed)
│   ├── proposal.md         ← Why + what (also lists "Affects")
│   ├── targets/<feature>.md   ← Draft spec of every feature this work creates or changes
│   ├── plan.md  tasks.md  review.md
│   ├── decisions/  contracts/ ← ADRs / contracts created during this work
│   └── work.json           ← Baseline hashes (written by `start`, do not edit)
├── features/<slug>/        ← Finished features (the source of truth)
│   ├── spec.md             ← Ends with a ## Changelog
│   └── decisions/  contracts/
├── decisions/              ← ADRs that affect several features or the whole project
├── contracts/              ← Contracts shared by several features
└── .history/               ← Archived work files. AI: do NOT read or edit this folder.
```

`docs/` only holds project-level documentation (overview, technology, coding standards).

---

## Commands

| Command | What it does |
|---|---|
| `speckit-ai idea "<Title>"` | Save an idea in `specs/ideas/` |
| `speckit-ai start "<Title or idea>"` | Start a **new feature** in `specs/active/` |
| `speckit-ai start "<Title>" --affects=a,b` | Start a change to **existing** features `a`, `b` (their specs are copied into `targets/`) |
| `speckit-ai start "<Title>" --baseline` | Write the spec of code that **already exists** (no new code, so no tasks or review needed at `done`) |
| `speckit-ai status` | Active works + ideas in dependency order (`> **Depends-on**:` in an idea) |
| `speckit-ai lint` | Check spec structure (runs in the pre-commit hook) |
| `speckit-ai generate adr "<Title>"` | New decision record |
| `speckit-ai generate contract "<Title>"` | New API/data contract |
| `speckit-ai generate tests` | Test skeleton from the `### AC-n:` headings of the active work |
| `speckit-ai done` | Run the gates, write specs to `specs/features/`, archive the work files |

With several active works, pass the work name (`done <name>`, `generate adr "<Title>" --work=<name>`).

---

## Feature Classification — Which steps are required?

| Type | Example | Steps |
|---|---|---|
| **Small bugfix** (< 30 min) | Fix typo, null check | Commit message only (see "Bugs and hotfixes") |
| **Simple UI / Logic feature** | Add component, basic CRUD | Steps 1 → 5 |
| **Feature with API / business logic** | New endpoint, complex service | Steps 1 → 5 + Test Review |
| **Sensitive feature** | Auth, payment, upload, data export | Steps 1 → 5 + Test Review + Security Review |
| **Large refactor** | Architecture change, migration | Steps 1 → 5 + Performance Review |

---

## Step Details

### Step 1 — `targets/<feature>.md`
Requirements, user stories, acceptance criteria, out of scope, open questions.
Write every Acceptance Criterion as a heading: `### AC-1: <short name>` followed by Given / When / Then.
> Do not implement if open questions are unresolved.

### Step 2 — `plan.md`
Technical approach, files to create/modify, dependencies, risks.

### Step 3 — `tasks.md`
Step-by-step checklist in 4 phases: **Setup, Logic, UI / API, Tests**. The Tests phase is mandatory.

### Step 4 — Implement
Code according to `tasks.md`. Check off each task. Do not add scope beyond what's in tasks.

### Step 5 — `review.md` (AI self-review)

AI checks everything before reporting done. Sections depend on feature type:

#### 5a. Code Review (all features)
- Conventions correct? (vs `docs/core-principles-and-coding-standards/coding-conventions.md`)
- Dead code, unused imports, hardcoded values?
- Is the logic readable and maintainable?

#### 5b. Test Review (API / logic features)
- Happy paths covered?
- Edge cases tested? Error cases tested?
- Sufficient coverage for critical paths?

#### 5c. Security Review (sensitive features)
- Input validated/sanitized before processing?
- Sensitive data exposed in response, logs, or error messages?
- Authentication/Authorization correct?
- SQL injection / XSS / CSRF if applicable?

#### 5d. Performance Review (large refactors)
- N+1 queries?
- Potential memory leaks?
- Response time meets spec requirements?

#### 5e. Summary (all features)
- All Acceptance Criteria checked off?
- Lessons Learned — note anything worth remembering

---

## Decisions (ADR) and contracts

A decision belongs next to the feature it affects:

| Where you create it | Where it ends up |
|---|---|
| While a work is active | `active/<name>/decisions/`; `done` moves it into `features/<slug>/decisions/` (one target) or `specs/decisions/` (several targets) |
| `--for=<feature>` | `features/<slug>/decisions/` |
| No active work, no `--for` | `specs/decisions/` (project-wide) |

Contracts follow the same rules (`contracts/`). To reference a shared decision or contract from a spec, add
`> **Decisions**: 0003` or `> **Contracts**: auth-api` under the spec's title; `done` checks the files exist.

---

## Gates

- `lint` checks structure: every `## Section` of `specs/_template.md` exists in each `targets/*.md` and `features/*/spec.md`.
- `done` checks content, and writes nothing if any check fails:
  - no unchecked `- [ ]` under Open Questions
  - at least one `### AC-n:` criterion, and no unfilled `<placeholder>`
  - `tasks.md` fully checked and has a Tests phase; `review.md` exists
  - referenced decisions/contracts exist
  - the specs you changed were not modified by someone else since `start` (hash check)
- A work started with `--baseline` skips the `tasks.md` and `review.md` checks (there is no new code); every check on the spec itself still applies. Its Changelog line says `baseline (từ code hiện có)`.
- `done --force` skips the bypassable checks and records that in the Changelog. Use it only when you must.

---

## Bugs and hotfixes

A bug fix never needs `start` unless it is a real change to a spec.

| Situation | What to do |
|---|---|
| Trivial (typo, null check, < 30 min) | Fix + commit message only |
| Code is wrong, spec is right | Fix the code, add a regression test for the relevant `AC-n`, commit `fix(<feature>): ...` |
| Spec is wrong or missing something, and it is urgent | Edit `specs/features/<slug>/spec.md` directly, add a line to its `## Changelog`, add a test |
| Large fix that needs a plan (or touches several features) | Treat it as a normal work: `start "<Title>" --affects=<features>` |

If an active work also targets the feature you edited directly, `done` will report the hash mismatch:
merge your change into that work's `targets/<feature>.md`, then `done --force`.

---

## Rules

- Do not implement if a target spec has unresolved open questions
- Do not report done without a `review.md`, and run `npx speckit-ai done` (it is the source of truth for "done")
- Run `npx speckit-ai lint` before reporting a spec change as finished
- Never read or edit `specs/.history/` — it holds old work files that may contradict the current specs
- Never edit the `## Changelog` by hand; `done` writes it
- Small bugfixes don't need a spec — a clear commit message is sufficient

---

## How to use with AI

```
"Save an idea: [describe it]"                      → speckit-ai idea
"Start [idea / feature]. Create the spec"          → speckit-ai start, then Step 1
"Create plan from the spec of [name]"              → Step 2
"Create task list for [name]"                      → Step 3
"Implement according to tasks.md of [name]"        → Step 4
"Review [name] — include code review, test review" → Step 5
"Finish [name]"                                    → speckit-ai done
```
