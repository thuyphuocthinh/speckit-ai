# Proposal: Handoff & Review Commands (v1.2.0)

## 1. Vấn đề (The Problem)
Khi sử dụng AI (như Claude, GPT) để code trong các project phức tạp, ta gặp 2 điểm nghẽn cực lớn:
1. **Context Window Limit:** Hội thoại càng dài, AI càng ngáo, bắt đầu quên requirement hoặc lặp lại lỗi sai. Con người muốn nghỉ ngơi và truyền lại việc cho AI (hoặc đồng nghiệp) vào hôm sau rất khó khăn.
2. **Confirmation Bias:** Nhờ chính con AI vừa viết code đi review lại code của nó là vô nghĩa, vì nó luôn tự cho là nó đúng, bỏ qua các lỗi Clean Code / SOLID.

## 2. Giải pháp (The Solution)
Bổ sung 2 lệnh Native CLI hoàn toàn mới vào `speckit-ai`:
- Lệnh **`npx speckit-ai handoff`**: Tự động dùng LLM đọc `git diff`, tóm tắt tiến độ hiện tại, và ghim vào cuối file `tasks.md`. Đóng gói Context để Reset phiên chat mới hoàn hảo.
- Lệnh **`npx speckit-ai review "<feature>"`**: Mở một luồng chạy ngầm độc lập (Fresh Context). Gửi `spec.md`, `AGENTS.md` và `git diff` cho LLM đóng vai "Senior Architect" để soi lỗi vi phạm SOLID và Acceptance Criteria.

## 3. Lợi ích (Value)
- Giúp team biến `speckit-ai` thành hub giao tiếp giữa Người - AI và AI - AI.
- Sẵn sàng tích hợp lệnh `review` vào Github Actions / Git Hooks (CI/CD).
