# Review: review-fail-closed

Feature Type: Feature with API / business logic (code review + test review).

## 5a. Code Review

- Quy ước: mỗi `src/X.js` export object hàm thuần; `src/gitdiff.js` mới có `tests/gitdiff.test.js`; lỗi có thông điệp rõ; không `eslint-disable`, không cast kiểu.
- `reviewer.js` và `handoff.js` chỉ điều phối; thu thập, chia, lọc diff nằm trong `gitdiff.js`; kiểm schema nằm trong `llm.js` (ranh giới nhận dữ liệu của model). Không có logic trùng lặp giữa `review` và `handoff`.
- Con số 15000 chỉ còn ở `MAX_DIFF_CHARS`. `generateHandoffSummary` vẫn cắt theo hằng số đó (chủ ý: tóm tắt, và đã có cảnh báo khi cắt).
- `collectDiff` đặt `stdio` để stderr của git không in thẳng ra màn hình; lỗi git vẫn được ném lên.
- Đã kiểm: `reviewCode` không còn `substring`; chuỗi `"false"` không qua được; `success: true` kèm `errors` thành không passed.
- Điểm cần theo dõi (không chặn): `git ls-files --others` liệt kê cả file lớn không liên quan mà người dùng chưa ignore (ví dụ file build); khi vượt giới hạn, `review` dừng và nêu tên file, người dùng thêm vào `.gitignore` là xử lý được.

## 5b. Test Review

- Test thật (git repo tạm) cho `collectDiff`: stage, chưa stage, file mới, nhị phân, `.git/info/exclude`, repo chưa có commit, không phải git repo.
- Test thuần cho `splitByFile`, `filterIgnored` (đủ 10 lock file), `chunkDiff` (chia, không mất ký tự, file quá lớn, chỉ lock file).
- `llm.test.js` bao phủ `reviewCode`: hợp lệ, sai dạng (5 kiểu), mâu thuẫn, thiếu `errors`, từ chối diff quá dài và không gọi API, diff đúng bằng giới hạn gửi đủ.
- `reviewer.test.js` / `handoff.test.js` / `cli.test.js` bao phủ chia phần và gộp kết quả, file quá lớn, file mới, lock file, cảnh báo khi cắt, exit code.
- `npm test`: 19 suite, 300 test đều pass.
- Chưa có: test cuối-cuối gọi API thật (cố ý, cần khóa API); lời gọi API chưa có timeout/retry (ngoài phạm vi).

## 5e. Summary

- AC-1 (kết quả sai dạng bị từ chối): Pass. `llm.test.js` và `cli.test.js`.
- AC-2 (kết quả tự mâu thuẫn không passed): Pass. `llm.test.js`.
- AC-3 (chia theo file, không cắt, gộp kết quả): Pass. `gitdiff.test.js` và `reviewer.test.js`.
- AC-4 (không duyệt trên dữ liệu bị cắt): Pass. `gitdiff.test.js`, `llm.test.js`, `reviewer.test.js`.
- AC-5 (file mới chưa track được review): Pass. `gitdiff.test.js` (git thật), `reviewer.test.js`, `handoff.test.js`.
- AC-6 (lock file không gửi, được báo): Pass. `gitdiff.test.js`, `reviewer.test.js`, `cli.test.js`.
- AC-7 (handoff cùng nguồn diff, báo khi cắt): Pass. `handoff.test.js`.

### Lessons Learned

- Khi một Sensor chạy bằng LLM, phải kiểm dữ liệu ở ranh giới nhận (schema) và từ chối khi chưa xem đủ, thay vì để mặc định thành "passed".
- `git diff HEAD` không gồm file chưa track: mọi chỗ cần "toàn bộ thay đổi" phải gộp thêm `git ls-files --others --exclude-standard`.
- Test dùng chuỗi diff giả phải kết thúc bằng xuống dòng, nếu không các section `diff --git` dính nhau và không tách được.
