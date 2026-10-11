# Proposal: review-sends-changed-acs

> **Affects**: review-fail-closed

## Why

Mỗi lần gọi model, `review` gửi nguyên các `targets/*.md`. Với việc `--affects`, `targets/` là bản copy của cả spec cũ, nên model nhận hàng chục tiêu chí không liên quan tới thay đổi đang review. Khi diff dài bị chia thành nhiều phần, phần spec đó còn bị gửi lặp lại cho từng phần. Context thừa làm tốn token và làm loãng thứ model cần kiểm tra.

## What

`review` chỉ gửi nội dung của các AC mới hoặc đã đổi so với spec hiện có của feature; AC không đổi chỉ còn dòng tiêu đề. Cách xác định "AC đã đổi" dùng chung với cổng AC của `done`.
