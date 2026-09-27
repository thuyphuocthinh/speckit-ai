# Tasks: v2 Phase 3 — Automation & Native Git Hook

> Based on: `plan.md`

## Phase 3.1 — Xây dựng Native Git Hook (`speckit-ai init-hook`)

- [ ] Tạo file `src/hook.js`.
- [ ] Viết hàm `installHook(targetDir)`:
  - Check sự tồn tại của thư mục `.git/hooks`.
  - Viết chuỗi bash script (dùng Node.js template string) chứa logic kiểm tra bằng `git diff`.
  - Ghi vào file `.git/hooks/pre-commit`. Set chmod 755 (thực thi).
- [ ] Sửa file `bin/index.js`: Bắt arg `--init-hook`. Nếu có, gọi `installHook` và thoát (không scaffold).
- [ ] Viết test `tests/hook.test.js`.

## Phase 3.2 — Xây dựng Core LLM (`src/llm.js`)

- [ ] Cài đặt package `axios` hoặc dùng Node.js native `fetch` (từ Node v18+). (Sẽ dùng native `fetch` để nhẹ package).
- [ ] Viết hàm `scanProject(targetDir)`: đọc cây thư mục cấp 1, cấp 2 (bỏ qua `node_modules`, `dist`, `.git`). Đọc nội dung `package.json`, `go.mod`, `requirements.txt`.
- [ ] Viết hàm `callAI(prompt, model, apiKey)`.
  - Hỗ trợ endpoint Gemini, OpenAI, Claude.
- [ ] Viết hàm `generateDocs(projectContext)`: Trả về object chứa nội dung `project-overview.md` và `technology.md`.
- [ ] Viết test mock fetch cho `tests/llm.test.js`.

## Phase 3.3 — Tích hợp `--mode=auto`

- [ ] Sửa `bin/index.js` chấp nhận `--mode=auto`.
- [ ] Check Env vars `GEMINI_API_KEY` (ưu tiên 1), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.
- [ ] Truyền chế độ `auto` và content sinh ra từ `llm.js` vào `scaffolder.scaffold`.
- [ ] Trong `src/scaffolder.js`, nếu là mode `auto` thì fill content được sinh ra vào file đích (thay vì đọc template).

## Phase 3.4 — Hoàn thiện & Review

- [ ] Chạy lại toàn bộ test `npm test`.
- [ ] Test thực tế chức năng pre-commit hook trong repo.
- [ ] Test thực tế chức năng `--mode=auto` (sử dụng Gemini API key thử nghiệm).
- [ ] Cập nhật `review.md`.
