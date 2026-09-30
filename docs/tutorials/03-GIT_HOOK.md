# Tutorial 3: Git Hook and Local-only Specs

Writing specs is great, but getting everyone (and every AI agent) to keep them well-formed is the hard part. `speckit-ai` gives you a native Git hook that runs `lint` before every commit.

## Step 1: Install the hook

```bash
npx speckit-ai --init-hook
```

This writes `.git/hooks/pre-commit`. On every commit it runs:

```bash
npx speckit-ai lint
```

`lint` checks the **structure** of your spec files: every `## Section` of `specs/_template.md` must exist in each spec (`specs/active/*/targets/*.md` and `specs/features/*/spec.md`), and every decision record must match `specs/decisions/0000-template.md`. Files like `proposal.md`, `plan.md`, `tasks.md`, `review.md` and everything in `specs/.history/` are not checked.

If lint fails the commit is blocked and the missing sections are listed. The stricter content checks (open questions, ACs, tasks, review) run when you finish a work with `npx speckit-ai done`.

If a `pre-commit` hook that `speckit-ai` did not create already exists, the command stops instead of overwriting it. Use `--force` if you really want to replace it:

```bash
npx speckit-ai --init-hook --force
```

## Local-only specs (stealth mode)

When you scaffold a project, `speckit-ai` adds `.agents/`, `CLAUDE.md`, `.cursorrules`, `docs/`, `specs/` and the config files to `.git/info/exclude`. They stay on your machine and never show up in `git status` or in commits. That is why the hook does **not** require spec files to be staged — they can't be.

Two consequences worth knowing:

- Your specs have no git history. `speckit-ai done` therefore never deletes your work files: it moves them to `specs/.history/`.
- If you *do* want to share specs with your team, remove the lines from `.git/info/exclude` and commit them as usual.

## Bypassing the rules

Sometimes you just need to fix a typo in a CSS file and don't want to think about specs. You can always bypass the hook:

```bash
git commit -m "chore: update gitignore" --no-verify
```

Use this responsibly!
