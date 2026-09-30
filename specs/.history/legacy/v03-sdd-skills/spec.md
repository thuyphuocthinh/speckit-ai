# Spec: v0.3 — SDD Skills

## Overview

Tạo 3 SKILL.md file trong `templates/_skills/` để dạy AI cách chạy SDD cycle trong bất kỳ project nào được scaffold bởi CLI. Sau khi scaffold, `.agents/skills/` của project target sẽ có 3 skill sẵn sàng trigger.

## Feature Type
- [x] Feature có API / business logic — + test review

## Acceptance Criteria

- [ ] `templates/_skills/spec-create/SKILL.md` tồn tại với hướng dẫn viết spec đầy đủ
- [ ] `templates/_skills/spec-plan/SKILL.md` tồn tại với hướng dẫn tạo plan đầy đủ
- [ ] `templates/_skills/spec-review/SKILL.md` tồn tại với hướng dẫn review (code, test, security, performance)
- [ ] `buildFileMap()` được cập nhật để copy 3 skill vào `.agents/skills/` của project target
- [ ] 3 skill file được copy vào `.agents/skills/` của chính project CLI này (self-apply)
- [ ] `npm test` vẫn pass 100%

## Out of Scope

- Không tạo thêm skill ngoài 3 skill SDD
- Không thay đổi logic detect/stealth

## Open Questions

- Không có
