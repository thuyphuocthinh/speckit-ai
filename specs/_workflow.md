# SDD Workflow

## Cycle tổng quan

```
Ý tưởng
  → specs/features/<tên>/spec.md          Bước 1: Yêu cầu + Acceptance Criteria
  → specs/features/<tên>/plan.md          Bước 2: Technical approach
  → specs/features/<tên>/tasks.md         Bước 3: Checklist implement chi tiết
  → Implement                             Bước 4: Code theo tasks.md
  → specs/features/<tên>/review.md        Bước 5: AI self-review tổng hợp
  → specs/features/done/<tên>/            Done: Archive
```

---

## Phân loại feature — Bước nào cần làm?

| Loại | Ví dụ | Các bước |
|---|---|---|
| **Bugfix nhỏ** (< 30 phút) | Fix typo, null check | Chỉ cần commit message rõ ràng |
| **Feature UI / Logic đơn giản** | Thêm component, CRUD cơ bản | Bước 1 → 5 |
| **Feature có API / business logic** | Endpoint mới, service phức tạp | Bước 1 → 5 + Test Review |
| **Feature nhạy cảm** | Auth, payment, upload, data export | Bước 1 → 5 + Test Review + Security Review |
| **Refactor lớn** | Đổi kiến trúc, migration | Bước 1 → 5 + Performance Review |

---

## Chi tiết từng bước

### Bước 1 — `spec.md`
Mô tả yêu cầu, user stories, acceptance criteria, out of scope, open questions.
> Không được implement nếu open questions chưa được resolve.

### Bước 2 — `plan.md`
Technical approach, files sẽ tạo/sửa, dependencies, risks.

### Bước 3 — `tasks.md`
Checklist implement từng bước nhỏ + verify checklist (lint, test, smoke test).

### Bước 4 — Implement
Code theo `tasks.md`. Check off từng task. Không tự ý thêm scope.

### Bước 5 — `review.md` (AI self-review)

AI tự kiểm tra toàn bộ trước khi báo xong. Gồm các mục sau tùy loại feature:

#### 5a. Code Review (mọi feature)
- Convention đúng chưa? (so với `docs/coding-conventions.md`)
- Có dead code, unused import, hardcoded value không?
- Logic có dễ đọc và maintain không?

#### 5b. Test Review (feature có API / logic)
- Unit test đã cover các happy path chưa?
- Đã test edge cases và error cases chưa?
- Coverage có đủ không (ít nhất critical paths)?

#### 5c. Security Review (feature nhạy cảm)
- Input có được validate/sanitize trước khi xử lý không?
- Có lộ thông tin nhạy cảm trong response, log, error message không?
- Authentication/Authorization đúng chưa?
- SQL injection / XSS / CSRF nếu applicable?

#### 5d. Performance Review (refactor lớn / query nặng)
- Có N+1 query không?
- Có thể gây memory leak không?
- Response time có đạt yêu cầu trong spec không?

#### 5e. Tổng hợp
- Tất cả Acceptance Criteria trong `spec.md` đã pass chưa?
- Lessons Learned — ghi lại để tham khảo sau

---

## Quy tắc

- Không implement nếu `spec.md` còn open questions chưa resolve
- Không báo xong nếu `review.md` chưa có
- Sau khi done → move toàn bộ thư mục vào `specs/features/done/`
- Bugfix nhỏ không cần spec — commit message rõ ràng là đủ

---

## Cách dùng với AI

```
"Tạo spec cho feature: [mô tả yêu cầu]"
"Tạo plan từ spec của [tên feature]"
"Tạo task list cho [tên feature]"
"Implement theo tasks.md của [tên feature]"
"Review [tên feature] — bao gồm code review, test review, security review"
```
