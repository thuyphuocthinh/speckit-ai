# Tasks: review-sends-changed-acs

## Phase 1: Setup

- [x] Thêm AC-8 và ràng buộc dùng chung hàm vào `targets/review-fail-closed.md`

## Phase 2: Logic

- [x] Chuyển `extractAcBlocks` sang `features.js` và thêm `omitUnchangedAcs`
- [x] `done.js` dùng `extractAcBlocks` từ `features.js`
- [x] `reviewer.js` rút gọn từng target trước khi gửi

## Phase 3: UI / API

- [x] Cập nhật CLI reference và `structure.md`

## Phase 4: Tests

- [x] `features.test.js`: `extractAcBlocks`, `omitUnchangedAcs` (đổi, mới, không đổi, CRLF, không có AC)
- [x] `reviewer.test.js`: feature có sẵn, feature mới, cùng một phần spec cho mọi phần diff
- [x] Chạy toàn bộ `npm test`
