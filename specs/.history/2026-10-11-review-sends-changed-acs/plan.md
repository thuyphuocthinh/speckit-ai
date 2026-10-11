# Plan: review-sends-changed-acs

## Approach

Đưa việc "tách các khối `### AC-n:` và so sánh giữa hai phiên bản spec" vào `src/features.js` (`extractAcBlocks`, `omitUnchangedAcs`), để cổng AC của `done` và `review` cùng dùng một định nghĩa "AC đã đổi". `reviewer.js` đọc `specs/features/<slug>/spec.md` (nếu có) cho từng target rồi rút gọn target bằng `omitUnchangedAcs` trước khi gửi: AC không đổi chỉ còn dòng tiêu đề kèm `(unchanged, omitted)`; các mục khác của spec và AC mới hoặc đã đổi giữ nguyên.

Không thể gửi spec "một lần" cho nhiều phần diff vì mỗi lời gọi model độc lập; vì vậy giảm kích thước phần spec là cách giảm chi phí lặp lại.

Phương án đã loại: bỏ hẳn các AC không đổi (model không biết chúng tồn tại, có thể đánh giá sai về ràng buộc chéo); chỉ gửi AC và bỏ Overview, Constraints (mất ngữ cảnh).

## New files

Không có.

## Modified files

- `src/features.js`: thêm `extractAcBlocks` (chuyển từ `done.js`) và `omitUnchangedAcs`.
- `src/done.js`: import `extractAcBlocks` từ `features.js`.
- `src/reviewer.js`: rút gọn từng target trước khi gửi.
- `tests/features.test.js`, `tests/reviewer.test.js`: test cho AC-8.
- `docs/tutorials/05-CLI_REFERENCE.md`, `docs/core-principles-and-coding-standards/structure.md`.

## Dependencies

Không có.

## Risks & Mitigations

- Model không thấy nội dung AC không đổi nên không bắt được lỗi liên quan chỉ tới chúng: chấp nhận được, review nhắm vào thay đổi; tiêu đề AC vẫn được giữ để model biết chúng tồn tại.
- Hai nơi (`done`, `review`) lệch nhau về "AC đã đổi": tránh bằng một hàm dùng chung và test `done.test.js` hiện có tiếp tục chạy qua nó.
