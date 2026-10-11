# Tasks: done-review-covers-ac

## Phase 1: Setup

- [x] Cập nhật spec trong `targets/sdd-single-spine.md` (AC-7 và AC-20)

## Phase 2: Logic

- [x] `done.checkWork`: gom AC id của các target và thêm cổng `review-ac`

## Phase 3: UI / API

- [x] Cập nhật mục Gates trong `templates/_core/specs-workflow.md.tmpl` và `specs/_workflow.md`
- [x] Cập nhật bước 5e của skill `spec-review` (template và `.agents/skills`)
- [x] Cập nhật `docs/tutorials/01-GREENFIELD_WORKFLOW.md` và `05-CLI_REFERENCE.md`

## Phase 4: Tests

- [x] `tests/done.test.js`: fixture cho đủ AC-1 và test cổng mới (thiếu, đủ, AC-1 vs AC-10, hoa/thường, --force, baseline, nhiều target)
- [x] `tests/cli.test.js`: fixture review.md nhắc `AC-1`
- [x] `tests/scaffolder.test.js`: template workflow và skill có yêu cầu mới
- [x] Chạy toàn bộ `npm test`
