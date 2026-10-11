# Lessons: review-fail-closed

> Lessons learned from earlier work on this feature, added by `speckit-ai done`. Read them before changing the feature.

## 2026-10-11 · review-sends-changed-acs

- Khi hai nơi cần cùng một khái niệm (AC đã đổi), đưa nó vào một hàm dùng chung ngay từ đầu, rồi để test của nơi cũ làm bằng chứng không đổi hành vi.
- Công cụ sửa file có thể để lại kiểu xuống dòng lẫn lộn trong file CRLF; script thay chuỗi giả định một kiểu sẽ lỗi, nên ưu tiên công cụ Edit cho các file đã bị sửa nhiều lần.
