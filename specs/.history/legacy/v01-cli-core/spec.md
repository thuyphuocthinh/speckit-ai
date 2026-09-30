# Spec: v0.1 — CLI Core (Detect + Scaffold + Stealth)

## Overview

Xây dựng phần lõi của CLI tool `create-ai-docs`. Khi người dùng chạy `npx create-ai-docs` trong thư mục một dự án Node.js, CLI tự động:

1. Detect framework đang dùng
2. Scaffold cấu trúc `.agents/`, `docs/`, `specs/` với nội dung phù hợp
3. Tạo cross-tool wrappers (`CLAUDE.md`, `.cursorrules`)
4. Ẩn toàn bộ khỏi git bằng `.git/info/exclude`

## User Stories

- As a developer, I want to run one command to scaffold AI docs, so that I don't have to manually create dozens of files.
- As a developer working at a company, I want the scaffolded files to be invisible to git, so that I don't accidentally commit them to the company repo.
- As a developer using multiple AI tools, I want the docs to work with Gemini, Claude, and Cursor, so that I can switch tools freely.

## Acceptance Criteria

- [ ] Khi chạy trong thư mục có `package.json` chứa `@nestjs/core` → scaffold template NestJS
- [ ] Khi chạy trong thư mục có `package.json` chứa `next` → scaffold template Next.js
- [ ] Khi chạy trong thư mục có `package.json` chứa `vue` → scaffold template Vue
- [ ] Khi chạy trong thư mục có `package.json` chứa `react` (không có `next`) → scaffold template React
- [ ] Khi chạy trong thư mục không có `package.json` → scaffold template Generic
- [ ] Sau khi scaffold, tồn tại file `.agents/AGENTS.md` với nội dung không rỗng
- [ ] Sau khi scaffold, tồn tại file `CLAUDE.md` chứa nội dung trỏ về `AGENTS.md`
- [ ] Sau khi scaffold, tồn tại file `.cursorrules` chứa nội dung trỏ về `AGENTS.md`
- [ ] Sau khi scaffold, tồn tại thư mục `docs/` với ít nhất 4 file: `README.md`, `project-overview.md`, `technology.md`, `operation.md`
- [ ] Sau khi scaffold, tồn tại thư mục `specs/` với `_template.md` và `_workflow.md`
- [ ] File `.git/info/exclude` được tự động cập nhật để ẩn `.agents/`, `docs/`, `specs/`, `CLAUDE.md`, `.cursorrules`
- [ ] Nếu `.git/info/exclude` không tồn tại (thư mục không phải git repo) → bỏ qua bước stealth, không crash
- [ ] Nếu file đã tồn tại → không ghi đè, hiện thông báo `[skip]`

## Technical Constraints

- Node.js >= 18, không dùng thư viện ngoài ngoài `commander` (optional)
- Chạy được trên Windows (path separator `\`) và macOS/Linux (`/`)
- Thời gian chạy < 3 giây

## Out of Scope (v0.1)

- Không có `--mode=existing` (AI-PROMPT markers) — để v0.5
- Không có interactive prompt hỏi framework — chỉ auto-detect
- Không publish npm — chỉ chạy được local bằng `node bin/index.js`
- Không có màu sắc terminal (chalk) — chỉ plain text log

## Open Questions

- Nếu `package.json` có cả `react` lẫn `next` → ưu tiên Next.js hay hỏi user? → **Quyết định: ưu tiên Next.js**
- Có cần tạo `package.json` cho chính project target không? → **Không, CLI không chạm vào file gốc của user**
