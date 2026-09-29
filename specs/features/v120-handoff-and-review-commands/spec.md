# Feature Specs: v1.2.0 Handoff and Review Commands

> Note: Những tính năng này sẽ được thêm vào hệ thống CLI lõi của `speckit-ai`.

## Acceptance Criteria

### Tính năng 1: Lệnh Handoff (Bàn giao ngữ cảnh)
- **AC-1.1:** Khi user gõ lệnh `npx speckit-ai handoff`, Tool phải tự động chạy `git diff` (lấy code chưa commit) và `git status`.
- **AC-1.2:** Tool gọi LLM (OpenAI/Anthropic) để phân tích đống diff đó và viết ra một đoạn Tóm tắt (Summary). Bao gồm: "Đã làm được gì, Lỗi đang mắc phải là gì".
- **AC-1.3:** Tool tự động append (thêm) đoạn tóm tắt này vào dưới cùng của file `tasks.md` của tính năng đang mở (Dựa trên branch hoặc thay đổi file lớn nhất). 

### Tính năng 2: Lệnh Review (AI Code Review)
- **AC-2.1:** Khi user gõ lệnh `npx speckit-ai review "feature-name"`. Tool sẽ đọc file `specs/features/feature-name/spec.md`.
- **AC-2.2:** Tool gói toàn bộ code mới sửa (git diff) + `AGENTS.md` + `spec.md` gửi vào một luồng Prompt hoàn toàn mới cho LLM.
- **AC-2.3:** LLM phải đóng vai Senior Architect, trả về kết quả ra Terminal (hoặc file `.md`). Bắt buộc check 2 thứ:
  - Có hoàn thành 100% Acceptance Criteria chưa? (Check list)
  - Có vi phạm Single Responsibility / Clean Code không?
- **AC-2.4:** Nếu trượt AC hoặc vi phạm SOLID, lệnh CLI phải trả về `process.exit(1)` (Để chặn CI/CD hoặc Git push).
