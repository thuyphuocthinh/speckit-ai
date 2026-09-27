---
name: spec-plan
description: Đọc spec.md và tạo plan.md với technical approach chi tiết. Trigger khi người dùng nói "tạo plan", "lên plan từ spec", "plan feature".
---

# Skill: Tạo Plan (spec-plan)

## Khi nào trigger

Khi người dùng muốn tạo implementation plan từ spec đã có.

Trigger phrases:
- "Tạo plan từ spec của [feature]"
- "Lên plan cho [feature]"
- "Plan feature [tên]"

## Quy trình thực hiện

### Bước 1 — Đọc spec.md

Đọc `specs/features/<tên>/spec.md`. Nếu còn Open Questions chưa resolve → báo cho người dùng, không tạo plan cho đến khi resolve xong.

### Bước 2 — Phân tích kỹ thuật

Trước khi viết plan, tự hỏi:
- Cần tạo file mới nào? Sửa file nào?
- Có thể tái dùng code/module nào đã có không?
- Dependencies nào cần cài thêm?
- Có risk kỹ thuật nào tiềm ẩn không?
- Có breaking change nào không?

Tham khảo:
- `docs/core-principles-and-coding-standards/structure.md` → đặt file đúng chỗ
- `docs/core-principles-and-coding-standards/coding-conventions.md` → dùng đúng pattern

### Bước 3 — Tạo plan.md

```
specs/features/<tên>/plan.md
```

Nội dung bắt buộc:

**Approach**: Giải thích hướng giải quyết và lý do chọn hướng đó (nếu có nhiều lựa chọn).

**Files sẽ tạo mới**: Liệt kê đường dẫn đầy đủ + mục đích ngắn gọn.

**Files sẽ sửa**: Liệt kê + mô tả thay đổi cụ thể.

**Dependencies**: Package cần cài (nếu có) + lý do.

**Risks & Mitigations**: Ít nhất 1-2 risk cần nhắc đến.

### Bước 4 — Kiểm tra tính nhất quán

Sau khi viết plan:
- Mọi Acceptance Criteria trong spec.md có được cover bởi ít nhất 1 file thay đổi không?
- Có file nào đặt sai thư mục theo `docs/structure.md` không?

### Bước 5 — Báo cáo

Thông báo:
- Đường dẫn plan.md vừa tạo
- Tóm tắt: X files tạo mới, Y files sửa
- Bước tiếp theo: "Gõ 'tạo task list cho [feature]' để tiếp tục"
