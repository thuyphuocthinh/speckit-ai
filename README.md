# speckit-ai

[![npm version](https://img.shields.io/npm/v/speckit-ai.svg)](https://www.npmjs.com/package/speckit-ai)
[![node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Spec first, code second.** Scaffold AI-ready workspace documentation into any project — new or existing.

---

## Quick Start

```bash
# New project — Best Practices docs for your framework
npx speckit-ai

# Existing project — Let AI write the docs based on your source code!
npx speckit-ai --mode=auto

# Enforce Spec-Driven Development with Native Git Hook
npx speckit-ai --init-hook

# Generate new specs (Feature, ADR, Contract)
npx speckit-ai generate feature "Payment Gateway"
```

That's it. No config. No install. One command.

---

## What does it do?

- 📄 **Generates 4-layer AI documentation** — project overview, tech stack, structure, conventions — tailored to your framework
- 🗂️ **Sets up SDD workflow** — `specs/` directory with `_template.md` and `_workflow.md` for spec-driven development
- 🤖 **AI Auto-generation** — Can scan your codebase and write the docs for you using Gemini/OpenAI/Claude
- 🛡️ **Native Git Hook** — Blocks commits if you change code without updating specs (`--init-hook`)
- 🏗️ **Monorepo & Multi-language** — Supports Python, Go, and JS/TS Monorepos out of the box
- 🧠 **Installs AI Skills** — `spec-create`, `spec-plan`, `spec-review` skills for AI agents
- 🙈 **Stealth mode** — adds all generated files to `.git/info/exclude` so they never pollute your `.gitignore`

---

## Usage

### New project — Best Practices mode (default)

```bash
cd my-new-project
npx speckit-ai
```

Auto-detects your framework and generates opinionated Best Practices docs:

```
[speckit-ai] 🚀 Setting up AI-first workspace...
[speckit-ai] 🔍 Detected: nextjs / npm
[speckit-ai] 📝 Creating documentation structure...
[speckit-ai]   [create] .agents/AGENTS.md
[speckit-ai]   [create] docs/project-overview.md
[speckit-ai]   [create] docs/technology.md
[speckit-ai]   [create] docs/core-principles-and-coding-standards/structure.md
[speckit-ai]   [create] docs/core-principles-and-coding-standards/coding-conventions.md
...
[speckit-ai] ✅ 14 file(s) created
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

### Enforce SDD with Git Hooks (v0.2.0+)

```bash
npx speckit-ai --init-hook
```

This installs a native Git `pre-commit` hook. If a developer modifies source code but forgets to update the `specs/` or `docs/` folder, the commit will be blocked! 
*(You can bypass it for minor fixes using `git commit --no-verify`)*

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
│       ├── spec-create/SKILL.md       ← AI skill: create spec.md
│       ├── spec-plan/SKILL.md         ← AI skill: create plan.md
│       └── spec-review/SKILL.md       ← AI skill: self-review (code + test + security)
├── docs/
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
    ├── _template.md                   ← Copy this when starting a feature
    ├── _workflow.md                   ← SDD cycle reference
    └── features/
        └── done/                      ← Archive of completed features
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
"Create spec for feature: user avatar upload"
  → specs/features/user-avatar-upload/spec.md

"Create plan from the spec"
  → specs/features/user-avatar-upload/plan.md

"Create task list"
  → specs/features/user-avatar-upload/tasks.md

"Implement according to tasks.md"
  → Code

"Review — include code review, test review, security review"
  → specs/features/user-avatar-upload/review.md  ✅ Ready to archive
```

---

## Options

```
Usage: npx speckit-ai [--mode=<mode>] [--init-hook]
       npx speckit-ai generate <type> "<title>"

Options:
  --mode=new       (default) Best Practices templates for your framework
  --mode=existing  AI-PROMPT skeleton docs for an existing codebase
  --mode=auto      Auto-generate project docs based on your source code using LLM
  --init-hook      Install a native Git pre-commit hook to enforce SDD
  --help           Show this help message

Generators (v0.3.0+):
  generate feature "<Title>"    Generate a new feature spec
  generate adr "<Title>"        Generate a new Architecture Decision Record
  generate contract "<Title>"   Generate a new API/Data Contract
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
