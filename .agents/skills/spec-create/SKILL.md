---
name: spec-create
description: Tạo spec.md chuẩn SDD từ yêu cầu của người dùng. Trigger khi người dùng nói "tạo spec cho feature", "viết spec", "bắt đầu feature mới".
---

# Skill: Tạo Spec (spec-create)

## Khi nào trigger

Khi người dùng muốn bắt đầu một feature mới hoặc yêu cầu viết spec.

Ví dụ trigger phrases:
- "Tạo spec cho feature: ..."
- "Viết spec cho ..."
- "Bắt đầu feature mới: ..."

## Quy trình thực hiện

### Bước 1 — Xác định thông tin còn thiếu

Trước khi viết spec, hỏi lại người dùng những điều chưa rõ:
- Feature này làm gì chính xác?
- Ai là người dùng cuối?
- Có constraint nào về performance, security không?
- Có gì nằm ngoài scope không?

> Chỉ hỏi những gì thực sự chưa rõ. Không hỏi những điều đã rõ trong yêu cầu ban đầu.

### Bước 2 — Xác định Feature Type

Phân loại feature dựa trên mô tả:
- Bugfix nhỏ (< 30 phút) → chỉ cần commit message, không cần spec
- Feature UI / Logic đơn giản → review cơ bản
- Feature có API / business logic → + test review
- Feature nhạy cảm (auth, payment, data export) → + security review
- Refactor lớn → + performance review

### Bước 3 — Tạo thư mục và file

```
specs/features/<tên-feature-kebab-case>/spec.md
```

Tên thư mục: kebab-case, ngắn gọn, mô tả được feature.
Ví dụ: `user-avatar-upload`, `auth-refresh-token`, `product-search`

### Bước 4 — Viết spec.md theo template

Dùng template tại `specs/_template.md`. Đảm bảo:

**Overview**: 2-3 câu, rõ ràng, không dùng jargon không cần thiết.

**Feature Type**: Check đúng loại để xác định review cần thiết ở bước 5.

**Acceptance Criteria**: Mỗi criterion phải:
- Testable (có thể verify được bằng test hoặc manual)
- Cụ thể (không mơ hồ)
- Đo lường được

Ví dụ tốt: `Khi upload file > 5MB → trả về lỗi 400 với message "File too large"`
Ví dụ xấu: `Upload hoạt động tốt`

**Open Questions**: Liệt kê những điều chưa rõ cần confirm trước khi code. Nếu không có → để trống mục này.

### Bước 5 — Báo cáo

Sau khi tạo xong, thông báo:
- Đường dẫn file spec vừa tạo
- Tóm tắt feature type và review sẽ cần
- Bước tiếp theo: "Gõ 'tạo plan từ spec này' để tiếp tục"
