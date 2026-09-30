# Tutorial 2: Changing Existing Features, Decisions and Hotfixes

In real projects you spend more time changing existing features than creating new ones. When the boss says *"Add Apple Login to the existing User Registration flow"*, you don't edit the finished spec directly: if the change is cancelled halfway, you would have to revert everything.

The same `start` / `done` flow handles it. You just say which features the work changes.

## Step 1: Start with `--affects`

```bash
npx speckit-ai start "Add Apple Login" --affects=user-registration-flow
```

```text
specs/active/add-apple-login/
├── proposal.md
├── tasks.md
├── targets/
│   └── user-registration-flow.md   ← a COPY of specs/features/user-registration-flow/spec.md
└── work.json                       ← remembers the fingerprint (sha256) of the original
```

The finished spec in `specs/features/` is untouched. If you drop the work, nothing was lost.

## Step 2: Edit the copy

Open `targets/user-registration-flow.md` and add or change what you need:

```markdown
### AC-3: Apple Login
Given the user clicks the Apple Login button
When they authenticate with Apple successfully
Then the system maps their Apple ID and logs them in
```

Then plan, tasks, tests, implement and review exactly like a new feature (tutorial 1).

## Step 3: Done

```bash
npx speckit-ai done
```

`done` replaces `specs/features/user-registration-flow/spec.md` with your edited copy and appends a Changelog line — **only if the original has not changed since you started**. Otherwise it stops without writing anything:

```text
[speckit-ai] ❌ Error: Cannot finish "add-apple-login":
  - specs/features/user-registration-flow/spec.md changed since this work started. Merge the change into targets/user-registration-flow.md by hand, then use --force.
```

Merge the other change into your copy, then run `npx speckit-ai done --force`.

## One change, several features

Some changes touch several features at once, for example changing the token format used by `auth`, `order` and `payment`:

```bash
npx speckit-ai start "Change token format" --affects=auth,order,payment
```

You get **one** proposal and **one** `tasks.md`, plus one copy per feature in `targets/`. `done` checks the fingerprint of **every** spec first: if any of them changed, none is written.

## Several works at the same time

Only one work is the normal case, but several are allowed — for example a bug fix while a feature is in progress:

```bash
npx speckit-ai start "Fix token expiry" --affects=auth
npx speckit-ai status                       # lists both works
npx speckit-ai done fix-token-expiry        # name the work when several are active
```

Commands that work on "the active work" (`done`, `handoff`, `review`, `generate tests`) need the work name as soon as there is more than one. If two works change the same feature, whichever finishes second is stopped by the fingerprint check.

## Decisions and contracts

Put a decision next to the feature it affects:

| Where you run it | Where the file goes |
|---|---|
| A work is active | `specs/active/<work>/decisions/`; `done` moves it to `features/<slug>/decisions/` (work has one target) or `specs/decisions/` (several targets) |
| `generate adr "..." --for=auth` | `specs/features/auth/decisions/` |
| No active work, no `--for` | `specs/decisions/` (affects the whole project) |
| Several works are active | add `--work=<name>` or `--for=<feature>` |

`generate contract` follows the same rules (`contracts/`). To point a spec at a shared decision or contract, add `> **Decisions**: 0003` or `> **Contracts**: auth-api` under its title; `done` checks that those files exist.

## Bugs and hotfixes

A bug fix does not need `start`, unless it is a real change to a spec:

| Situation | What to do |
|---|---|
| Typo, null check (< 30 min) | Fix + commit message only |
| Code is wrong, spec is right | Fix the code, add a regression test for the relevant `AC-n`, commit `fix(auth): ...` |
| Spec is wrong or missing something, and it is urgent | Edit `specs/features/auth/spec.md` directly, add a line to its `## Changelog`, add a test |
| Large fix that needs a plan, or touches several features | A normal work: `start "..." --affects=...` |

If a work in progress also targets the feature you edited directly, `done` will report the fingerprint mismatch: merge your change into that work's copy, then `done --force`.
