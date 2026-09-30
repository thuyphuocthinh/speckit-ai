# Spec: v2 Phase 3 — Automation & Native Git Hook

## Overview
Phase 3 tập trung biến `speckit-ai` thành một công cụ có tính ép buộc kỷ luật (qua Native Git Hook) và hỗ trợ giảm tải khối lượng công việc viết tài liệu cho lập trình viên (qua AI Auto-mode).

## Feature Type
- [x] Feature có API / business logic — + test review
- [x] Script shell/bash (Native Hook)

## Acceptance Criteria

### 1. Native Git Hook (`speckit-ai init-hook`)
- [ ] Bổ sung command/option `init-hook` vào CLI (`bin/index.js`).
- [ ] Khi chạy, tool tìm thư mục `.git/hooks/`. Nếu không có `.git/`, báo lỗi và thoát.
- [ ] Tạo (hoặc ghi đè) file `pre-commit` bên trong `.git/hooks/`. Cấp quyền thực thi (`chmod +x` trên Linux/Mac).
- [ ] **Logic của Hook**:
  - Lấy danh sách các file được staged (`git diff --cached --name-only`).
  - Kiểm tra xem có file source code nào (`.js`, `.ts`, `.py`, `.go`, `.java`, v.v.) bị thay đổi hay không.
  - Nếu CÓ thay đổi source code, kiểm tra tiếp xem có file nào trong `specs/` hoặc `docs/` được thay đổi không.
  - Nếu source code bị thay đổi nhưng tài liệu KHÔNG đổi, block commit (exit code 1) và in ra câu thông báo yêu cầu cập nhật Spec/Docs.
  - Cho phép bypass nếu commit message chứa `[skip-spec]`.

### 2. Tự động hóa viết tài liệu (`--mode=auto`)
- [ ] Nhận diện biến môi trường `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.
- [ ] Khi gõ `--mode=auto`, tool sẽ:
  - Quét cấu trúc source code trong thư mục `src/`, `apps/`, `packages/`, hoặc `cmd/`.
  - Kết nối với API của model tương ứng (Ưu tiên: Gemini -> Claude -> OpenAI nếu nhiều key được set, hoặc cho phép flag `--model=gemini`).
  - Lấy response từ AI và tự động fill nội dung thực tế (dựa trên code) vào file `docs/project-overview.md` và `docs/technology.md`.
- [ ] Fallback: Nếu không có API Key nào được set, in ra log hướng dẫn cách set API Key và dừng chế độ `--mode=auto` (hoặc chuyển về `--mode=new`).

## Out of Scope
- Tự động sinh mã nguồn (Code Gen). Phase này chỉ tự động sinh Tài Liệu (Docs Gen).
- Quét toàn bộ repository có kích thước lớn (chỉ quét cây thư mục và file package/mod để tiết kiệm token LLM).
