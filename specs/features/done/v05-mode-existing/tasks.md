# Tasks: v0.5 — `--mode=existing`

> Based on: `plan.md`

## Phase 1 — Skeleton templates (\_existing/)

- [ ] Tạo `templates/_existing/technology.md.tmpl`
  - Section headers: Tech Stack, Core, Key Libraries, Dev Tools
  - Mỗi section có `<!-- AI-PROMPT: Analyze package.json and fill in ... -->`
- [ ] Tạo `templates/_existing/project-overview.md.tmpl`
  - Skeleton: What is this project?, Environments, Scope, Key repo structure
  - AI-PROMPT marker cho mỗi section
- [ ] Tạo `templates/_existing/structure.md.tmpl`
  - Skeleton: directory tree placeholder + file placement rules
  - AI-PROMPT: Analyze `src/` and document actual structure
- [ ] Tạo `templates/_existing/coding-conventions.md.tmpl`
  - Skeleton: Naming Convention, Error Handling, Async Pattern, Module Export
  - AI-PROMPT cho mỗi section
- [ ] Tạo `templates/_existing/coding-style.md.tmpl`
  - Skeleton: lint commands, commit format, git hooks
  - AI-PROMPT: find `.eslintrc`, `prettier.config`, `.husky` và document

## Phase 2 — Sửa `src/scaffolder.js`

- [ ] Cập nhật signature: `buildFileMap(framework, mode = 'new')`
- [ ] Thêm logic: nếu `mode === 'existing'`, swap 5 docs templates sang `_existing/`
- [ ] Cập nhật signature: `scaffold({ targetDir, framework, packageManager, mode = 'new' })`
- [ ] Pass `mode` xuống `buildFileMap()` trong `scaffold()`

## Phase 3 — Sửa `bin/index.js`

- [ ] Parse `process.argv` để lấy `--mode=<value>`
- [ ] Validate: chỉ chấp nhận `new` và `existing` → nếu sai, `console.error` + `process.exit(1)`
- [ ] Pass `mode` vào `scaffolder.scaffold()`
- [ ] Log: hiển thị mode đang dùng khi chạy
- [ ] Thêm help text khi không có `mode` hoặc có `--help`

## Phase 4 — Tests

- [ ] `buildFileMap('nestjs', 'existing')`: verify technology tmpl là `_existing/technology.md.tmpl`
- [ ] `buildFileMap('nextjs', 'existing')`: verify coding-conventions tmpl là `_existing/coding-conventions.md.tmpl`
- [ ] `buildFileMap('vue', 'new')`: verify vẫn dùng `vue/technology.md.tmpl` (không đổi)
- [ ] `scaffold({ ..., mode: 'existing' })`: verify `docs/coding-conventions.md` chứa string `AI-PROMPT`
- [ ] `scaffold({ ..., mode: 'new' })`: verify `docs/coding-conventions.md` KHÔNG chứa `AI-PROMPT`

## Phase 5 — Verify

- [ ] `npm test` — 100% pass (tất cả 47 test cũ + mới)
- [ ] Manual: `node bin/index.js --mode=existing` trong thư mục test → log đúng, files đúng
- [ ] Manual: `node bin/index.js --mode=unknown` → error message + exit code 1
- [ ] Manual: `node bin/index.js` (không flag) → vẫn chạy như cũ, mode=new
- [ ] Verify `docs/coding-conventions.md` trong mode=existing chứa AI-PROMPT markers
- [ ] Tất cả Acceptance Criteria trong spec.md đã check
