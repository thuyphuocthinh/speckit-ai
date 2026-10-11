# Tasks: lessons-loop

## Phase 1: Setup

- [x] Cập nhật spec trong `targets/sdd-single-spine.md` (Overview, AC-9, AC-21, AC-22, Out of Scope)

## Phase 2: Logic

- [x] `done.extractLessons` và `done.appendLessons` (CRLF/LF, tạo file mới kèm tiêu đề)
- [x] `finishWork`: chuẩn bị nội dung trước khi ghi, ghi `lessons.md` cho từng target, in đường dẫn, trả `lessons`
- [x] `lifecycle.startWork`: nhắc đọc `lessons.md` của feature bị ảnh hưởng

## Phase 3: UI / API

- [x] `_workflow.md` (template và bản repo): cây thư mục, bước 5e, Rules, bảng lệnh
- [x] Skill `spec-create`, `spec-plan`, `spec-review` (template và `.agents/skills`)
- [x] `templates/_core/AGENTS.md.tmpl`: nhắc đọc `lessons.md`
- [x] Tài liệu: tutorial 01, CLI reference, `structure.md`, README

## Phase 4: Tests

- [x] `done.test.js`: trích bài học, thêm vào file có sẵn, nhiều target, các trường hợp không ghi, CRLF, thất bại không ghi gì, `extractLessons`
- [x] `lifecycle.test.js`: nhắc nhở khi `--affects` (AC-22)
- [x] `linter.test.js`: `lessons.md` không bị lint
- [x] `scaffolder.test.js`: template và skill nói về lessons
- [x] Chạy toàn bộ `npm test`
