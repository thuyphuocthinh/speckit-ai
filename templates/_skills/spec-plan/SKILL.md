---
name: spec-plan
description: Read the spec of the active work and create a detailed plan.md with technical approach. Trigger when the user says "create plan", "plan from spec", "plan feature".
---

# Skill: Create Plan (spec-plan)

## When to trigger

When the user wants to create an implementation plan from an existing spec.

Trigger phrases:
- "Create plan from spec of [feature]"
- "Plan [feature]"
- "Generate implementation plan for [feature]"

## Process

### Step 1 — Read the spec

Read every file in `specs/active/<name>/targets/` and `proposal.md` (if several works are active, ask which one). If there are unresolved Open Questions → notify the user and do not create a plan until they are resolved.

### Step 2 — Technical analysis

Before writing the plan, ask yourself:
- What new files need to be created? What existing files need to be modified?
- Is there any existing code or module that can be reused?
- What new dependencies need to be installed?
- Are there any technical risks?
- Are there any breaking changes?

Reference:
- `docs/core-principles-and-coding-standards/structure.md` → place files correctly
- `docs/core-principles-and-coding-standards/coding-conventions.md` → use correct patterns

### Step 3 — Create plan.md

```
specs/active/<name>/plan.md
```

Required sections:

**Approach**: Explain the technical solution and why it was chosen over alternatives.

**New files**: Full paths + brief purpose for each.

**Modified files**: List + describe specific changes.

**Dependencies**: Packages to install (if any) + reason.

**Risks & Mitigations**: At least 1-2 risks worth mentioning.

### Step 4 — Consistency check

After writing the plan:
- Is every Acceptance Criteria in the target specs covered by at least one file change?
- Are any files placed in the wrong directory per `docs/structure.md`?

### Step 5 — Creating Tasks (`tasks.md`)

When the user asks you to "create task list" based on this plan, you MUST structure `tasks.md` strictly into 4 phases. **Do not skip Phase 4.**
- **Phase 1: Setup** (Scaffolding, DB migrations, etc.)
- **Phase 2: Logic** (Core business logic, services, domain models)
- **Phase 3: UI / API** (Controllers, Routes, React components)
- **Phase 4: Tests** (Unit tests, Integration tests). *MANDATORY: If you skip this phase, the task list is considered invalid.*

### Step 6 — Report

Notify the user:
- Path to plan.md just created
- Summary: X new files, Y modified files
- Next step: "Type 'create task list for [feature]' to continue"
