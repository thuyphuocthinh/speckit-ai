# Implementation Plan: v0.2 — Complete Template Library

> Dựa trên: `spec.md`

## Approach

Thêm các template còn thiếu vào `templates/` và cập nhật `buildFileMap()` để include chúng. Không thay đổi logic core (`detector`, `stealth`). Chỉ sửa `scaffolder.js` phần `buildFileMap()`.

## Files sẽ TẠO MỚI

| File | Nội dung |
|---|---|
| `templates/_core/project-overview.md.tmpl` | Mô tả dự án, scope, môi trường — có placeholder `{{FRAMEWORK}}`, `{{PACKAGE_MANAGER}}` |
| `templates/_core/coding-style.md.tmpl` | Lint commands, prettier, git hooks — dùng chung mọi framework |
| `templates/_core/workflow-adding-feature.md.tmpl` | Checklist "adding a new feature" — dùng chung mọi framework |
| `templates/node-express/technology.md.tmpl` | Stack Node.js + Express |
| `templates/node-express/structure.md.tmpl` | Router/middleware/controller pattern |
| `templates/node-express/coding-conventions.md.tmpl` | Error handling, async pattern, naming |

## Files sẽ SỬA

| File | Thay đổi |
|---|---|
| `src/scaffolder.js` | Thêm 3 entry mới vào `buildFileMap()`: `project-overview.md`, `coding-style.md`, `workflow-adding-feature.md` |

## Files sẽ THÊM TEST

| File | Test gì |
|---|---|
| `tests/scaffolder.test.js` | Thêm test: `node-express` scaffold đúng template (không phải generic), `project-overview.md` được tạo |

## Risks

| Risk | Mitigation |
|---|---|
| Sửa `buildFileMap()` làm break test cũ | Chạy `npm test` ngay sau khi sửa, fix trước khi tiếp tục |
