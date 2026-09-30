# Spec: v0.5 — `--mode=existing`

## Overview

Thêm flag `--mode=existing` cho CLI. Khi chạy trong một dự án công ty đã có sẵn, thay vì sinh Best Practices template cứng, CLI sinh ra **skeleton với AI-PROMPT markers** để AI tự phân tích codebase thực và điền vào đúng conventions của project đó.

## Feature Type
- [x] Feature có API / business logic — + test review

## User Story

> As a developer joining an existing company project, I want to run `npx create-ai-docs --mode=existing` so that I get skeleton docs with AI-PROMPT markers that an AI agent can fill in based on the actual codebase — instead of generic Best Practices that don't match the project.

## Acceptance Criteria

### CLI
- [ ] `node bin/index.js --mode=existing` runs without error
- [ ] `node bin/index.js` (no flag) behaves exactly as before (default = `new`)
- [ ] Unknown flags print a helpful error message and exit with code 1

### Templates
- [ ] `templates/_existing/technology.md.tmpl` — skeleton with AI-PROMPT markers
- [ ] `templates/_existing/project-overview.md.tmpl` — skeleton with AI-PROMPT markers
- [ ] `templates/_existing/structure.md.tmpl` — skeleton with AI-PROMPT markers
- [ ] `templates/_existing/coding-conventions.md.tmpl` — skeleton with AI-PROMPT markers
- [ ] `templates/_existing/coding-style.md.tmpl` — skeleton with AI-PROMPT markers

### Scaffolding
- [ ] When `mode=existing`: docs files use `_existing/` templates instead of fw-specific ones
- [ ] When `mode=existing`: `_core` files (AGENTS, CLAUDE, cursorrules, operation, specs) are unchanged — same as `mode=new`
- [ ] When `mode=existing`: skills are unchanged — same as `mode=new`
- [ ] Output log shows: `Mode: existing — AI-PROMPT markers added, run AI to fill them in`

### Tests
- [ ] Unit test: `buildFileMap('nestjs', 'existing')` uses `_existing/` for docs templates
- [ ] Unit test: `buildFileMap('nestjs', 'new')` still uses fw-specific templates
- [ ] Integration test: scaffold with `mode=existing` creates `docs/coding-conventions.md` containing `AI-PROMPT`

### Regression
- [ ] All 47 existing tests still pass

## Out of Scope

- Không tự động chạy AI để điền vào AI-PROMPT (đó là việc của user sau khi scaffold)
- Không thêm `--mode=update` (cập nhật file đã tồn tại)
- Không thêm interactive prompt để hỏi mode

## Open Questions

- Không có
