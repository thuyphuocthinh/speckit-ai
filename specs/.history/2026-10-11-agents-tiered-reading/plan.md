# Plan: agents-tiered-reading

## Approach

Thay mục "Required Reading Order" trong `templates/_core/AGENTS.md.tmpl` bằng "Reading Order" gồm một danh sách ngắn các file luôn đọc và một bảng "Khi task... thì đọc" cho các file còn lại, dùng đúng các điều kiện của bảng "When needed" trong `templates/_core/docs-README.md.tmpl`. Template `docs-README` giữ nguyên vì đã đúng. Test nằm trong `tests/scaffolder.test.js`, so hai file được scaffold với nhau để giữ chúng nhất quán.

Phương án đã loại: bỏ hẳn danh sách trong AGENTS.md và chỉ trỏ tới `docs/README.md` (agent phải mở thêm một file mới biết luật, và mất đi chỉ dẫn ngay trong file đọc đầu tiên).

## New files

Không có.

## Modified files

- `templates/_core/AGENTS.md.tmpl`: mục Reading Order.
- `tests/scaffolder.test.js`: test AC-1, AC-2, AC-3 (nhiều framework và `--mode=existing`).

## Dependencies

Không có.

## Risks & Mitigations

- Agent bỏ qua file cần đọc vì điều kiện mơ hồ: điều kiện viết theo việc cụ thể (tạo/di chuyển file, viết logic, format) thay vì chung chung.
- Project cũ giữ `AGENTS.md` bản cũ: chấp nhận được, đó là file của người dùng và `upgrade` không sửa nó; tài liệu nêu rõ trong spec.
