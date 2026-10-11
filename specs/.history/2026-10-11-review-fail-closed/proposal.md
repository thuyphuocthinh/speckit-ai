# Proposal: review-fail-closed

> **Affects**: review-fail-closed

## Why

`speckit-ai review` là một Sensor: nó phải cho biết code có khớp spec hay không. Hiện nay nó có thể báo "passed" trong khi chưa kiểm tra đủ: diff bị cắt lặng lẽ ở 15000 ký tự, file mới chưa track không nằm trong diff, và kết quả JSON của model không được kiểm kiểu (`"success": "false"` vẫn bị coi là passed). `handoff` thì lấy diff theo cách khác `review`, nên hai lệnh nhìn thấy hai bộ thay đổi khác nhau.

## What

- Một module dùng chung thu thập diff (đã stage, chưa stage, và nội dung file mới chưa track) cho `review` và `handoff`.
- `review` chia diff theo file thành nhiều phần nhỏ hơn giới hạn thay vì cắt; không bao giờ trả passed trên dữ liệu chưa được xem đủ.
- Kết quả của model được kiểm schema; sai dạng hoặc tự mâu thuẫn thì coi là không passed.
- File khóa phụ thuộc (lock file) không được gửi đi và được báo rõ là bị bỏ qua.
- `handoff` báo khi diff bị cắt.
