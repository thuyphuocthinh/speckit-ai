# AGENTS.md — create-ai-doc-cli

> Đây là project Node.js CLI tool, publish lên npm dưới dạng `create-ai-docs`.
> Mục tiêu: Scaffold cấu trúc AI-first (4-layer docs + SDD) cho bất kỳ dự án nào.

---

## ⚠️ Đọc trước khi làm bất cứ điều gì

- Package manager: **npm**
- Node version: **>=18**
- Entry point: `bin/index.js`
- Tài liệu chi tiết: xem `docs/README.md` trước khi code

---

## 📚 Tài liệu bắt buộc đọc theo thứ tự

1. `docs/README.md` — Required reading order
2. `docs/project-overview.md` — Mục tiêu, phạm vi
3. `docs/technology.md` — Stack, thư viện
4. `docs/core-principles-and-coding-standards/structure.md` — Cấu trúc thư mục
5. `docs/core-principles-and-coding-standards/coding-conventions.md` — Pattern

---

## 🚫 Operation Rules — Không bao giờ vi phạm

- `no-bypass-lint`: Không disable ESLint rule, không thêm `eslint-disable`
- `no-bypass-type-check`: Không dùng `@ts-ignore`, không cast `as any`
- `no-auto-publish`: Không tự ý chạy `npm publish`
- `no-install-unknown-pkg`: Không tự ý cài package lạ không có trong plan

---

## ℹ️ Important Notes

- Template files nằm ở `templates/` — không sửa trực tiếp, phải qua `src/scaffolder.js`
- Mọi thay đổi logic đều phải có unit test tương ứng trong `tests/`
- Khi thêm template framework mới → phải cập nhật `src/detector.js` và `docs/technology.md`
