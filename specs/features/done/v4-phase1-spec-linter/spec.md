# Feature: Spec Linter

## 1. Overview

Tính năng **Spec Linter** cung cấp một CLI command `npx speckit-ai lint` để tự động quét toàn bộ các file Markdown trong dự án (cụ thể là `specs/` và `docs/`), đối chiếu chúng với các template gốc.
Mục tiêu là để đảm bảo Dev khi tạo file Spec không được quyền xóa các Headers quan trọng (ví dụ như `## Security`, `## Edge Cases`, `## UI/UX`).

## 2. Requirements & Constraints

- **Lệnh thực thi:** `npx speckit-ai lint`
- Nếu file pass -> in ra màn hình `✅ All specs are well-formatted`.
- Nếu có file bị thiếu Header -> báo lỗi đỏ kèm danh sách các Header bị thiếu và Exit Code = 1 (để ngắt quá trình CI/CD hoặc ngắt lệnh Git Commit).
- **So khớp với đâu?**
  Linter phải thông minh: Nếu file ở `specs/features/`, nó sẽ đọc file `specs/_template.md` (nếu có) hoặc `templates/_core/specs-template.md.tmpl` để lấy danh sách Headers gốc. Sau đó soi vào file của Dev xem có đầy đủ các Headers đó không.
- **Hỗ trợ Regex:** Không yêu cầu viết chính xác 100% từng chữ, chỉ cần so khớp lỏng lẻo (case-insensitive, bỏ qua khoảng trắng thừa) của các thẻ `## Header` và `### Sub-header`.

## 3. Architecture & Implementation

- File mới: `src/linter.js` chứa logic phân tích Markdown (AST hoặc Regex).
- File cập nhật: `bin/index.js` (Thêm nhánh switch cho lệnh `lint`).
- Test suite: `tests/linter.test.js`.

### Logic phân tích Linter (Pseudo-code)

1. Liệt kê toàn bộ file `.md` trong thư mục `specs/features/`.
2. Đọc file `specs/_template.md` (hoặc fallback về default template).
3. Dùng Regex `/^(#+)\s+(.+)$/gm` để trích xuất toàn bộ Headers từ file Template.
4. Quét từng file Spec của Dev, cũng trích xuất toàn bộ Headers.
5. Kiểm tra xem tập Headers của Dev có chứa đầy đủ tập Headers của Template không. (Các Headers có thể có tiền tố số như `## 1. Overview`, nên Regex cần chuẩn hóa chuỗi trước khi so sánh, ví dụ bỏ số đếm và chuyển về lower-case).
6. Tương tự cho thư mục `docs/adrs/` (dựa trên `docs/adrs/0000-template.md`).

## 4. UI/UX

```bash
$ npx speckit-ai lint
[speckit-ai] 🔍 Linting specs...
[speckit-ai] ❌ Error in specs/features/user-login/spec.md
             - Missing required section: "## 3. Security"
             - Missing required section: "## 4. Edge Cases"
[speckit-ai] ❌ Error in docs/adrs/0001-use-redis.md
             - Missing required section: "## Consequences"
[speckit-ai] 💥 Lint failed. 2 file(s) are missing required sections.
```

## 5. Security & Edge Cases

- Nếu thư mục `specs/` hoặc `docs/adrs/` trống -> Báo Pass (Không có gì để lint).
- Nếu không tìm thấy file template gốc -> Vẫn pass nhưng in ra Warning `⚠️ No template found for specs/features, skipping linting`.

## 6. Testing Strategy

- Mock hệ thống File System tạo 1 file Template gốc.
- Tạo 1 file Spec hợp lệ (đầy đủ headers) -> Test case phải return Pass.
- Tạo 1 file Spec cố tình thiếu Header "Security" -> Test case phải return Fail và chứa nội dung báo lỗi cụ thể.
- Test case bỏ các số ở đầu header (VD Template ghi `## 3. Security` nhưng file của dev ghi `## Security`) -> Phải return Pass (đòi hỏi hàm chuẩn hóa string).
