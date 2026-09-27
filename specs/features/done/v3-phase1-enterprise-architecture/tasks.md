# Tasks: v3 Phase 1 - Enterprise Architecture

- [ ] **Task 1**: Tạo thư mục `templates/shared/docs/adrs/` và file `0000-template.md`. (Chuẩn MADR)
- [ ] **Task 2**: Tạo thư mục `templates/shared/specs/contracts/` và file `_template.md`.
- [ ] **Task 3**: Sửa file `src/scaffolder.js`, trong logic chọn thư mục template:
  - Bổ sung biến `sharedDir = path.join(__dirname, '../templates/shared')`.
  - Trong logic đếm và copy file, chạy `copyDir` cho thư mục `shared` trước (nếu không dùng customTemplates).
  - Sau đó mới chạy `copyDir` cho thư mục framework.
- [ ] **Task 4**: Sửa file `tests/scaffolder.test.js` để test case không bị fail vì gọi copy 2 lần. Cập nhật các assertion tương ứng.
- [ ] **Task 5**: Chạy `npm test` để kiểm tra. Commit code.
