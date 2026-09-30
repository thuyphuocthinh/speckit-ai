# Spec: v3 Phase 1 - Enterprise Architecture (ADRs & Contracts)

## 1. Mục tiêu
Hỗ trợ quản lý kiến trúc quy mô lớn bằng cách tự động sinh ra cấu trúc thư mục và template cho Architecture Decision Records (ADR) và API Contracts mỗi khi khởi tạo dự án mới bằng `speckit-ai`.

## 2. Yêu cầu (Requirements)
- **ADR Support**: Khi chạy CLI, phải tạo ra thư mục `docs/adrs/` và file `0000-template.md` theo chuẩn MADR.
- **Contract Support**: Khi chạy CLI, phải tạo ra thư mục `specs/contracts/` và file `_template.md` (chứa mẫu định nghĩa API/Data Schema).
- **Tránh trùng lặp (DRY)**: Thay vì copy 2 template này vào từng thư mục framework (Nextjs, Nestjs, Go...), cần tạo một thư mục `templates/shared/` chứa các template chung. `scaffolder.js` sẽ copy từ `shared/` trước, sau đó mới copy đè từ thư mục framework cụ thể.

## 3. Scope
- Tạo `templates/shared/docs/adrs/0000-template.md`
- Tạo `templates/shared/specs/contracts/_template.md`
- Cập nhật `src/scaffolder.js` để đọc và copy từ `templates/shared` bên cạnh thư mục framework mặc định.

## 4. Acceptance Criteria
- [ ] Lệnh `npx speckit-ai` sinh ra thành công `docs/adrs/0000-template.md` và `specs/contracts/_template.md` trong dự án đích.
- [ ] Code trong `scaffolder.js` áp dụng logic "Shared templates merge with Framework templates".
- [ ] Unit tests cho `scaffolder.js` pass 100%.
