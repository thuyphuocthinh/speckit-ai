# Tasks: v3 Phase 2 - CLI Workflow Generators

- [ ] **Task 1**: Tạo file `src/generator.js`.
- [ ] **Task 2**: Implement hàm `toKebabCase(str)` để chuẩn hóa chuỗi tên (bao gồm cả lọc dấu Tiếng Việt).
- [ ] **Task 3**: Implement hàm `getNextAdrNumber(targetDir)` đọc thư mục `docs/adrs/` và trả về số pad `0` kế tiếp.
- [ ] **Task 4**: Implement hàm `generate(type, title, targetDir)`. Logic đọc file gốc `_template.md` (nếu không có thì quăng lỗi). Replace title mặc định. Ghi ra file mới.
- [ ] **Task 5**: Cập nhật `bin/index.js` để bắt được các argument `generate feature`, `generate adr`, `generate contract` và map tới `generator.js`.
- [ ] **Task 6**: Viết Unit Test `tests/generator.test.js`.
- [ ] **Task 7**: Cập nhật Help CLI message trong `bin/index.js`. Chạy test và Commit.
