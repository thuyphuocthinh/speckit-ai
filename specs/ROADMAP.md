# Roadmap: speckit-ai Expansion Plan

Tài liệu này vạch ra lộ trình phát triển (Roadmap) cho các phiên bản tiếp theo của `speckit-ai` nhằm khắc phục các hạn chế hiện tại và mở rộng quy mô công cụ.

---

## 🎯 v0.8 — Team Collaboration & Configuration

**Mục tiêu:** Giải quyết vấn đề chia sẻ tài liệu trong team và cho phép custom template.

- **Tính năng 1: Cờ `--share` (Disable Stealth Mode)**
  - Mặc định CLI dùng Stealth mode (ghi vào `.git/info/exclude`).
  - Khi chạy `npx speckit-ai --share`, CLI sẽ **bỏ qua** Stealth mode và tự động ghi `!docs/`, `!specs/`, `!.agents/` vào `.gitignore` chính thức (hoặc không ignore). Nhờ vậy, tài liệu AI có thể được commit và chia sẻ với cả team.
- **Tính năng 2: Custom Templates (`.speckitrc` / `speckit.config.json`)**
  - Hỗ trợ file cấu hình ở thư mục gốc của user (VD: `~/.speckitrc`).
  - Cho phép trỏ tới một thư mục templates local, giúp các công ty dùng template riêng của họ thay vì template mặc định của npm.

---

## 🎯 v0.9 — Multi-Language Support & Monorepo

**Mục tiêu:** Mở rộng ra ngoài hệ sinh thái JavaScript và hỗ trợ các dự án lớn.

- **Tính năng 1: Monorepo Detection**
  - Nâng cấp `detector.js` quét sâu hơn để nhận diện Lerna, Nx, Turborepo hoặc Yarn Workspaces.
  - Sinh docs riêng cho từng sub-package (ví dụ: `apps/web` là Next.js, `packages/api` là NestJS).
- **Tính năng 2: Hỗ trợ Python & Go**
  - Quét `requirements.txt` / `Pipfile` / `pyproject.toml` để nhận diện **Django** hoặc **FastAPI**.
  - Quét `go.mod` để nhận diện **Gin** hoặc **Go Fiber**.
  - Thêm hệ thống templates Best Practices cho Python và Go.

---

## 🎯 v1.0 — Auto-Complete Mode (LLM Integration)

**Mục tiêu:** Tự động hóa hoàn toàn `--mode=existing` bằng AI, loại bỏ thao tác copy-paste của con người.

- **Tính năng 1: LLM API Integration**
  - Tích hợp package `openai` hoặc `anthropic`.
  - CLI yêu cầu biến môi trường: `export OPENAI_API_KEY=...`
- **Tính năng 2: `--mode=auto`**
  - Hoạt động: `npx speckit-ai --mode=auto`
  - CLI đọc qua toàn bộ codebase (giới hạn token).
  - Tự động gọi API của ChatGPT/Claude để phân tích.
  - Tự động điền 100% nội dung thực tế vào `project-overview.md`, `technology.md`, `structure.md`, `coding-conventions.md` (thay thế hoàn toàn AI-PROMPT markers).
- **Tính năng 3: Git Hook (Auto-Update Docs)**
  - Thêm một hook `pre-commit`. Mỗi khi code cấu trúc thư mục thay đổi, chạy nền lệnh cập nhật lại `structure.md`.

---

## 🎯 v1.1 — AI Agent Dashboard (Web UI)

**Mục tiêu:** Đưa trải nghiệm ra khỏi Terminal.

- **Tính năng 1: `--ui` flag**
  - Chạy `npx speckit-ai --ui` để mở một Web Dashboard ở `localhost:3000`.
  - Giao diện trực quan để quản lý các file trong `specs/` (Kéo thả để chuyển trạng thái Task: Todo -> Doing -> Review -> Done).
  - Tích hợp giao diện Chatbot để Agent đọc file cấu hình trực tiếp từ Web UI.
