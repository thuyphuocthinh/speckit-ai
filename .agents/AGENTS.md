# AGENTS.md — create-ai-doc-cli

> Đây là project Node.js CLI tool, publish lên npm dưới dạng `speckit-ai`.
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

- Mọi lệnh CLI được điều phối ở `src/cli.js`; `bin/index.js` chỉ gọi nó
- Template nằm ở `templates/` — sửa trực tiếp được (đó là nguồn của mọi file scaffold ra). Thay đổi template ảnh hưởng nội dung được scaffold thì phải có test trong `tests/scaffolder.test.js`
- Mọi thay đổi logic đều phải có unit test tương ứng trong `tests/`
- Khi thêm template framework mới → phải cập nhật `src/detector.js` và `docs/technology.md`
- KHÔNG chạy `node bin/index.js` (không đối số) trong chính repo này: nó scaffold vào repo và sửa `.git/info/exclude`. Thử CLI trong thư mục tạm
- Repo này track `specs/` trong git (khác với project của người dùng, nơi specs bị stealth). Xóa file trong `specs/` ở đây là thay đổi git, có thể khôi phục

---

## 🔄 Quy trình làm việc trên repo này

- Feature hoặc thay đổi spec → dùng chính flow của tool: `npx speckit-ai start "<tên>"`, viết spec trong `specs/active/<tên>/targets/`, xong chạy `npx speckit-ai lint` và `npx speckit-ai done`
- Đọc `specs/_workflow.md` để biết các cổng kiểm tra và cách xử lý hotfix
- Không đọc hoặc sửa `specs/.history/`
