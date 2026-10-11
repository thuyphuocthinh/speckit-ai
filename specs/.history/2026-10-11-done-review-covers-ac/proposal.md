# Proposal: done-review-covers-ac

> **Affects**: sdd-single-spine

## Why

Cổng `review` của `done` chỉ kiểm `review.md` tồn tại và không rỗng, nên một dòng chữ bất kỳ cũng qua được. Review tự thực hiện (bước 5 của flow) có nhiệm vụ đối chiếu từng Acceptance Criterion, nhưng không có gì buộc việc đó. Quyết định "đã review đủ chưa" đang do agent tự tuyên bố, trong khi nó có thể được kiểm bằng code.

## What

Thêm một cổng deterministic vào `done`: `review.md` phải nhắc tới mọi `AC-n` có trong các `targets/*.md`. Cổng này bỏ qua được bằng `--force` (có ghi vào Changelog) và không áp dụng cho việc baseline. Cập nhật `_workflow.md`, skill `spec-review` và tài liệu để nói rõ yêu cầu này.
