# Proposal: llm-resilience

> **Affects**: llm-resilience

## Why

Các lệnh gọi LLM (`--mode=auto`, `handoff`, `review`) chưa có timeout nên có thể treo không báo gì; chưa có retry nên một lỗi mạng hay giới hạn tốc độ nhất thời làm cả lệnh thất bại (với `review` chia nhiều phần, mất cả các phần đã review xong); phản hồi bị chặn hoặc rỗng gây `TypeError` khó hiểu; và khóa API với model được chọn bằng hai logic khác nhau nên khi đặt nhiều khóa, khóa của hãng này có thể bị gửi tới hãng khác. Model ID bị cứng trong code nên khi hãng gỡ model thì tool hỏng mà người dùng không có cách đổi.

## What

Một lớp gọi API chung có timeout, retry có giới hạn cho lỗi nhất thời, thông báo lỗi rõ ràng cho từng loại lỗi; chọn hãng trước rồi dùng đúng khóa của hãng đó; model cấu hình được bằng biến môi trường; và `--mode=auto` kiểm schema kết quả trước khi ghi bất cứ thứ gì.
