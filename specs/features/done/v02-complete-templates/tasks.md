# Tasks: v0.2 — Complete Template Library

> Dựa trên: `plan.md`

## Phase 1 — Core templates còn thiếu

- [ ] Tạo `templates/_core/project-overview.md.tmpl`
- [ ] Tạo `templates/_core/coding-style.md.tmpl`
- [ ] Tạo `templates/_core/workflow-adding-feature.md.tmpl`

## Phase 2 — Node/Express templates

- [ ] Tạo `templates/node-express/technology.md.tmpl`
- [ ] Tạo `templates/node-express/structure.md.tmpl`
- [ ] Tạo `templates/node-express/coding-conventions.md.tmpl`

## Phase 3 — Cập nhật scaffolder

- [ ] Sửa `buildFileMap()` trong `src/scaffolder.js`: thêm entry cho `project-overview.md` (tmpl: `_core/project-overview.md.tmpl`, dest: `docs/project-overview.md`)
- [ ] Sửa `buildFileMap()`: thêm entry cho `coding-style.md` (dest: `docs/core-principles-and-coding-standards/coding-style.md`)
- [ ] Sửa `buildFileMap()`: thêm entry cho `workflow-adding-feature.md` (dest: `docs/core-principles-and-coding-standards/instructions-and-work-flows/adding-a-new-feature.md`)

## Phase 4 — Tests

- [ ] Thêm test: `buildFileMap('node-express')` — tmpl không chứa `generic/`
- [ ] Thêm test: `scaffold` với `node-express` — `docs/technology.md` chứa "Express"
- [ ] Thêm test: `scaffold` với bất kỳ framework — `docs/project-overview.md` được tạo

## Phase 5 — Verify

- [ ] `npm test` — 100% pass
- [ ] Chạy CLI trong thư mục có `express` trong `package.json` → detect `node-express`, sinh template đúng
- [ ] Chạy CLI trong Next.js test project → `docs/project-overview.md` tồn tại và có nội dung
- [ ] Tất cả Acceptance Criteria trong `spec.md` được check
