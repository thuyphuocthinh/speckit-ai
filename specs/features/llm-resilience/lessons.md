# Lessons: llm-resilience

> Lessons learned from earlier work on this feature, added by `speckit-ai done`. Read them before changing the feature.

## 2026-10-11 · llm-resilience

- Hai đoạn code cùng quyết định một việc (chọn khóa và chọn hãng) sẽ lệch nhau theo thời gian; gom thành một hàm trả về cả hai giá trị cùng nhau.
- Khi nhận dữ liệu từ dịch vụ ngoài, tách rõ lỗi nhất thời (thử lại có giới hạn) khỏi lỗi vĩnh viễn (dừng ngay), và đặt hàm chờ có thể thay trong test để test không phải chờ thật.
- Heredoc dài chứa ký tự đặc biệt có thể làm shell không parse được; dùng công cụ ghi file cho các file dài.
