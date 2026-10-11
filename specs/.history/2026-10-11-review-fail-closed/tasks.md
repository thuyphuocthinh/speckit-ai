# Tasks: review-fail-closed

## Phase 1: Setup

- [x] Tạo `src/gitdiff.js` với `MAX_DIFF_CHARS` và danh sách file bị bỏ qua

## Phase 2: Logic

- [x] `gitdiff.collectDiff`: diff so với HEAD (fallback `git diff`) cộng nội dung file chưa track, nhị phân chỉ một dòng
- [x] `gitdiff.splitByFile`, `filterIgnored`, `chunkDiff` (lỗi khi một file vượt giới hạn)
- [x] `llm.normalizeReview` và dùng trong `reviewCode`; bỏ `substring`, từ chối diff quá dài
- [x] `reviewer.analyze`: chia phần, gọi tuần tự, gộp kết quả, trả `skipped`
- [x] `handoff.execute`: dùng `collectDiff` + `filterIgnored`, cảnh báo khi bị cắt

## Phase 3: UI / API

- [x] `cli.js`: cảnh báo file bị bỏ qua khi review
- [x] Cập nhật `docs/tutorials/05-CLI_REFERENCE.md` (review, handoff)

## Phase 4: Tests

- [x] `tests/gitdiff.test.js` (AC-3, AC-4, AC-5, AC-6)
- [x] `tests/llm.test.js`: AC-1, AC-2, từ chối diff quá dài
- [x] `tests/reviewer.test.js`: chia phần và gộp, file quá lớn, chỉ lock file thay đổi
- [x] `tests/handoff.test.js`: AC-7
- [x] Chạy toàn bộ `npm test`
