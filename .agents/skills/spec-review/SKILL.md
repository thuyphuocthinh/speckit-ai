---
name: spec-review
description: Tự review code đã implement theo spec, tạo review.md với đầy đủ các loại review phù hợp với feature type. Trigger khi người dùng nói "review feature", "kiểm tra", "self-review".
---

# Skill: Review (spec-review)

## Khi nào trigger

Khi người dùng muốn AI tự review feature đã implement.

Trigger phrases:
- "Review feature [tên]"
- "Kiểm tra [feature] trước khi tôi xem"
- "Self-review [feature]"
- "Review xong chưa?"

## Quy trình thực hiện

### Bước 1 — Đọc context

Đọc theo thứ tự:
1. `specs/features/<tên>/spec.md` → biết Acceptance Criteria và Feature Type
2. `specs/features/<tên>/tasks.md` → biết những gì đã được implement
3. `docs/core-principles-and-coding-standards/coding-conventions.md` → tiêu chuẩn code

### Bước 2 — Xác định loại review cần làm

Dựa vào **Feature Type** trong spec.md:

| Feature Type | Review cần làm |
|---|---|
| UI / Logic đơn giản | 5a (Code) + 5e (Tổng hợp) |
| Có API / business logic | 5a + 5b (Test) + 5e |
| Nhạy cảm (auth, payment, data) | 5a + 5b + 5c (Security) + 5e |
| Refactor lớn | 5a + 5d (Performance) + 5e |

### Bước 3 — Thực hiện review và tạo review.md

```
specs/features/<tên>/review.md
```

#### 5a. Code Review (mọi feature)

Kiểm tra từng file đã tạo/sửa:
- Có đặt đúng thư mục theo `docs/structure.md` không?
- Có tuân theo naming convention không?
- Có dead code, unused import, hardcoded value (magic number, hardcoded URL) không?
- Logic có dễ đọc không? Có cần comment giải thích không?
- Có duplicate logic đã tồn tại ở nơi khác không?

#### 5b. Test Review (feature có API / logic)

- Happy path đã được test chưa?
- Edge cases đã được test chưa? (null, empty, boundary values)
- Error cases đã được test chưa? (404, 400, 500)
- Test có đang test implementation thay vì behavior không? (anti-pattern)

#### 5c. Security Review (feature nhạy cảm)

- Input từ client có được validate/sanitize trước khi xử lý không?
- Response có trả về thông tin nhạy cảm không cần thiết không? (password hash, internal ID, stack trace)
- Log có ghi thông tin nhạy cảm không? (token, password, PII)
- Authentication đúng chưa? Authorization đúng chưa? (đúng role, đúng ownership)
- SQL injection khả năng có không?
- Nếu có file upload: loại file, kích thước, tên file có được validate không?

#### 5d. Performance Review (refactor lớn / query nặng)

- Có N+1 query không? (vòng lặp gọi DB)
- Có query thiếu index không?
- Có memory leak tiềm ẩn không? (event listener không được cleanup, large data in memory)
- Response time ước tính có đạt yêu cầu trong spec không?

#### 5e. Tổng hợp (mọi feature)

- Tick từng Acceptance Criteria trong spec.md, ghi rõ Pass/Fail và lý do
- Nếu có Fail → mô tả vấn đề và cách fix
- Lessons Learned: ghi lại insight hoặc quyết định đáng nhớ

### Bước 4 — Kết luận

Sau khi viết review.md:
- Nếu tất cả AC pass và không có issue nghiêm trọng → báo "✅ Sẵn sàng archive"
- Nếu có issue → liệt kê rõ, fix xong mới archive
- Gợi ý: "Chạy `Move-Item specs/features/<tên> specs/features/done/<tên>` để archive"
