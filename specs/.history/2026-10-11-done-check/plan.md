# Plan: done-check

## Approach

`checkWork` đã chạy mọi cổng mà không ghi gì (`finishWork` gọi nó rồi mới ghi). Chỉ cần một hàm mỏng `printCheck` trong `src/done.js` gọi `checkWork`, in kết quả và trả true/false; `cli.js` nối cờ `--check` (từ chối khi kèm `--force` hoặc kèm giá trị). Vì dùng chung `checkWork`, kết quả của `--check` và của `done` thật không thể lệch nhau; có test khẳng định điều đó.

Phương án đã loại: thêm cờ `--dry-run` (tên khác, cùng ý; `upgrade` đã dùng cách "mặc định chỉ báo cáo" nhưng `done` mặc định phải ghi nên cần cờ riêng); chạy `done` rồi hoàn tác (có tác dụng phụ).

## New files

Không có.

## Modified files

- `src/done.js`: `printCheck`.
- `src/cli.js`: cờ `--check`, danh sách cờ hợp lệ, `--help`.
- `templates/_core/specs-workflow.md.tmpl` và `specs/_workflow.md` (giống hệt nhau), `templates/_core/AGENTS.md.tmpl`.
- `docs/tutorials/05-CLI_REFERENCE.md`.
- `tests/done.test.js`, `tests/cli.test.js`, `tests/scaffolder.test.js`.

## Dependencies

Không có.

## Risks & Mitigations

- `--check` đi qua cùng `checkWork` nên không có nguy cơ ghi nhầm; test chụp ảnh cây thư mục trước và sau để chứng minh.
- Người dùng cũ có `AGENTS.md` bản cũ không thấy nhắc `--check`: `upgrade` không sửa file của người dùng (chỉ liệt kê dòng mới); `_workflow.md` thì được `upgrade --apply` cập nhật.
