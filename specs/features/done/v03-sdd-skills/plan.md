# Implementation Plan: v0.3 — SDD Skills

> Dựa trên: `spec.md`

## Approach

Tạo 3 SKILL.md theo định dạng Gemini/AI Skill chuẩn (YAML frontmatter + body markdown). Cập nhật `buildFileMap()` để include 3 skill vào output. Sau đó self-apply lên chính project CLI.

## Files sẽ TẠO MỚI

| File | Nội dung |
|---|---|
| `templates/_skills/spec-create/SKILL.md` | Dạy AI: hỏi yêu cầu → sinh `spec.md` đúng template |
| `templates/_skills/spec-plan/SKILL.md` | Dạy AI: đọc `spec.md` → sinh `plan.md` với technical approach |
| `templates/_skills/spec-review/SKILL.md` | Dạy AI: đọc tasks + code → sinh `review.md` theo loại feature |

## Files sẽ SỬA

| File | Thay đổi |
|---|---|
| `src/scaffolder.js` — `buildFileMap()` | Thêm 3 entry skill vào output map |

## Files sẽ TỰ APPLY (sau khi implement)

Copy 3 skill từ `templates/_skills/` vào `.agents/skills/` của chính project CLI này.

## SKILL.md Format

```
---
name: spec-create
description: Tạo spec.md chuẩn SDD từ yêu cầu của người dùng
---

# Body: hướng dẫn chi tiết cho AI
```

## Risks

| Risk | Mitigation |
|---|---|
| SKILL.md format không đúng → AI không trigger được | Test bằng cách đọc file sau khi tạo, verify frontmatter hợp lệ |
