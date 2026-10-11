# Lessons: sdd-single-spine

> Lessons learned from earlier work on this feature, added by `speckit-ai done`. Read them before changing the feature.

## 2026-10-11 · lessons-loop

- Nội dung do `done` sinh ra từ văn bản người viết (dòng Changelog, bài học) cần giữ nguyên chữ trong dấu backtick; bỏ cả đoạn có backtick làm câu mất nghĩa (đã sửa riêng trong `proposalSummary`).
- Khi bài học phải được agent đọc lại, đặt nó ở nơi agent được phép đọc (theo feature) và nhắc bằng đường dẫn cụ thể, thay vì để trong thư mục lịch sử bị cấm đọc.

## 2026-10-11 · done-check

- Khi cần một chế độ "chỉ báo cáo" cho một lệnh đang vừa kiểm vừa ghi, tách phần kiểm thành hàm riêng ngay từ đầu (như `checkWork`) rồi để cả hai chế độ gọi chung; chế độ báo cáo khi đó chỉ là vài dòng in kết quả.
