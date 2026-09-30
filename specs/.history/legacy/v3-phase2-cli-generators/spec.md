# Spec: v3 Phase 2 - CLI Workflow Generators

## 1. Mục tiêu
Cung cấp các lệnh tự động hóa (Generators) để lập trình viên tạo mới file Spec, ADR, và Contract một cách nhanh chóng, chuẩn format mà không cần copy-paste thủ công.

## 2. Các Lệnh Hỗ Trợ
- `speckit-ai generate feature "<Feature Name>"` (alias: `g f`)
- `speckit-ai generate adr "<Decision Title>"` (alias: `g a`)
- `speckit-ai generate contract "<Contract Name>"` (alias: `g c`)

## 3. Yêu cầu chi tiết
- **Nguồn Template**: Lệnh `generate` PHẢI sử dụng các template CÓ SẴN trong dự án của người dùng (VD: lấy từ `specs/_template.md` hoặc `docs/adrs/0000-template.md`). Nhờ vậy, nếu người dùng đã tùy biến template cho riêng công ty họ, lệnh `generate` vẫn giữ nguyên cấu trúc đó. Nếu không tìm thấy template tại local, báo lỗi yêu cầu chạy `speckit-ai` để khởi tạo.
- **Tự động đặt tên**: Chuyển đổi tên nhập vào thành định dạng Kebab-case cho tên file/thư mục (VD: "Payment Gateway" -> `payment-gateway`).
- **Tự động đánh số (ADR)**: Quét thư mục `docs/adrs/`, tìm số thứ tự lớn nhất, và tăng lên 1 cho ADR mới (VD: `0004-use-redis.md`).
- **Nội suy dữ liệu (Interpolation)**: Thay thế dòng title mặc định trong file thành Title người dùng nhập vào.

## 4. Acceptance Criteria
- [ ] Lệnh `speckit-ai generate feature "User Login"` tạo ra `specs/features/user-login/spec.md`.
- [ ] Lệnh `speckit-ai generate adr "Use JWT"` tạo ra `docs/adrs/0001-use-jwt.md` (nếu chưa có adr nào).
- [ ] Lệnh `speckit-ai generate contract "Auth Service"` tạo ra `specs/contracts/auth-service.md`.
- [ ] Unit Tests phủ sóng các logic parser và auto-numbering.
