# Plan: review-fail-closed

## Approach

Đưa việc thu thập và chia diff ra một module riêng `src/gitdiff.js`, để `review` và `handoff` dùng chung và để logic này test được độc lập. Code (không phải model) quyết định khi nào review được coi là đủ: `reviewer.js` chia diff, gọi model từng phần, và chỉ báo passed khi mọi phần passed. `llm.js` kiểm schema kết quả ngay tại ranh giới nhận dữ liệu và từ chối diff quá dài thay vì cắt.

Phương án đã loại: nâng `substring(0, 15000)` lên giới hạn lớn hơn (vẫn cắt lặng lẽ, chỉ lùi vấn đề); chia theo hunk (phức tạp, một file quá lớn cho kết quả lỗi rõ ràng là đủ).

## New files

- `src/gitdiff.js`: `MAX_DIFF_CHARS`, `collectDiff(targetDir)`, `splitByFile(diff)`, `filterIgnored(diff)`, `chunkDiff(diff, max)`.
- `tests/gitdiff.test.js`: test với một git repo tạm thật (staged, unstaged, untracked, nhị phân) và test thuần cho chia/lọc.

## Modified files

- `src/llm.js`: bỏ `substring(0, 15000)` trong `reviewCode` (ném lỗi nếu diff dài hơn `MAX_DIFF_CHARS`); thêm `normalizeReview` (schema + mâu thuẫn); `generateHandoffSummary` dùng `MAX_DIFF_CHARS`.
- `src/reviewer.js`: dùng `collectDiff` và `chunkDiff`, gọi `reviewCode` tuần tự theo từng phần, gộp kết quả, trả thêm `skipped`.
- `src/handoff.js`: dùng `collectDiff` và `filterIgnored`; thêm dòng cảnh báo khi diff dài hơn giới hạn.
- `src/cli.js`: in cảnh báo cho các file bị bỏ qua khi `review`.
- `tests/reviewer.test.js`, `tests/handoff.test.js`, `tests/llm.test.js`: thêm test cho AC-1…AC-7.
- `docs/tutorials/05-CLI_REFERENCE.md`: mô tả `review` và `handoff` mới.

## Dependencies

Không có.

## Risks & Mitigations

- Người dùng có diff lớn một file (ví dụ file sinh tự động) sẽ thấy `review` thất bại thay vì passed: đó là hành vi mong muốn; thông báo nêu tên file và hướng xử lý (review tay hoặc tách thay đổi).
- Test dùng git thật: cần `git` trên máy chạy test; thiết lập `user.name`/`user.email` cục bộ trong repo tạm để không phụ thuộc cấu hình máy.
- Đổi `git diff` của `handoff` thành `git diff HEAD` kèm nội dung file mới làm khối tóm tắt nhìn thấy nhiều hơn trước: chấp nhận được, vì khớp với `review`.
