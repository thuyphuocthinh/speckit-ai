# Tasks: done-check

## Phase 1: Setup

- [x] Thêm AC-23 vào `targets/sdd-single-spine.md`

## Phase 2: Logic

- [x] `done.printCheck` dùng chung `checkWork`
- [x] `cli.js`: cờ `--check` (từ chối kèm `--force` hoặc kèm giá trị), danh sách cờ hợp lệ, `--help`

## Phase 3: UI / API

- [x] `_workflow.md` (template và bản repo), `AGENTS.md.tmpl`
- [x] `docs/tutorials/05-CLI_REFERENCE.md`

## Phase 4: Tests

- [x] `done.test.js`: `printCheck` (qua, không đạt, không ghi gì, nhiều việc, khớp với `finishWork`)
- [x] `cli.test.js`: exit code, không đổi gì trên đĩa, từ chối cờ sai, help
- [x] `scaffolder.test.js`: template nhắc `--check`
- [x] Chạy toàn bộ `npm test`
