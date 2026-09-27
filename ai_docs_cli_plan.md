# Plan: `create-ai-docs` CLI — Bộ Công Cụ AI-First Project Setup

> **Mục tiêu:** Đóng gói toàn bộ mô hình AI-first (4-Layer Documentation + Specs-Driven Development) thành một CLI tool có thể chạy trên mọi dự án, mọi AI tool, mọi môi trường (Side Project lẫn Công ty).

---

## Tổng Quan Kiến Trúc

```
npx create-ai-docs
      │
      ├── Phát hiện (Auto-detect)
      │       └── Đọc package.json → xác định Framework
      │
      ├── Scaffolding (Tạo cấu trúc)
      │       ├── .agents/AGENTS.md         → Rule cốt lõi (tool-agnostic)
      │       ├── CLAUDE.md                 → Cross-tool (Claude Code)
      │       ├── .cursorrules              → Cross-tool (Cursor)
      │       ├── docs/                     → Tài liệu convention chi tiết
      │       ├── specs/                    → Specs-Driven Development cycle
      │       └── .agents/skills/           → On-demand skills (4-layer + SDD)
      │
      ├── Nội dung (Content Strategy)
      │       ├── Dự án MỚI  → Template Best Practices (tự viết sẵn)
      │       └── Dự án CŨ  → Skeleton + AI-PROMPT markers
      │
      └── Tàng hình (Stealth mode)
              └── Tự động ghi vào .git/info/exclude
```

---

## Phần 1: Mô Hình 4 Tầng AI-First

### 1.1 — Tự động phát hiện dự án

CLI đọc `package.json` và nhận diện framework:

| Phát hiện thấy | Xác định là |
|---|---|
| `@nestjs/core` | NestJS (Backend) |
| `express`, `fastify` | Node.js thuần (Backend) |
| `next` | Next.js (Fullstack/Frontend) |
| `vue`, `@vitejs/plugin-vue` | Vue 3 |
| `react`, `react-dom` (không có `next`) | React / Vite |

> Nếu không tìm thấy `package.json` → hỏi tương tác hoặc dùng template Generic.

### 1.2 — Cấu trúc thư mục đầy đủ (Scaffolding)

```
.agents/
├── AGENTS.md                                   ← Rule cứng, always-loaded, ngắn (50-80 dòng)
└── skills/
    ├── spec-create/
    │   └── SKILL.md                            ← Skill: Viết spec chuẩn từ yêu cầu
    ├── spec-plan/
    │   └── SKILL.md                            ← Skill: Tạo implementation plan từ spec
    └── spec-review/
        └── SKILL.md                            ← Skill: Review output theo acceptance criteria

CLAUDE.md                                       ← Chỉ chứa: @AGENTS.md (dành cho Claude Code)
.cursorrules                                    ← Chỉ chứa: link tới AGENTS.md (dành cho Cursor)

docs/
├── README.md                                   ← Entry point + Required Reading Order
├── ai-agent-guidelines.md                      ← Do / Don't nhanh cho AI
├── operation.md                                ← No-bypass rules chi tiết
├── project-overview.md                         ← Mô tả dự án + môi trường
├── technology.md                               ← Stack, thư viện, scope
└── core-principles-and-coding-standards/
    ├── structure.md                            ← Cấu trúc thư mục, component hierarchy
    ├── coding-conventions.md                   ← Pattern theo domain
    ├── coding-style.md                         ← Lint, format, command
    └── instructions-and-work-flows/
        ├── README.md                           ← Index workflow
        └── adding-a-new-feature.md             ← Workflow checklist mẫu

specs/
├── _template.md                                ← Template chuẩn để viết spec
├── _workflow.md                                ← Mô tả đầy đủ SDD cycle
└── features/
    ├── done/                                   ← Specs đã implement xong (archive)
    └── <feature-name>/
        ├── spec.md                             ← Bước 1: Requirement & Acceptance Criteria
        ├── plan.md                             ← Bước 2: Technical Implementation Plan
        ├── tasks.md                            ← Bước 3: Checklist tasks chi tiết
        └── review.md                           ← Bước 5: Review & Lessons Learned
```

