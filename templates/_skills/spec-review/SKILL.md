---
name: spec-review
description: Self-review implemented code against the spec and create review.md with appropriate review types based on feature type. Trigger when the user says "review feature", "check", "self-review".
---

# Skill: Review (spec-review)

## When to trigger

When the user wants the AI to self-review an implemented feature.

Trigger phrases:
- "Review feature [name]"
- "Check [feature] before I look at it"
- "Self-review [feature]"
- "Is the review done?"

## Process

### Step 1 — Read context

Read in this order:
1. `specs/active/<name>/targets/*.md` → know the Acceptance Criteria and Feature Type (if several works are active, ask which one)
2. `specs/active/<name>/tasks.md` → know what was implemented
3. `docs/core-principles-and-coding-standards/coding-conventions.md` → the code standards

### Step 2 — Determine which reviews are needed

Based on **Feature Type** in the target spec:

| Feature Type | Reviews required |
|---|---|
| Simple UI / Logic | 5a (Code) + 5e (Summary) |
| API / business logic | 5a + 5b (Test) + 5e |
| Sensitive (auth, payment, data) | 5a + 5b + 5c (Security) + 5e |
| Large refactor | 5a + 5d (Performance) + 5e |

### Step 3 — Perform review and create review.md

```
specs/active/<name>/review.md
```

#### 5a. Code Review (all features)

Act as a strict Senior Architect. Check each created/modified file:
- **Clean Code & SOLID**: Does the code violate Single Responsibility? Is business logic leaking into Controllers instead of Services/Domain? 
- **Reference Pattern**: Did the code follow the established patterns in the project (e.g., Dependency Injection, error handling)?
- Placed in the correct directory per `docs/structure.md`?
- Naming conventions followed?
- Dead code, unused imports, hardcoded values (magic numbers, hardcoded URLs)?
- Is the logic readable? Does it need explanatory comments?
- Duplicate logic that already exists elsewhere?
- *If the code violates SOLID or Clean Code principles, you MUST reject it and instruct the Coder to refactor.*

#### 5b. Test Review (API / logic features)

- Happy path tested?
- Edge cases tested? (null, empty, boundary values)
- Error cases tested? (404, 400, 500)
- Are tests testing behavior rather than implementation? (avoid testing internals)

#### 5c. Security Review (sensitive features)

- Client input validated/sanitized before processing?
- Response returning unnecessary sensitive data? (password hash, internal ID, stack trace)
- Logs recording sensitive data? (token, password, PII)
- Auth correct? Authorization correct? (correct role, correct ownership)
- SQL injection possible?
- If file upload: file type, size, filename validated?

#### 5d. Performance Review (large refactors)

- N+1 queries? (loop with DB calls)
- Queries missing indexes?
- Potential memory leaks? (event listeners not cleaned up, large data in memory)
- Estimated response time meets spec requirements?

#### 5e. Summary (all features)

- Check off each Acceptance Criteria from the target specs, note Pass/Fail with reason
- If Fail → describe the issue and how to fix it
- Lessons Learned: note any insight or decision worth remembering

### Step 4 — Conclusion

After writing review.md:
- If all AC pass and no critical issues → report "✅ Ready for done"
- If issues exist → list them clearly and fix them first
- Suggest: "Run `npx speckit-ai lint` then `npx speckit-ai done` to finish" (`done` requires a non-empty review.md and fully checked tasks)
