# Tutorial 1: New Feature — idea → start → done

When you build a completely new feature, you don't want to throw files into your source code without planning. This flow makes sure the feature is specified, planned and reviewed *before* it counts as done — and that the AI agent cannot skip a step.

```
idea "X"        →  specs/ideas/x.md                  Backlog (optional)
start X         →  specs/active/x/                   Work in progress
done            →  specs/features/x/spec.md          The finished spec
```

## Step 1: Save the idea (optional)

Not ready to build it yet? Save it:

```bash
npx speckit-ai idea "User Registration Flow"
```

This creates `specs/ideas/user-registration-flow.md`. Fill in the Problem and Rough Scope. Two optional lines control ordering and scope:

```markdown
> **Depends-on**: auth
> **Affects**:
```

`npx speckit-ai status` lists your ideas in dependency order and marks the ones that are blocked, so you always know what to build next:

```text
[speckit-ai] Active (0):
[speckit-ai] Ideas (2), in dependency order:
  1. auth
  2. user-registration-flow  (blocked by: auth)
```

An idea stays "blocked" until the feature it depends on is finished (exists in `specs/features/`).

## Step 2: Start the work

```bash
npx speckit-ai start "User Registration Flow"
```

If an idea with that name exists, `start` turns it into the proposal and removes the idea file. The result:

```text
specs/active/user-registration-flow/
├── proposal.md     ← why and what (from the idea)
├── tasks.md        ← 4 empty phases: Setup, Logic, UI / API, Tests
├── targets/
│   └── user-registration-flow.md   ← the spec, created from specs/_template.md
└── work.json       ← bookkeeping, do not edit
```

## Step 3: Write the spec

Open `targets/user-registration-flow.md`. Every Acceptance Criterion is a heading with Given / When / Then:

```markdown
### AC-1: Valid Email
Given the user enters a valid email
When they submit the form
Then the system saves the user and sends a verification email

### AC-2: Invalid Email
Given the user enters an invalid email
When they submit the form
Then the system rejects it and shows an error message
```

Replace every `<placeholder>` from the template and resolve (or remove) every Open Question. You can ask your AI agent to do this — the `spec-create` skill knows the format.

## Step 4: Plan, tasks, tests

Ask the AI for `plan.md`, then fill `tasks.md` (the `spec-plan` skill does both). Then generate test skeletons from the ACs:

```bash
npx speckit-ai generate tests
```

This creates `tests/specs/spec-user-registration-flow.test.js` (or `.ts` if you have a `tsconfig.json`) with one `describe` per `AC-n`.

## Step 5: Implement and review

Implement the tasks and tick them off. Record architecture decisions as you go:

```bash
npx speckit-ai generate adr "Use signed tokens for email verification"
```

While a work is active, the decision is stored in the work and moved next to the feature when you finish. Then ask the AI for `review.md` (the `spec-review` skill), or run the independent `npx speckit-ai review` (see tutorial 4).

## Step 6: Done

```bash
npx speckit-ai lint
npx speckit-ai done
```

`done` checks everything **before it writes anything**. If something is missing you get the full list, and no file is touched:

```text
[speckit-ai] ❌ Error: Cannot finish "user-registration-flow":
  - targets/user-registration-flow.md: 1 unresolved item(s) under "Open Questions".
  - tasks.md has 2 unfinished task(s).
  - review.md is missing or empty.
Use --force to bypass these checks (recorded in the Changelog).
```

When all gates pass:

```text
specs/features/user-registration-flow/
├── spec.md                       ← ends with a Changelog line
└── decisions/0001-use-signed-tokens-for-email-verification.md

specs/.history/2026-10-01-user-registration-flow/   ← proposal, plan, tasks, review (kept, hidden from AI)
```

The Changelog line, written by `done`, looks like:

```markdown
- 2026-10-01 · user-registration-flow · Let new users register with email and password · review: code, test · chi tiết: .history/2026-10-01-user-registration-flow
```

`specs/features/<slug>/spec.md` never moves again, so you can always refer to it by that path. You can delete `specs/.history/` whenever you like — the Changelog line stays meaningful without it.
