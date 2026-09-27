# Tasks: v2 Phase 2 — Custom Templates Configuration

> Based on: `plan.md`

## Phase 2.1 — Viết module Config

- [ ] Tạo file `src/config.js`.
- [ ] Viết hàm `loadConfig(targetDir)`:
  - Check file `.speckitrc` và `speckit.config.json` tại `targetDir`.
  - Nếu file tồn tại, đọc và parse JSON.
  - Nếu parse thành công, kiểm tra trường `templatesDir`.
  - Trả về object: `{ templatesDir: <absolute_path_hoặc_null> }`. Resolve absolute path bằng cách dùng `path.resolve(targetDir, templatesDir)`. Đảm bảo path đó thực sự tồn tại.
- [ ] Xử lý lỗi (invalid JSON, path không tồn tại) trả về `{}`.

## Phase 2.2 — Update Scaffolder

- [ ] Mở file `src/scaffolder.js`.
- [ ] Sửa hàm `readTemplate(templateRelPath, customTemplatesDir)`:
  - Nếu có `customTemplatesDir`, tạo `customPath = path.join(customTemplatesDir, templateRelPath)`. Nếu file tồn tại, đọc và return file này.
  - Nếu file không tồn tại ở thư mục custom (hoặc không truyền `customTemplatesDir`), fallback về cách đọc ở `TEMPLATES_DIR` mặc định của gói npm như cũ.
- [ ] Sửa hàm `scaffoldFiles` và `scaffold` để truyền thêm biến `customTemplatesDir` xuyên suốt qua các hàm xuống tới chỗ gọi `readTemplate`.

## Phase 2.3 — Update CLI Entry & Tests

- [ ] Mở `bin/index.js`, gọi `const userConfig = loadConfig(targetDir);`. Truyền `customTemplatesDir: userConfig.templatesDir` vào hàm `scaffolder.scaffold`.
- [ ] In log nếu có `userConfig.templatesDir`.
- [ ] Viết `tests/config.test.js` kiểm tra các cases hợp lệ/không hợp lệ của `.speckitrc`.
- [ ] Cập nhật `tests/scaffolder.test.js` để test trường hợp load template từ 1 thư mục custom.
- [ ] Chạy `npm test`.

## Phase 2.4 — Clean up

- [ ] Archive `v2-phase2-custom-templates` vào mục `done`.
