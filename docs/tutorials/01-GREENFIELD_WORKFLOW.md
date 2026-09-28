# Tutorial 1: Greenfield Workflow (Building New Features)

When you are starting a completely new feature from scratch, you don't want to just throw files into your source code without planning. The **OpenSpec Greenfield Workflow** ensures your feature is thoroughly planned and documented *before* any code is written.

## Step 1: Propose the Feature

Use the `propose` command to create a safe, isolated workspace for your draft.

```bash
npx speckit-ai propose "User Registration Flow"
```

This will create a new directory at `changes/user-registration-flow/` containing:
- `proposal.md`: Explains *why* you are building this feature.
- `delta-specs.md`: The actual specifications and Acceptance Criteria (AC).
- `tasks.md`: A checklist for implementation.

## Step 2: Write the Specs

Open `changes/user-registration-flow/delta-specs.md` and define the feature. A good spec must have clear Acceptance Criteria.

```markdown
# Delta Specs: User Registration Flow

## Description
Allows a new user to register using their email and a password.

### AC-1: Valid Email
Given the user enters a valid email
When they submit the form
Then the system should save the user and send a verification email

### AC-2: Invalid Email
Given the user enters an invalid email
When they submit the form
Then the system should reject it and show an error message
```

## Step 3: Generate Tests (Test-Driven Development)

Once your specs are approved, you can ask Speckit AI to auto-generate the test skeletons based on your Acceptance Criteria.

```bash
npx speckit-ai generate tests "User Registration Flow"
```

This reads the ACs in your spec and creates a `.test.js` or `.test.ts` file with `describe` and `it` blocks ready for you to fill in.

## Step 4: Implement the Code
Write the actual code for the feature and make the tests pass.

## Step 5: Archive the Change

Once the code is merged and the feature is live, you need to merge the draft specs into the main "Source of Truth" baseline.

```bash
npx speckit-ai archive "User Registration Flow"
```

This command will automatically:
1. Copy the specs into `specs/features/user-registration-flow/spec.md`.
2. Move your proposal into the `archive/` folder for historical record-keeping.

You have successfully completed a Greenfield feature using Spec-Driven Development!
