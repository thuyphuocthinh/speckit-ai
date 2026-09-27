# Implementation Plan: v2 Phase 3 — Automation & Native Git Hook

> Based on: `spec.md`

## Approach

### 1. Tính năng Native Hook
- Tạo module `src/hook.js`.
- Hàm `installHook(targetDir)`: Kiểm tra `targetDir/.git/hooks/`. Sinh ra file `pre-commit` (là một bash script).
- Nội dung bash script `pre-commit`:
  - Lấy danh sách file thay đổi bằng `git diff --cached --name-only`.
  - Phân loại file: Nếu có file `.go, .py, .js, .ts...` nhưng không có file `specs/*.md` hoặc `docs/*.md`, và git commit message không chứa `[skip-spec]`.
  - Echo lỗi đỏ và `exit 1`.
- Đăng ký lệnh `--init-hook` trong `bin/index.js` (không đi kèm luồng tạo file mặc định, chỉ tạo hook rồi exit).

### 2. Tính năng Auto-mode (LLM API)
- Tạo module `src/llm.js` để xử lý kết nối tới AI.
- Quét nhanh cây thư mục của project (để lấy content của package.json, go.mod, và tên các file trong src/). Giới hạn không đọc nội dung từng file code (vì sẽ quá giới hạn token), chỉ đọc cấu trúc và file cấu hình.
- Chuẩn bị một prompt mạnh mẽ gửi tới AI: 
  > "Tôi có một project [Tên ngôn ngữ]. Đây là cấu trúc thư mục và package file: [Data]. Viết giúp tôi nội dung cho file project-overview.md và technology.md."
- Triển khai logic gọi HTTP API trần (fetch/axios) thay vì dùng SDK nặng nề để CLI luôn nhẹ.
  - Gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
  - OpenAI: `https://api.openai.com/v1/chat/completions`
  - Claude: `https://api.anthropic.com/v1/messages`
- Lưu kết quả trả về vào các file tương ứng khi chạy `--mode=auto`.

## Files sẽ tạo/sửa
- TẠO: `src/hook.js`
- TẠO: `src/llm.js`
- SỬA: `bin/index.js` (Thêm nhánh `--init-hook` và `--mode=auto`).
- SỬA: `src/scaffolder.js` (Để override nội dung template nếu đang ở `auto` mode).
- TẠO: `tests/hook.test.js`, `tests/llm.test.js`.
