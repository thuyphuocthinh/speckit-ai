# Implementation Plan: v2 Phase 2 — Custom Templates Configuration

> Based on: `spec.md`

## Approach

Để hỗ trợ Custom Templates, chúng ta cần:
1. Viết một module cấu hình (`src/config.js`) để tìm và parse file cấu hình (`.speckitrc` hoặc `speckit.config.json`).
2. Sửa lại luồng đọc template ở `src/scaffolder.js`: 
   - Hàm `readTemplate` cần nhận thêm tham số `customTemplatesDir` (tùy chọn).
   - Nếu `customTemplatesDir` có giá trị, kiểm tra file tồn tại ở đó trước. Nếu có, đọc nó.
   - Nếu không, fallback về đọc ở thư mục `templates/` mặc định của tool.

## Files sẽ TẠO MỚI

| File | Mục đích |
|---|---|
| `src/config.js` | Chứa hàm `loadConfig(targetDir)` để tìm file cấu hình |
| `tests/config.test.js` | Test khả năng đọc và parse config |

## Files sẽ SỬA

### `src/scaffolder.js`
- Thêm thuộc tính `customTemplatesDir` vào tham số của `scaffold` và `scaffoldFiles`.
- Sửa hàm `readTemplate(templateRelPath, customTemplatesDir)` để cài cắm logic fallback.
  - Cần cẩn thận giải quyết đường dẫn tuyệt đối vs đường dẫn tương đối. Đường dẫn customTemplatesDir sẽ được xem như relative đối với `targetDir` hoặc là một absolute path. Tốt nhất là resolve nó ở `src/config.js` thành absolute path.

### `bin/index.js`
- Import `loadConfig`.
- Tại bước setup, gọi `const userConfig = loadConfig(targetDir);`.
- Nếu `userConfig.templatesDir` có giá trị, in ra log để thông báo: `[speckit-ai] ⚙️  Using custom templates from: ...`
- Pass `userConfig.templatesDir` vào hàm `scaffolder.scaffold`.

## Rủi ro & Cách khắc phục
- Lỗi parse JSON từ `.speckitrc`: Dùng `try/catch`, nếu lỗi thì in log cảnh báo và bỏ qua (fallback về default config).
- `templatesDir` khai báo thư mục không tồn tại: Kiểm tra `fs.existsSync`, nếu không tồn tại thì in cảnh báo và bỏ qua.
