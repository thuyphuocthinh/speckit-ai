# speckit-ai

[![npm version](https://img.shields.io/npm/v/speckit-ai.svg)](https://www.npmjs.com/package/speckit-ai)
[![node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Spec first, code second.** Scaffold AI-ready workspace documentation into any project — new or existing — and drive a Spec-Driven Development flow that every AI agent follows the same way.

---

## Quick Start

```bash
# New project — Best Practices docs for your framework
npx speckit-ai

# Existing project — Let AI write the docs based on your source code!
npx speckit-ai --mode=auto

# Run 'lint' automatically before every commit (Native Git Hook)
npx speckit-ai --init-hook

# The SDD flow: idea -> start -> done
npx speckit-ai idea "Order refund"                # save an idea for later
npx speckit-ai start "Order refund"               # start a new feature
npx speckit-ai start "Add 2FA" --affects=auth     # change an existing feature
npx speckit-ai start "Checkout" --baseline        # write the spec of code that already exists (no tasks/review needed)
npx speckit-ai done                               # check the gates, write specs/features/<slug>/spec.md

# After updating speckit-ai in a project that already uses it
npx speckit-ai upgrade            # report what is outdated (changes nothing)
npx speckit-ai upgrade --apply    # refresh the templates and skills (old ones saved as .bak)

# Decision records and contracts, next to the feature they affect
npx speckit-ai generate adr "Use TOTP for 2FA" --for=auth

# Generate test skeleton from Acceptance Criteria
npx speckit-ai generate tests

# Context Handoff for AI
npx speckit-ai handoff

# AI Code Review (Strict SOLID & AC checks)
npx speckit-ai review [--ref=<file>]
```

That's it. No config. No install. One command.

---

## What does it do?

- 📄 **Generates 4-layer AI documentation** — project overview, tech stack, structure, conventions — tailored to your framework
- 🗂️ **Sets up the SDD workflow** — `specs/` with a spec template, a workflow guide, and skills your AI agent follows
- 🔄 **One SDD flow** — `idea → start → done`: ideas in `specs/ideas/`, work in `specs/active/`, finished specs in `specs/features/` (fixed paths; plan/tasks are archived out of the way)
- 🛡️ **Gates the AI cannot skip** — `done` refuses unresolved open questions, missing ACs or review, unchecked tasks, or a spec that changed under you
- 📝 **Decisions next to features** — ADRs and contracts live with the feature they affect
- 🤖 **AI Auto-generation** — Can scan your codebase and write the docs for you using Gemini/OpenAI/Claude
- 🧪 **Test-Protected** — Auto-generate test skeletons matching Acceptance Criteria
- 🪝 **Native Git Hook** — Runs `lint` before every commit
- 🏗️ **Monorepo & Multi-language** — Supports Python, Go, and JS/TS Monorepos out of the box
- 🧠 **Installs AI Skills** — `spec-create`, `spec-plan`, `spec-review` skills for AI agents
- 🙈 **Stealth mode** — adds all generated files to `.git/info/exclude` so they stay local and never pollute your `.gitignore`

---

## Usage

### New project — Best Practices mode (default)

```bash
cd my-new-project
npx speckit-ai
```

Auto-detects your framework and generates opinionated Best Practices docs:

```
[speckit-ai] 🔍 Detected: nextjs / npm
[speckit-ai] 📝 Creating documentation structure...
[speckit-ai]   [create] .agents/AGENTS.md
[speckit-ai]   [create] docs/project-overview.md
[speckit-ai]   [create] docs/technology.md
...
[speckit-ai] ✅ 20 file(s) created
[speckit-ai] 🎉 Done!
```

### Existing project — AI-PROMPT mode

```bash
cd /company/existing-project
npx speckit-ai --mode=existing
```

Generates skeleton docs with `<!-- AI-PROMPT: ... -->` markers. Then ask your AI agent:

> *"Read `docs/` and fill in the AI-PROMPT sections based on the actual codebase"*

Your AI analyzes the real code and produces docs that match **this specific project** — not generic best practices.

### AI Auto-generation mode (v0.2.0+)

```bash
export GEMINI_API_KEY="your_api_key_here"
npx speckit-ai --mode=auto
```

Instead of generating empty skeletons, the CLI will scan your source code structure and configurations (`package.json`, `go.mod`, etc.) and send them to an LLM (Gemini, OpenAI, or Claude). The AI will automatically write accurate `technology.md` and `project-overview.md` files based on your actual codebase!

### The SDD flow

```
speckit-ai idea "Order refund"      → specs/ideas/order-refund.md          (backlog, optional)
speckit-ai start "Order refund"     → specs/active/order-refund/           (spec → plan → tasks → code → review)
speckit-ai done                     → specs/features/order-refund/spec.md  (work files archived in specs/.history/)
```

- **Changing existing features:** `speckit-ai start "Add 2FA" --affects=auth,order` copies those specs into `targets/`. At `done`, each spec is replaced only if nobody changed it since `start`.
- **Existing code without specs:** `speckit-ai start "Checkout" --baseline` writes the spec of what the code does today; `done` then skips the tasks and review checks because there is no new code.
- **Several works at once** are allowed (for example a bug fix while a feature is in progress): pass the work name to `done`, `handoff`, `review`, `generate tests`.
- **Hotfixes** rarely need `start` — see `specs/_workflow.md` ("Bugs and hotfixes").

### 🔄 AI Handoff & Review Commands (v1.2.0+)

**1. Handoff Mode**
If you or your AI hit a context limit, or you need to pause work for the day:
```bash
npx speckit-ai handoff
```
This automatically runs `git diff`, queries the LLM to summarize the current progress, and appends the summary directly to the active work's `tasks.md`. The next AI agent can seamlessly pick up where you left off.

**2. Independent AI Code Review**
To avoid "Confirmation Bias" where an AI says its own code is perfect, use a dedicated review command that runs outside your IDE chat context:
```bash
npx speckit-ai review --ref="src/modules/core/reference.ts"
```
The CLI acts as a strict Senior Architect. It checks if your git diff strictly satisfies the Acceptance Criteria of the active work AND follows the SOLID principles defined in `.agents/AGENTS.md`. It will `exit(1)` and block CI/CD if it finds any violations.

### 📚 Tutorials & Use Cases

Want to learn how to use Speckit AI in a real-world Agile team? Check out our step-by-step tutorials:

1. [New Feature: idea → start → done](./docs/tutorials/01-GREENFIELD_WORKFLOW.md)
2. [Changing Existing Features, decisions and hotfixes](./docs/tutorials/02-BROWNFIELD_WORKFLOW.md)
3. [Git Hook and local-only specs](./docs/tutorials/03-GIT_HOOK.md)
4. [AI Handoff & Review (Solving AI Context Limits & Bias)](./docs/tutorials/04-HANDOFF_AND_REVIEW.md)
5. [CLI Reference (every command, flag and message) and adopting speckit-ai in an existing project](./docs/tutorials/05-CLI_REFERENCE.md)

---

## Supported Frameworks

| Framework | Detection signal |
|---|---|
| **Next.js** | `next` in dependencies |
| **NestJS** | `@nestjs/core` in dependencies |
| **Vue 3** | `vue` in dependencies |
| **React** | `react` in dependencies (no Next.js) |
| **Node / Express** | `express` in dependencies |
| **Python (Django)** | `django` in requirements.txt / pyproject.toml |
| **Python (FastAPI)**| `fastapi` in requirements.txt / pyproject.toml |
| **Go (Gin/Fiber)**  | `gin-gonic/gin` or `gofiber/fiber` in go.mod |
| **Generic** | Fallback — works with any project |

### Monorepo Support
`speckit-ai` automatically detects Monorepos (Turborepo, Nx, Lerna, pnpm workspaces). It will generate root-level AI instructions and automatically scaffold separate `docs/` folders for each sub-project!

---

## What gets generated?

```
your-project/
├── CLAUDE.md                          ← Claude Code entrypoint
├── .cursorrules                       ← Cursor entrypoint
├── .agents/
│   ├── AGENTS.md                      ← Primary AI instructions (all tools read this)
│   └── skills/
│       ├── spec-create/SKILL.md       ← AI skill: start a work and write the spec
│       ├── spec-plan/SKILL.md         ← AI skill: create plan.md and tasks.md
│       └── spec-review/SKILL.md       ← AI skill: self-review (code + test + security)
├── docs/                              ← Project-level documentation only
│   ├── README.md                      ← Required reading order for AI
│   ├── project-overview.md
│   ├── technology.md
│   ├── ai-agent-guidelines.md
│   ├── operation.md
│   └── core-principles-and-coding-standards/
│       ├── structure.md
│       ├── coding-conventions.md
│       ├── coding-style.md
│       └── instructions-and-work-flows/
│           └── adding-a-new-feature.md
└── specs/
    ├── _template.md                   ← Spec structure (lint compares specs against it)
    ├── _workflow.md                   ← SDD cycle reference
    ├── ideas/                         ← Backlog: one small file per idea
    ├── active/                        ← Work in progress (created by `start`)
    ├── features/                      ← Finished specs: features/<slug>/spec.md
    ├── decisions/                     ← Decision records (ADR) shared by several features
    └── contracts/                     ← Contracts shared by several features
```

---

## How it works

**1. Detect** — reads `package.json` to identify framework and package manager

**2. Scaffold** — copies tailored templates, renders `{{FRAMEWORK}}` and `{{PACKAGE_MANAGER}}` placeholders, skips files that already exist

**3. Stealth** — adds all generated files to `.git/info/exclude` (git-ignored locally, never committed)

---

## The SDD Cycle

Once scaffolded, your AI agent can run the full **Spec-Driven Development** cycle:

```
"Start feature: user avatar upload. Create the spec"
  → npx speckit-ai start "User avatar upload"
  → specs/active/user-avatar-upload/targets/user-avatar-upload.md

"Create plan from the spec"
  → specs/active/user-avatar-upload/plan.md

"Create task list"
  → specs/active/user-avatar-upload/tasks.md

"Implement according to tasks.md"
  → Code

"Review — include code review, test review, security review"
  → specs/active/user-avatar-upload/review.md

"Finish"
  → npx speckit-ai done
  → specs/features/user-avatar-upload/spec.md  (work files kept in specs/.history/)
```

---

## Options

```
Usage: npx speckit-ai [--mode=<mode>]
       npx speckit-ai --init-hook [--force]
       npx speckit-ai idea "<title>"
       npx speckit-ai start "<title or idea>" [--affects=<feature>,<feature>] [--baseline]
       npx speckit-ai done [<name>] [--force]
       npx speckit-ai status [--json]
       npx speckit-ai generate <adr|contract> "<title>" [--for=<feature>] [--work=<name>]
       npx speckit-ai generate tests [<name>]
       npx speckit-ai upgrade [--apply]
       npx speckit-ai lint
       npx speckit-ai handoff [<name>]
       npx speckit-ai review [<name>] [--ref=<filepath>]
       npx speckit-ai serve

Options:
  --mode=new       (default) Best Practices templates for your framework
  --mode=existing  AI-PROMPT skeleton docs for an existing codebase
  --mode=auto      Auto-generate project docs based on your source code using LLM
  --init-hook      Install a native Git pre-commit hook that runs "lint" (--force overwrites another hook)
  --help           Show this help message

Commands:
  idea "<Title>"                   Save an idea in specs/ideas/ (backlog)
  start "<Title|idea>"             Start a work in specs/active/ (new feature, or --affects=<a,b> to change existing features)
  start "<Title>" --baseline       Write the spec of code that already exists (no tasks/review needed at done)
  done [<name>] [--force]          Check gates, write specs to specs/features/, keep work files in specs/.history/
  status [--json]                  Show active works and ideas in dependency order
  g, generate adr "<Title>"        New decision record (with --for: next to the feature; else the active work; else specs/decisions/)
  g, generate contract "<Title>"   New API/Data contract (same placement rules)
  g, generate tests [<name>]       Test skeleton matching the ACs of the active work
  upgrade [--apply]                Compare with the current templates: report (or with --apply update) the files speckit-ai manages, save the old ones as .bak
  lint                             Lint spec files and decision records against templates
  handoff [<name>]                 Summarize uncommitted code and append to the active work's tasks.md
  review [<name>] [--ref=<path>]   Review code against the active work's specs and AGENTS.md
  serve                            Start local documentation web server

When several works are active, pass <name> (or --work=<name> for generate).
```

## Custom Templates (v0.2.0+)
Want to use your company's proprietary templates instead of the default ones?
Create a `.speckitrc` (or `speckit.config.json`) in your project root:
```json
{
  "templatesDir": "./my-custom-templates"
}
```
`speckit-ai` will prioritize your custom templates. If a file is missing, it safely falls back to the default generic templates.

---

## Requirements

- Node.js >= 18
- Any project with a `package.json`

---

## Releasing (For Maintainers)

This project uses an automated GitHub Actions CI/CD pipeline for publishing.

To release a new version to npm:
1. Bump the version in `package.json` (e.g. `0.1.1`).
2. Commit the change: `git commit -am "chore: release v0.1.1"`
3. Tag the commit: `git tag v0.1.1`
4. Push the tag: `git push origin v0.1.1`

The pipeline will automatically run tests and publish the new version to npm with a Provenance badge.

---

## License

MIT © [Thuy Phuoc Thinh](https://github.com/thuyphuocthinh)
