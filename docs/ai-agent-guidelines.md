# AI Agent Guidelines — Do / Don't

## ✅ DO — Luôn làm

- Đọc `docs/README.md` và đọc theo required reading order trước khi code
- Đặt file đúng thư mục theo `docs/core-principles-and-coding-standards/structure.md`
- Viết test cho mọi logic quan trọng
- Propose plan trước khi implement các task lớn (> 30 phút)
- Hỏi lại nếu yêu cầu không rõ ràng hoặc mâu thuẫn với convention hiện tại
- Chạy lint và type-check trước khi báo xong
- Ghi rõ lý do nếu phải làm khác so với convention

## ❌ DON'T — Không bao giờ làm

- Không tự ý cài package mới mà không hỏi
- Không bypass ESLint, TypeScript, commit hook
- Không tự ý sửa file ngoài scope của task được giao
- Không xóa code mà không có lý do rõ ràng
- Không dùng `any`, `@ts-ignore`, `eslint-disable` để "fix nhanh"
- Không tự ý deploy, publish, hay push lên production
- Không làm scope creep — nếu phát hiện vấn đề liên quan, báo cáo thay vì tự fix

## ⚠️ Khi gặp tình huống không chắc chắn

Dừng lại và hỏi. Đừng đoán. Một câu hỏi tốt hơn 30 phút code sai hướng.
