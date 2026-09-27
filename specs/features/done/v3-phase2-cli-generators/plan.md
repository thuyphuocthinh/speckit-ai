# Plan: v3 Phase 2 - CLI Workflow Generators

## 1. Phân tích Kỹ thuật
Chúng ta sẽ tạo một module mới: `src/generator.js` để chịu trách nhiệm toàn bộ cho các thao tác `generate`.

**Flow hoạt động của `generator.js`:**
1. Nhận `type` (feature | adr | contract) và `title`.
2. Parse `title` thành `kebab-case`.
3. Xác định đường dẫn file Template tại Local (trong thư mục dự án của người dùng).
   - *Lưu ý: Không dùng template của chính gói NPM, mà dùng template mà người dùng đang có để giữ lại các tùy biến của họ.*
4. Đọc nội dung file template.
5. Nội suy (Interpolate): 
   - Thay `# Spec: [Feature Name]` thành `# Spec: ${title}`.
   - Hoặc thay `# Title of the Decision` thành `# ${title}`.
6. Ghi file mới ra đúng đường dẫn đích:
   - Nếu là ADR: Phải đọc `fs.readdirSync('docs/adrs/')`, dùng Regex để tìm số bự nhất, cộng thêm 1, padding bằng số 0 (VD: `0004`).
   - Nếu là Feature: Tạo folder `specs/features/<slug>/`, ghi file `spec.md`.

## 2. Tích hợp vào CLI (`bin/index.js`)
Sử dụng cờ (argument) command, bởi vì cú pháp truyền thống là `npx speckit-ai generate feature "Tên"`.
```javascript
const args = process.argv.slice(2);
if (args[0] === 'generate' || args[0] === 'g') {
  const type = args[1];
  const title = args.slice(2).join(' ');
  require('../src/generator').generate(type, title);
  process.exit(0);
}
```

## 3. Quá trình kiểm thử (Testing Strategy)
- Tạo file `tests/generator.test.js`.
- Mock `fs` để tạo ra thư mục giả lập chứa `docs/adrs/0000-template.md` và `docs/adrs/0001-test.md`.
- Test xem generator có tạo ra đúng số `0002` không.
- Test hàm `toKebabCase` xem có handle đúng dấu tiếng Việt và ký tự đặc biệt không.
