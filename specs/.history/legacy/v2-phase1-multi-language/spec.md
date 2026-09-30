# Spec: v2 Phase 1 — Multi-Language Support & Monorepo

## Overview
Mở rộng khả năng nhận diện (detection) và sinh tài liệu (scaffolding) của `speckit-ai` để hỗ trợ các dự án lớn (Monorepo) và các ngôn ngữ phổ biến ngoài JavaScript (Python, Go).

## Feature Type
- [x] Feature có API / business logic — + test review

## User Story
> As a developer working in a polyglot environment or a large monorepo, I want `speckit-ai` to accurately detect my project structure (even if it's Python/Go or a monorepo) and generate the appropriate SDD documentation for each sub-project, so that my AI agents have the correct context regardless of the tech stack.

## Acceptance Criteria

### 1. Python Support
- [ ] Nhận diện được Python (Django) qua `requirements.txt`, `Pipfile` hoặc `pyproject.toml` (chứa chữ `django`).
- [ ] Nhận diện được Python (FastAPI) qua các file tương tự (chứa chữ `fastapi`).
- [ ] Thêm các templates cơ bản cho `python-django` và `python-fastapi`.

### 2. Go Support
- [ ] Nhận diện được Go qua `go.mod`.
- [ ] Nhận diện được framework `gin` hoặc `fiber` (nếu có trong `go.mod`).
- [ ] Thêm các templates cơ bản cho `go-gin` và `go-fiber` (hoặc `go-generic`).

### 3. Monorepo Detection (Basic Support)
- [ ] Nhận diện các file cấu hình monorepo ở root: `turbo.json`, `lerna.json`, `nx.json`, hoặc `pnpm-workspace.yaml`.
- [ ] Nếu là monorepo, CLI sẽ quét thư mục `apps/` và `packages/` (hoặc lấy path từ config) để tìm các sub-projects.
- [ ] CLI sinh ra tài liệu SDD chung ở root (`.agents/`, `specs/`), nhưng tạo thư mục `docs/<sub-project-name>/` riêng biệt cho từng sub-project với template tương ứng.

### 4. Regression & Tests
- [ ] Không làm gãy các logic hiện có của dự án đơn lẻ (Node, React, Vue, Nest, Next).
- [ ] Thêm test case cho detector nhận diện đúng Python, Go, và Monorepo.

## Out of Scope
- Hỗ trợ Java, C#, PHP (có thể bổ sung sau).
- Phân tích chi tiết sự phụ thuộc giữa các sub-package trong Monorepo (chỉ làm ở mức generate docs song song).

## Open Questions
- Với Monorepo, có nên đặt `CLAUDE.md` và `.cursorrules` ở root, hay mỗi sub-package một file riêng? (Đề xuất: Đặt ở root để AI nắm context tổng quát, còn docs chi tiết đưa vào thư mục con).
