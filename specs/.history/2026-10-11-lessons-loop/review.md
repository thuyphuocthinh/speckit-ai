# Review: lessons-loop

Feature Type: Feature with API / business logic (code review + test review). Work này sửa spec `sdd-single-spine`: đổi AC-9, thêm AC-21 và AC-22; các AC khác không đổi.

## 5a. Code Review

- Logic mới nằm trong hàm thuần `extractLessons` và `appendLessons`; `finishWork` chỉ chuẩn bị nội dung trước phần ghi, nên "kiểm xong mới ghi, sai thì không đổi gì" vẫn đúng (có test chụp ảnh cây thư mục).
- `startWork` chỉ thêm một vòng `console.log` có điều kiện; không đổi hành vi nào khác.
- Không có `eslint-disable`, không cast kiểu, không thêm dependency. Thông điệp log có tiền tố `[speckit-ai]`.
- Hai bản sao của repo (`specs/_workflow.md`, `.agents/skills/*`) giống hệt template (`diff -q` không có khác biệt).
- Thiết kế: bài học theo feature thay vì một file chung, để chỉ feature đang sửa kéo bài học vào context.
- Điểm cần theo dõi (không chặn): `lessons.md` chỉ dài ra, không tự dọn (đã ghi Out of Scope). Việc agent có đọc `lessons.md` hay không vẫn dựa vào lời nhắc (`start`, `_workflow.md`, skill, AGENTS.md), không có cổng ép buộc, chủ ý để tránh ma sát.

## 5b. Test Review

- `done.test.js`: trích đúng phần (không lấy heading của review, không lấy phần sau), thêm vào file có sẵn mà giữ mục cũ và chỉ một tiêu đề, nhiều target, 6 trường hợp không ghi gì (không heading, rỗng, None, N/A, Không có, dấu gạch), thiếu `review.md` với `--force`, baseline, `done` thất bại không tạo file, CRLF, và `extractLessons` (code block chứa dòng `#`, heading cấp 2 đến 4, không phân biệt hoa thường, cấp 1 và 5 không nhận).
- `lifecycle.test.js`: nhắc đúng feature có `lessons.md`, không nhắc feature khác, không nhắc khi tạo feature mới.
- `linter.test.js`: `lessons.md` không bị chấm cấu trúc. `scaffolder.test.js`: template workflow, 3 skill và AGENTS.md có nội dung mới.
- `npm test`: 19 suite, 334 test đều pass.

## 5e. Summary

- AC-9 (done cất việc vào .history, nay kèm lưu bài học vào feature): Pass. Các test AC-9 sẵn có vẫn pass, cộng test mới của AC-21.
- AC-21 (done lưu Lessons Learned vào feature): Pass. Nhóm test `AC-21` và `extractLessons()` trong `done.test.js`, `linter.test.js`, `scaffolder.test.js`.
- AC-22 (start --affects nhắc đọc bài học của feature): Pass. `lifecycle.test.js` và `scaffolder.test.js`.

### Lessons Learned

- Nội dung do `done` sinh ra từ văn bản người viết (dòng Changelog, bài học) cần giữ nguyên chữ trong dấu backtick; bỏ cả đoạn có backtick làm câu mất nghĩa (đã sửa riêng trong `proposalSummary`).
- Khi bài học phải được agent đọc lại, đặt nó ở nơi agent được phép đọc (theo feature) và nhắc bằng đường dẫn cụ thể, thay vì để trong thư mục lịch sử bị cấm đọc.
