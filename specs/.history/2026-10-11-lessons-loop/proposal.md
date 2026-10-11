# Proposal: lessons-loop

> **Affects**: sdd-single-spine

## Why

Mỗi lần làm xong, `review.md` có mục Lessons Learned, nhưng `done` cất cả thư mục việc vào `specs/.history/`, nơi agent được dặn không đọc. Bài học vừa viết ra thì cũng biến mất khỏi tầm nhìn của agent ở lần làm sau: vòng học từ lỗi và kinh nghiệm bị đứt.

## What

`done` trích phần Lessons Learned của `review.md` và thêm vào `specs/features/<slug>/lessons.md` của từng feature bị đụng tới. `start --affects` nhắc đọc file này khi sửa feature có sẵn. Bài học nằm theo feature để agent chỉ đọc đúng phần liên quan tới việc đang làm. Cập nhật `_workflow.md`, các skill, template `AGENTS.md` và tài liệu.