### 1.3 — Chiến lược nội dung (Content Strategy)

#### Chế độ A: Dự án MỚI (`--mode=new`)
CLI copy các **template Best Practices đã được viết sẵn** theo từng framework:

- **NestJS** → `coding-conventions.md` có sẵn: Dependency Injection, DTOs, Guards, Pipes, Interceptors, Module boundaries.
- **Next.js** → có sẵn: Server Components, Server Actions, Atomic Design, App Router conventions.
- **Vue 3** → có sẵn: Composition API, `<script setup>`, Pinia, composables pattern.
- **React/Vite** → có sẵn: Custom hooks, Context API, component patterns.
- **Express/Node** → có sẵn: Router structure, middleware pattern, error handling.

#### Chế độ B: Dự án CŨ / Công ty (`--mode=existing`)
CLI tạo các file với **Skeleton + AI-PROMPT markers** để AI tự điền:

```markdown
# Coding Conventions

## 1. Cấu trúc thư mục
<!-- AI-PROMPT: Phân tích thư mục src/ và mô tả cách chia module, layers -->

## 2. Xử lý lỗi (Error Handling)
<!-- AI-PROMPT: Quét src/exceptions hoặc filters và đúc kết quy tắc bắt lỗi -->

## 3. Naming Convention
<!-- AI-PROMPT: Tìm pattern đặt tên biến, function, file trong codebase -->
```

Sau khi CLI chạy xong, gõ với AI bất kỳ:
> *"Đọc các file trong docs/, thực hiện các yêu cầu AI-PROMPT dựa trên source code hiện có và điền vào"*

### 1.4 — Stealth Mode (Ẩn khỏi Git của công ty)

CLI tự động append vào `.git/info/exclude` (chỉ local, không ảnh hưởng remote):

```text
.agents/
CLAUDE.md
.cursorrules
docs/
specs/
```

---

## Phần 2: Specs-Driven Development (SDD) Cycle

> Mỗi feature đi qua 5 bước có artifact rõ ràng. Output của bước trước là input của bước sau. AI đọc và thực thi theo từng bước.

### Tổng quan Cycle

```
Ý tưởng → [spec.md] → [plan.md] → [tasks.md] → Implement → [review.md] → Done
              Bước 1      Bước 2      Bước 3        Bước 4       Bước 5
```

---

### Bước 1 — Tạo Spec (`spec.md`)

**Ai làm:** Bạn mô tả yêu cầu → AI (skill `spec-create`) sinh ra file.

**Template `specs/_template.md`:**

```markdown
# Spec: [Tên Feature]

## Overview
Mô tả ngắn gọn feature này làm gì, tại sao cần.

## User Stories
- As a [user], I want [action] so that [benefit]

## Acceptance Criteria
- [ ] Criterion 1 (testable, đo lường được, cụ thể)
- [ ] Criterion 2

## Technical Constraints
- API endpoint nào, schema nào liên quan
- Performance requirement nếu có
- Security requirement nếu có

## Out of Scope
- Những gì KHÔNG làm trong feature này (tránh scope creep)

## Open Questions
- Câu hỏi chưa có câu trả lời, cần confirm với stakeholder trước khi code
```

**Cách dùng:**
```
"Tạo spec cho feature: [mô tả yêu cầu của bạn]"
→ AI trigger skill spec-create
→ Sinh ra specs/features/[tên]/spec.md
```

---

### Bước 2 — Tạo Plan (`plan.md`)

**Ai làm:** AI (skill `spec-plan`) đọc `spec.md` → sinh ra `plan.md`.

```markdown
# Implementation Plan: [Tên Feature]

## Approach
Mô tả hướng giải quyết kỹ thuật, lý do chọn hướng này thay vì hướng khác.

## Files sẽ tạo mới
- `src/modules/user/dto/update-user.dto.ts` — Mô tả mục đích

## Files sẽ sửa
- `src/modules/user/user.service.ts` — Thêm method X
- `src/modules/user/user.controller.ts` — Thêm endpoint Y

## Dependencies
- Feature Y phải xong trước
- Cần cài thêm package Z (lý do)

## Risks & Mitigations
- Risk: Điều gì có thể xảy ra sự cố
- Mitigation: Cách xử lý
```

