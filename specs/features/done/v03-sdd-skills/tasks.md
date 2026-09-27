# Tasks: v0.3 — SDD Skills

## Phase 1 — Tạo 3 SKILL.md templates

- [ ] Tạo `templates/_skills/spec-create/SKILL.md`
- [ ] Tạo `templates/_skills/spec-plan/SKILL.md`
- [ ] Tạo `templates/_skills/spec-review/SKILL.md`

## Phase 2 — Cập nhật buildFileMap

- [ ] Sửa `buildFileMap()` trong `src/scaffolder.js`: thêm 3 entry copy skill vào `.agents/skills/<tên>/SKILL.md`

## Phase 3 — Self-apply lên chính project CLI

- [ ] Tạo `.agents/skills/spec-create/SKILL.md` (copy từ template)
- [ ] Tạo `.agents/skills/spec-plan/SKILL.md` (copy từ template)
- [ ] Tạo `.agents/skills/spec-review/SKILL.md` (copy từ template)

## Phase 4 — Tests

- [ ] Thêm test: `buildFileMap()` include `.agents/skills/spec-create/SKILL.md`
- [ ] Thêm test: `scaffold` tạo đúng 3 skill files trong `.agents/skills/`

## Phase 5 — Verify

- [ ] `npm test` — 100% pass
- [ ] 3 file trong `.agents/skills/` có nội dung không rỗng
- [ ] Tất cả AC trong spec.md đã check
