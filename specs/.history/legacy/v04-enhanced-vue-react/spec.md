# Spec: v0.4 — Enhanced Vue & React Templates

## Overview

Làm giàu nội dung template cho Vue 3 và React/Vite. Hiện tại các template cơ bản đã có nhưng còn thiếu các pattern thực tế quan trọng: router, API integration, error handling, form validation. v0.4 bổ sung thêm các pattern này vào `coding-conventions.md.tmpl` của từng framework và thêm file `project-overview.md.tmpl` riêng theo framework.

## Feature Type

- [x] Feature UI / Logic đơn giản — review cơ bản

## Acceptance Criteria

### Vue 3

- [ ] `templates/vue/coding-conventions.md.tmpl` bổ sung: Vue Router pattern (guards, navigation), API call trong composable (loading/error state), form validation pattern
- [ ] `templates/vue/project-overview.md.tmpl` tồn tại với nội dung đặc trưng Vue (Vite dev server, env vars)

### React

- [ ] `templates/react/coding-conventions.md.tmpl` bổ sung: Error Boundary pattern, API integration hook, form pattern với react-hook-form hoặc controlled
- [ ] `templates/react/project-overview.md.tmpl` tồn tại với nội dung đặc trưng React (Vite, env vars)

### Chung

- [ ] `npm test` vẫn pass 100%

## Out of Scope

- Không thêm framework mới
- Không sửa NestJS / Next.js templates (đã đủ)
- Không thay đổi logic CLI

## Open Questions

- Không có
