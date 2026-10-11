# Review: done-check

Feature Type: Feature with API / business logic (code review + test review). Work này sửa spec `sdd-single-spine`: chỉ thêm AC-23; các AC khác không đổi.

## 5a. Code Review

- `printCheck` là hàm mỏng gọi `checkWork` (hàm mà `finishWork` cũng gọi trước khi ghi), nên `--check` và `done` thật dùng chung đúng một bộ cổng; không có logic kiểm tra thứ hai có thể lệch.
- `printCheck` không có lệnh ghi, đổi tên hay xóa nào; chỉ `console.log` (khi qua) hoặc `console.error` (khi lỗi, để CI thấy trên stderr).
- `cli.js`: từ chối `--check` kèm `--force` và `--check=<giá trị>` trước khi chạy gì; `ALLOWED_FLAGS.done` thêm `check` nên cờ gõ sai vẫn bị từ chối như cũ; `--help` cập nhật.
- Hai bản sao của repo (`specs/_workflow.md`) giống template (`diff -q` không khác biệt). Không có `eslint-disable`, không cast kiểu, không thêm dependency.
- Điểm cần theo dõi (không chặn): `AGENTS.md` của project cũ không tự cập nhật (file của người dùng); `_workflow.md` thì nhận qua `upgrade --apply`.

## 5b. Test Review

- `done.test.js`: việc hợp lệ (trả true, cây thư mục y hệt trước và sau), việc chưa đạt (liệt kê mọi lý do, đánh dấu lý do `--force` không bỏ qua được, gợi ý `--force` chỉ khi có lỗi bỏ qua được), nhiều việc phải nêu tên, không có việc nào, và khẳng định kết quả `--check` khớp `finishWork`.
- `cli.test.js`: luồng thật `start` rồi `done --check` exit 1, điền spec rồi exit 0 mà việc vẫn ở `active/` và `features/` chưa có spec, sau đó `done` thật vẫn chạy; từ chối `--check --force` và `--check=yes`; không có việc thì báo lỗi; `--help` nhắc `--check`.
- `scaffolder.test.js`: `_workflow.md` và `AGENTS.md` được scaffold nhắc `--check`.
- `npm test`: 19 suite, 405 test đều pass.

## 5e. Summary

- AC-23 (done --check chạy mọi cổng mà không ghi gì): Pass. Toàn bộ test nêu ở 5b.

### Lessons Learned

- Khi cần một chế độ "chỉ báo cáo" cho một lệnh đang vừa kiểm vừa ghi, tách phần kiểm thành hàm riêng ngay từ đầu (như `checkWork`) rồi để cả hai chế độ gọi chung; chế độ báo cáo khi đó chỉ là vài dòng in kết quả.