**Cách dùng:**
```
"Tạo implementation plan từ spec.md của feature [tên]"
→ AI trigger skill spec-plan
→ Sinh ra specs/features/[tên]/plan.md
```

---

### Bước 3 — Tạo Tasks (`tasks.md`)

**Ai làm:** AI đọc `plan.md` → sinh ra `tasks.md` với checklist chi tiết.

```markdown
# Tasks: [Tên Feature]

## Implementation
- [ ] Tạo DTO: UpdateUserDto với validation decorators
- [ ] Thêm method updateProfile() vào UserService
- [ ] Thêm endpoint PATCH /users/:id vào UserController
- [ ] Viết unit test cho UserService.updateProfile()
- [ ] Viết e2e test cho PATCH /users/:id endpoint

## Verify Checklist (phải pass trước khi qua Bước 5)
- [ ] yarn lint — không có warning
- [ ] yarn test — 100% test pass
- [ ] yarn build — build thành công
- [ ] Manual smoke test: [mô tả cụ thể test case]
- [ ] Tất cả Acceptance Criteria trong spec.md đã được check
```

---

### Bước 4 — Implement

**Ai làm:** AI đọc `tasks.md` + `plan.md` + `docs/coding-conventions.md` → code từng task, tự check off từng dòng.

**Nguyên tắc:**
- AI không được tự ý thêm scope ngoài `tasks.md`.
- Mỗi file tạo ra phải đặt đúng theo `docs/structure.md`.
- Không được bypass lint/type-check (theo `AGENTS.md`).
- Nếu gặp vấn đề không lường trước → dừng lại, cập nhật `Open Questions` trong `spec.md`.

---

### Bước 5 — Review (`review.md`)

**Ai làm:** AI (skill `spec-review`) tự review output của mình trước khi bạn xem.

```markdown
# Review: [Tên Feature]

## Acceptance Criteria Status
- [x] Criterion 1 — Pass (file X, dòng Y-Z)
- [x] Criterion 2 — Pass
- [ ] ⚠️ Criterion 3 — Chưa pass, lý do: ...

## Convention Compliance
- [x] File đặt đúng theo structure.md
- [x] Không dùng any / @ts-ignore
- [x] Có unit test
- [ ] ⚠️ Thiếu validation cho field Z

## Deviations from Plan
- Có điểm nào implement khác với plan.md không? Tại sao?

## Lessons Learned
- Ghi lại gì học được → sẽ lưu vào .agents/memory/ cho session sau
```

**Sau khi review pass:** Move thư mục `specs/features/[tên]/` vào `specs/features/done/`.

---

## Phần 3: Cross-Tool Compatibility

| AI Tool | File được đọc | CLI sinh ra |
|---|---|---|
| **Gemini (IDE)** | `.agents/AGENTS.md` | ✅ |
| **Claude Code** | `CLAUDE.md` → `@AGENTS.md` | ✅ |
| **Cursor** | `.cursorrules` → `AGENTS.md` | ✅ |
| **Copilot** | `AGENTS.md` | ✅ |
| **Codex / GPT Engineer** | `AGENTS.md` | ✅ |

> **Nguyên tắc vàng:** `AGENTS.md` là Single Source of Truth. Mọi file khác chỉ là wrapper trỏ về đây.

---

## Phần 4: Quy Trình Thực Tế

### Kịch bản 1 — Side Project mới (Next.js)
```bash
cd my-new-nextjs-project
npx create-ai-docs
# → CLI detect Next.js, sinh ra docs/ với Best Practices + specs/ với template SDD
# → Mở AI, code ngay, AI đã hiểu luật + có workflow SDD sẵn
```

