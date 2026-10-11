# Proposal: agents-tiered-reading

> **Affects**: agents-tiered-reading

## Why

Template AGENTS.md bắt agent đọc đủ sáu file tài liệu theo thứ tự trước mọi task. Context của agent là tài nguyên đắt: đọc tài liệu cấu trúc thư mục khi chỉ sửa một hàm, hay tài liệu lint khi không đụng format, là tốn token vô ích và làm loãng thông tin quan trọng. `docs/README.md` đã có cột "When needed", nhưng `AGENTS.md` (file agent đọc đầu tiên) lại nói ngược lại.

## What

Đổi mục "Required Reading Order" của `templates/_core/AGENTS.md.tmpl` thành hai tầng: file luôn đọc, và file chỉ đọc khi task cần (kèm điều kiện), nhất quán với `docs/README.md`.
