# Proposal: done-check

> **Affects**: sdd-single-spine

## Why

Cách duy nhất để biết một việc đã qua các cổng của `done` chưa là chạy `done` thật. Nếu qua, nó ghi spec và cất việc vào `.history/` ngay, không còn cơ hội xem lại; nếu không qua thì ra danh sách lỗi. Agent và CI không có cách an toàn để hỏi "việc này đã sẵn sàng chưa?" mà không có tác dụng phụ. Hook pre-commit cũng chỉ chạy `lint` (cấu trúc), không chạy được các cổng nội dung của `done`.

## What

Thêm `speckit-ai done [<tên>] --check`: chạy đúng các cổng của `done` rồi báo kết quả, không ghi hay di chuyển gì, exit 0 khi qua và exit 1 khi còn lỗi. Cập nhật `--help`, `_workflow.md`, `AGENTS.md` và tài liệu CLI.
