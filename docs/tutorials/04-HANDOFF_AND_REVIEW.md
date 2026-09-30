# Tutorial 4: AI Handoff & Independent Review

When working with AI coding agents (like Cursor, Copilot, or Claude), you often encounter two major bottlenecks:
1. **Context Limit (Amnesia):** The chat gets too long, and the AI starts forgetting the original Acceptance Criteria or repeating mistakes.
2. **Confirmation Bias:** If you ask the same AI that wrote the code to "review" its own code, it will almost always say "Looks perfect!" and ignore deep architectural flaws (like SOLID violations).

Speckit AI (v1.2.0+) solves this with two powerful commands: `handoff` and `review`.

---

## 🔄 Part 1: The `handoff` Command

Imagine you are halfway through implementing a complex feature, but the AI starts hallucinating due to context limits, or it's simply time to end your work day. 

Instead of losing your momentum, use the handoff command:

```bash
npx speckit-ai handoff
```

### What happens under the hood?
1. The CLI finds your active work in `specs/active/` (if several works are active, pass its name: `npx speckit-ai handoff <name>`).
2. It runs `git diff` to capture all your uncommitted work.
3. It sends this diff to an LLM to generate a clear, human-readable summary of exactly what has been done and what is left to do.
4. It appends this summary directly to the bottom of your `tasks.md` file.

### Next Steps:
When you open a brand new AI chat (with a fresh context window), the AI will read the `tasks.md` and instantly know exactly where to pick up the work!

---

## 🕵️ Part 2: The `review` Command

Once the feature is fully coded, **do not** ask your IDE's chat window to review the code. Instead, open a terminal and run the independent review command.

```bash
npx speckit-ai review            # or: npx speckit-ai review <work-name> when several works are active
```

### Reference Files (The Gold Standard)
Telling an AI to "write clean code" often results in over-engineered abstractions. To get *actual* clean code, provide a **Reference File** using the `--ref` flag:

```bash
npx speckit-ai review --ref="src/modules/core/reference.ts"
```

### What happens under the hood?
1. **Fresh Context:** The CLI spawns a completely isolated API request to the LLM.
2. **Strict Architect Persona:** The AI acts as a Senior Architect, totally unbiased.
3. **The Audit:** It compares your `git diff` against:
   - The Acceptance Criteria in the spec(s) under `targets/` of your active work.
   - The Clean Code / SOLID rules in your `.agents/AGENTS.md`.
   - The architectural patterns in your `--ref` file.
4. **The Verdict:** 
   - If perfect: Returns `exit(0)` and prints a green success message.
   - If flawed: Prints the exact violations and returns `exit(1)`.

### CI/CD Integration
Because it returns standard exit codes (`0` or `1`), you can run `npx speckit-ai review` directly in your GitHub Actions, Husky pre-push hooks, or GitLab CI pipelines. If the AI detects a SOLID violation or missed AC, it will block the Pull Request from being merged!
