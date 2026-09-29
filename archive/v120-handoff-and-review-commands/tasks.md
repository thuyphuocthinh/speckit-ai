# Task List: v1.2.0 Handoff and Review Commands

> ⚠️ Tuân thủ nghiêm ngặt 4 Phase (đã được force rule mới).

## Phase 1: Setup
- [ ] Mở file `bin/index.js`. Đăng ký 2 lệnh CLI mới vào bảng menu help: `handoff` và `review <feature>`.
- [ ] Viết bộ parser bắt tham số đầu vào cho 2 lệnh này.

## Phase 2: Logic
- [ ] **Lõi Handoff (`src/handoff.js`)**:
  - Viết hàm `runHandoff()`: Thực thi lệnh bash `git diff` và `git status` để lấy code chưa commit.
  - Tìm đường dẫn tới file `tasks.md` của tính năng đang code.
  - Viết hàm gọi API sang `src/llm.js` để nhờ AI tóm tắt cục diff.
  - Nối (append) đoạn text trả về vào cuối file `tasks.md`.
- [ ] **Lõi Review (`src/reviewer.js`)**:
  - Viết hàm `runReview(featureName)`: Tìm và đọc `specs/features/<featureName>/spec.md` và `.agents/AGENTS.md`.
  - Thực thi lệnh bash `git diff` để lấy bài làm của dev.
  - Viết System Prompt đóng vai Senior Architect, ghép 3 file trên vào và ép Output là JSON.
  - Viết logic bắt JSON: Nếu `success === false` thì gọi `process.exit(1)`.

## Phase 3: UI / API (Terminal Output)
- [ ] Sửa `src/reviewer.js` và `src/handoff.js`: Thêm thư viện `chalk` để in log ra terminal.
  - In màn hình chờ (Spinner) khi gọi API.
  - In chữ màu Đỏ (❌) nếu Review tạch kèm mảng lỗi.
  - In chữ màu Xanh (✅) nếu Review pass.

## Phase 4: Tests (BẮT BUỘC)
- [ ] Tạo file `tests/handoff.test.js`: Mock (giả lập) kết quả git diff và kiểm tra xem hàm append vào file tasks.md có đúng vị trí không.
- [ ] Tạo file `tests/reviewer.test.js`: Mock kết quả JSON trả về từ LLM (cả pass và fail) để kiểm tra xem `process.exit` có được gọi đúng mã (1 hoặc 0) hay không.
