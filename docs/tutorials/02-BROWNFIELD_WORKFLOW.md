# Tutorial 2: Brownfield Workflow (Modifying Existing Features)

In real-world projects, you spend more time modifying existing features than creating new ones. When the Boss says: *"Add Apple Login to the existing User Registration flow"*, you shouldn't modify the baseline `specs/` directly. What if the feature gets cancelled halfway? You'd have to revert everything.

The **OpenSpec Brownfield Workflow** solves this by using a Draft mechanism via the `--target` flag.

## Step 1: Propose with a Target

Identify the existing spec file you want to modify (e.g., `specs/features/user-registration-flow/spec.md`). Then run the `propose` command with the `--target` flag.

```bash
npx speckit-ai propose "Add Apple Login" --target="specs/features/user-registration-flow/spec.md"
```

This will create a new workspace at `changes/add-apple-login/`. Because you provided a `--target`, Speckit AI will **copy** the original target file into this workspace and name it `spec-draft.md`. It also creates a `metadata.json` to remember where the draft came from.

## Step 2: Edit the Draft Spec

Open `changes/add-apple-login/spec-draft.md` and safely make your additions or modifications.

```markdown
...
### AC-2: Invalid Email
...

### AC-3: Apple Login
Given the user clicks the Apple Login button
When they authenticate with Apple successfully
Then the system should map their Apple ID and log them in
```

Since this is just a draft, the baseline `specs/` remains completely untouched and stable.

## Step 3: Implement & Test

Just like Greenfield, you can generate tests for the new ACs, update the code, and ensure everything works perfectly.

## Step 4: Smart Archive

Once the feature is approved and merged, you need to update the baseline.

```bash
npx speckit-ai archive "Add Apple Login"
```

Because this is a Brownfield change, Speckit AI will read `metadata.json`, locate the original target file (`specs/features/user-registration-flow/spec.md`), and **overwrite** it with the fully updated `spec-draft.md`.

Your baseline documentation is now safely and cleanly updated!
