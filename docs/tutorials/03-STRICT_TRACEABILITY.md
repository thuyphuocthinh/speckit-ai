# Tutorial 3: Strict Traceability (Git Hooks)

Writing specs is great, but getting your entire team of developers to *actually read them and update them* is the hardest part. Speckit AI provides Native Git Hooks to enforce Spec-Driven Development at the commit level.

## Step 1: Install the Hooks

Run the following command in your repository:

```bash
npx speckit-ai --init-hook
```

This installs two Git hooks in your `.git/hooks/` directory:
- `pre-commit`: Blocks commits if a developer modifies source code but forgets to update any files in the `specs/` or `docs/` folders.
- `commit-msg`: (Optional) Enforces a strict commit message format requiring a Use Case (UC) or Bug Report (BR) ID.

## Step 2: Enable Strict Traceability

If you want to enforce that every commit maps back to a specific feature spec, open `.speckit-ai.json` (created in your project root) and set:

```json
{
  "requireCommitPrefix": true
}
```

## Step 3: Try to Commit

Now, if a developer tries to commit code like this:
```bash
git commit -m "fix the login bug"
```

The Git hook will instantly **block** the commit and output an error:
```text
🚨 [speckit-ai] ERROR: Invalid commit message format.
👉 Your project requires Strict Traceability (requireCommitPrefix is true).
👉 Commit message must match format: <type>(UC-XXX): <description>
👉 Example: feat(UC-042): implement QR validation
```

To successfully commit, the developer must explicitly link the commit to the spec:
```bash
git commit -m "fix(UC-001): fix the login bug"
```

## Bypassing the Rules

Sometimes you just need to fix a typo in a CSS file or update a `.gitignore`, and you don't want to create a whole spec for it. You can always bypass the Git hooks by appending `--no-verify`:

```bash
git commit -m "chore: update gitignore" --no-verify
```

Use this responsibly!
