---
name: spec-create
description: Create a proper SDD spec.md from user requirements. Trigger when the user says "create spec for feature", "write spec", "start new feature".
---

# Skill: Create Spec (spec-create)

## When to trigger

When the user wants to start a new feature or requests a spec to be written.

Example trigger phrases:
- "Create spec for feature: ..."
- "Write spec for ..."
- "Start new feature: ..."

## Process

### Step 1 — Identify missing information

Before writing the spec, ask the user about anything unclear:
- What exactly does this feature do?
- Who is the end user?
- Any performance or security constraints?
- What is explicitly out of scope?

> Only ask about what is genuinely unclear. Do not ask about things already stated in the request.

### Step 2 — Determine Feature Type

Classify the feature based on the description:
- Small bugfix (< 30 min) → commit message only, no spec needed
- Simple UI / Logic feature → basic review
- Feature with API / business logic → + test review
- Sensitive feature (auth, payment, data export) → + security review
- Large refactor → + performance review

### Step 3 — Create directory and file

```
specs/features/<feature-name-in-kebab-case>/spec.md
```

Directory name: kebab-case, short, descriptive.
Examples: `user-avatar-upload`, `auth-refresh-token`, `product-search`

### Step 4 — Write spec.md using the template

Use the template at `specs/_template.md`. Ensure:

**Overview**: 2-3 sentences, clear, no unnecessary jargon.

**Feature Type**: Check the correct type to determine the review steps needed.

**Acceptance Criteria**: Each criterion must be:
- Testable (verifiable by test or manual check)
- Specific (no ambiguity)
- Measurable

Good example: `When uploading a file > 5MB → return 400 error with message "File too large"`
Bad example: `Upload works correctly`

**Open Questions**: List anything unclear that must be confirmed before coding. If none → leave this section empty.

### Step 5 — Report

After creating the spec, notify the user:
- Path to the spec file just created
- Summary of feature type and review steps required
- Next step: "Type 'create plan from this spec' to continue"
