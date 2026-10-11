# Tasks: llm-resilience

## Phase 1: Setup

- [x] Viết spec trong `targets/llm-resilience.md`

## Phase 2: Logic

- [x] `PROVIDERS` và `resolveProvider` (hãng chọn trước, khóa đúng hãng), dùng cho generateDocs, handoff, review
- [x] `requestWithRetry` (timeout, retry 3 lần 1s/2s, phân loại lỗi, đọc JSON an toàn)
- [x] `callAI` cho 3 hãng: model cấu hình được, khóa Gemini qua header, phản hồi rỗng báo lỗi rõ
- [x] `normalizeGeneratedDocs` cho `--mode=auto` và sửa thông báo dừng ở `init.js`

## Phase 3: UI / API

- [x] Cập nhật `docs/tutorials/05-CLI_REFERENCE.md` (biến môi trường, timeout, retry)

## Phase 4: Tests

- [x] `tests/llm.test.js`: AC-1 đến AC-7
- [x] Chạy toàn bộ `npm test`
