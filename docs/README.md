# docs/README.md — Required Reading Order

> **Entry point tài liệu cho AI.** Đọc file này trước tiên, sau đó đọc theo thứ tự bên dưới.

---

## Required Reading Order

Khi nhận bất kỳ task nào, AI phải đọc theo thứ tự sau:

| Thứ tự | File | Khi nào cần |
|---|---|---|
| 1 | `docs/project-overview.md` | Luôn luôn |
| 2 | `docs/technology.md` | Luôn luôn |
| 3 | `docs/core-principles-and-coding-standards/structure.md` | Khi tạo/sửa file |
| 4 | `docs/core-principles-and-coding-standards/coding-conventions.md` | Khi viết logic |
| 5 | `docs/core-principles-and-coding-standards/coding-style.md` | Khi format/lint |
| 6 | `docs/core-principles-and-coding-standards/instructions-and-work-flows/` | Khi làm task cụ thể |

---

## SDD Workflow

Mọi feature (mới hoặc thay đổi) đều phải đi qua SDD cycle:
```
idea → start → spec (targets/) → plan.md → tasks.md → implement → review.md → done
```

Việc đang làm nằm ở `specs/active/<tên>/`; spec đã xong nằm ở `specs/features/<slug>/spec.md`. Không đọc `specs/.history/`.

Xem chi tiết tại `specs/_workflow.md`.
