# Review: review-sends-changed-acs

Feature Type: Feature with API / business logic (code review + test review). Work này sửa spec `review-fail-closed`: chỉ thêm AC-8 và một ràng buộc kỹ thuật; AC-1 đến AC-7 không đổi.

## 5a. Code Review

- Định nghĩa "AC đã đổi" chỉ còn một nơi: `extractAcBlocks` và `omitUnchangedAcs` trong `src/features.js`. `done.js` import lại, nên cổng AC của `done` và phần spec gửi cho `review` không thể lệch nhau.
- `omitUnchangedAcs` là hàm thuần; giữ nguyên mọi phần ngoài các AC không đổi (kể cả phần đứng sau AC cuối, như Technical Constraints). `reviewer.js` chỉ gọi nó khi `specs/features/<slug>/spec.md` tồn tại.
- Không có `eslint-disable`, không cast kiểu, không thêm dependency.
- Giới hạn đã nêu trong plan: mỗi lời gọi model độc lập nên không gửi "một lần" được; mục tiêu thực tế là giảm kích thước phần spec lặp lại ở mỗi phần diff.
- Điểm cần theo dõi (không chặn): model không thấy nội dung các AC không đổi, nên không bắt được lỗi chỉ liên quan tới chúng; tiêu đề của chúng vẫn được giữ.

## 5b. Test Review

- `features.test.js`: `extractAcBlocks` (dừng ở heading cấp 2, bỏ qua khác biệt CRLF), `omitUnchangedAcs` (AC không đổi, AC đã đổi, AC mới, AC cuối không đổi vẫn giữ phần sau, không đổi gì, bản gốc không có AC, CRLF).
- `reviewer.test.js`: feature có sẵn (rút gọn đúng, giữ phần khác), feature mới (gửi nguyên văn), cùng một phần spec rút gọn cho mọi phần diff.
- `done.test.js` (đã có từ trước) tiếp tục pass sau khi `done.js` dùng hàm chung, nên cổng AC của `done` không đổi hành vi.
- `npm test`: 19 suite, 348 test đều pass.

## 5e. Summary

- AC-8 (review chỉ gửi AC mới hoặc đã đổi của feature đang sửa): Pass. `features.test.js` và `reviewer.test.js`.

### Lessons Learned

- Khi hai nơi cần cùng một khái niệm (AC đã đổi), đưa nó vào một hàm dùng chung ngay từ đầu, rồi để test của nơi cũ làm bằng chứng không đổi hành vi.
- Công cụ sửa file có thể để lại kiểu xuống dòng lẫn lộn trong file CRLF; script thay chuỗi giả định một kiểu sẽ lỗi, nên ưu tiên công cụ Edit cho các file đã bị sửa nhiều lần.
