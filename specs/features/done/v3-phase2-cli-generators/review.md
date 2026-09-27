# Review: v3 Phase 2 - CLI Workflow Generators

> Reviewed: {{DATE}}

## Acceptance Criteria Status

| # | Criterion | Status |
|---|---|---|
| 1 | Lệnh `generate feature "Title"` tạo thư mục và copy template đúng chuẩn | ✅ Pass |
| 2 | Lệnh `generate adr "Title"` tạo file ADR và tự động đánh số đếm tịnh tiến (0001, 0002) | ✅ Pass |
| 3 | Lệnh `generate contract "Title"` tạo file contract chuẩn | ✅ Pass |
| 4 | Hàm `toKebabCase` loại bỏ được dấu tiếng Việt và ký tự đặc biệt | ✅ Pass |
| 5 | Các template được sử dụng là template ở Local Project của người dùng, không phải template tĩnh từ NPM package | ✅ Pass |
| 6 | Unit Tests | ✅ Pass (83/83 tests) |

## Tóm tắt kỹ thuật
- Tạo mới module `src/generator.js` độc lập, làm nhiệm vụ phân tích cú pháp tiêu đề, tìm đường dẫn template cục bộ của người dùng và copy thay thế nội dung.
- Bắt argument `generate` và `g` trong `bin/index.js`.
- Mock file system để test thành công logic tự động tăng số lượng của ADR (`getNextAdrNumber`).

**Kết luận:** Phase 2 hoàn thiện hoàn hảo. Trải nghiệm người dùng (DevEx) tăng lên đáng kể, tiết kiệm thời gian gõ phím. Sẵn sàng phát hành phiên bản **v0.3.0**.