### Kịch bản 2 — Vừa join dự án NestJS ở công ty
```bash
cd /path/to/company-project
npx create-ai-docs --mode=existing
# → CLI tạo docs/ với skeleton + AI-PROMPT markers
# → CLI tạo specs/ với SDD template
# → Tự động ghi vào .git/info/exclude (ẩn hoàn toàn)
# → Nói với AI: "điền docs/ dựa trên source code hiện tại"
```

### Kịch bản 3 — Bắt đầu feature mới (SDD workflow)
```bash
# Không cần lệnh gì cả, chỉ cần chat với AI:
"Tạo spec cho feature: User đổi được avatar, upload lên S3, giới hạn 5MB"
→ AI sinh ra specs/features/user-avatar/spec.md

"Tạo plan từ spec vừa tạo"
→ AI sinh ra specs/features/user-avatar/plan.md

"Tạo task list và bắt đầu implement"
→ AI sinh ra tasks.md và code theo từng task

"Review feature trước khi tôi xem"
→ AI sinh ra review.md, tự kiểm tra, báo cáo kết quả
```

---

## Phần 5: Thư Viện Template theo Framework

```
cli-source/
└── templates/
    ├── _core/                       ← Dùng CHUNG mọi framework
    │   ├── AGENTS.md.tmpl
    │   ├── ai-agent-guidelines.md.tmpl
    │   ├── operation.md.tmpl
    │   ├── docs-README.md.tmpl
    │   └── specs/
    │       ├── _template.md.tmpl
    │       └── _workflow.md.tmpl
    │
    ├── _skills/                     ← Skills dùng CHUNG mọi framework
    │   ├── spec-create/SKILL.md
    │   ├── spec-plan/SKILL.md
    │   └── spec-review/SKILL.md
    │
    ├── nestjs/                      ← Template riêng NestJS
    │   ├── technology.md.tmpl
    │   ├── structure.md.tmpl
    │   └── coding-conventions.md.tmpl
    │
    ├── nextjs/                      ← Template riêng Next.js
    ├── vue/                         ← Template riêng Vue 3
    ├── react/                       ← Template riêng React/Vite
    ├── node-express/                ← Template riêng Express
    └── generic/                     ← Fallback
```

---

## Roadmap Phát Triển

| Version | Nội dung | Ưu tiên |
|---|---|---|
| **v0.1** | CLI core: detect framework + scaffold cấu trúc thư mục + stealth mode | 🔴 Bắt buộc |
| **v0.2** | Template Best Practices đầy đủ cho NestJS và Next.js | 🔴 Bắt buộc |
| **v0.3** | Tích hợp SDD: scaffold `specs/` + 3 skills (spec-create, spec-plan, spec-review) | 🔴 Bắt buộc |
| **v0.4** | Template cho Vue 3, React, Node Express | 🟡 Mở rộng |
| **v0.5** | `--mode=existing` với AI-PROMPT markers | 🟡 Mở rộng |
| **v0.6** | Publish lên npm registry, viết README đầy đủ | 🟢 Nice-to-have |
| **v1.0** | CLI tự cập nhật template khi framework ra version mới | 🔵 Tương lai |

---

## Ghi Chú Thiết Kế Quan Trọng

> [!IMPORTANT]
> **AGENTS.md luôn ngắn (50-80 dòng).** Nội dung chi tiết đẩy hết xuống `docs/`. CLI phải đảm bảo điều này không bị vi phạm.

> [!IMPORTANT]
> **SDD cycle là tùy chọn theo feature, không bắt buộc mọi task.** Bugfix nhỏ không cần tạo spec. Chỉ dùng SDD cho feature mới hoặc thay đổi lớn.

> [!TIP]
> **Bắt đầu từ v0.1 trước.** Chỉ cần ~200 dòng Node.js là đủ để đi được 70% giá trị. Đừng cố build hết một lần.

> [!WARNING]
> **Stealth mode là bắt buộc** nếu muốn dùng ở công ty. Không bao giờ commit `.agents/`, `docs/`, hoặc `specs/` lên remote repo của công ty trừ khi team đồng ý dùng chung.
