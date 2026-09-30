# Spec: v0.2 — Complete Template Library

## Overview

Hoàn thiện thư viện template còn thiếu sau v0.1. Bao gồm: các file template core còn thiếu (`project-overview`, `coding-style`, workflow mẫu), template riêng cho `node-express`, và cập nhật `buildFileMap()` trong scaffolder để include các file mới.

## Acceptance Criteria

- [ ] `templates/_core/project-overview.md.tmpl` tồn tại và có placeholder `{{FRAMEWORK}}`, `{{PACKAGE_MANAGER}}`
- [ ] `templates/_core/coding-style.md.tmpl` tồn tại với nội dung về lint commands, format, git hooks
- [ ] `templates/_core/workflow-adding-feature.md.tmpl` tồn tại với checklist mẫu cho "adding a new feature"
- [ ] `templates/node-express/technology.md.tmpl` tồn tại
- [ ] `templates/node-express/structure.md.tmpl` tồn tại
- [ ] `templates/node-express/coding-conventions.md.tmpl` tồn tại
- [ ] `buildFileMap()` trong `scaffolder.js` được cập nhật để include `project-overview.md`, `coding-style.md`, và `workflow-adding-feature.md`
- [ ] Khi chạy CLI trong project Node/Express → detect `node-express`, scaffold template đúng (không còn fallback generic)
- [ ] Khi chạy CLI trong Next.js project mới → `docs/project-overview.md` được tạo với nội dung không rỗng
- [ ] `npm test` vẫn pass 100% sau khi cập nhật

## Out of Scope

- Không thêm framework mới ngoài `node-express`
- Không thay đổi logic detect hay stealth
- Không publish npm

## Open Questions

- Không có
