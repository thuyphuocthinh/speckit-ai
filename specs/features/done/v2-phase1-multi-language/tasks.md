# Tasks: v2 Phase 1 — Multi-Language Support & Monorepo

> Based on: `plan.md`

## Phase 1.1 — Python & Go Detectors

- [ ] Sửa `src/detector.js` thêm hàm `detectPython(dir)` quét `requirements.txt`, `pyproject.toml`, `Pipfile`.
  - Nếu thấy `django` -> return `python-django`
  - Nếu thấy `fastapi` -> return `python-fastapi`
- [ ] Thêm hàm `detectGo(dir)` quét `go.mod`.
  - Nếu thấy `gin-gonic/gin` -> return `go-gin`
  - Nếu thấy `gofiber/fiber` -> return `go-fiber`
- [ ] Sửa hàm `detect()` để gọi các hàm trên ngoài `package.json`. Trả về `{ type: 'single', framework: '...', packageManager: '...' }`.

## Phase 1.2 — Monorepo Detector

- [ ] Trong `src/detector.js`, kiểm tra sự tồn tại của `turbo.json`, `nx.json`, `lerna.json`, hoặc `pnpm-workspace.yaml`.
- [ ] Nếu là monorepo, quét 1-level deep vào các thư mục `apps/` và `packages/`.
- [ ] Với mỗi thư mục con tìm thấy, gọi lại hàm `detect(thư_mục_con)`.
- [ ] Trả về `{ type: 'monorepo', tool: 'turborepo', subProjects: [...] }`.

## Phase 1.3 — Templates cho Python & Go

- [ ] Tạo `templates/python-django/` (technology, structure, coding-conventions).
- [ ] Tạo `templates/python-fastapi/` (technology, structure, coding-conventions).
- [ ] Tạo `templates/go-gin/` (technology, structure, coding-conventions).
- [ ] Tạo `templates/go-fiber/` (technology, structure, coding-conventions).

## Phase 1.4 — Nâng cấp Scaffolder & CLI

- [ ] Sửa `src/scaffolder.js` để xử lý object trả về từ detector.
- [ ] Nếu `type === 'single'`, behavior giống hệt cũ.
- [ ] Nếu `type === 'monorepo'`, lặp qua `subProjects`. Đối với các file trong `docs/`, đổi `dest` thành `docs/<sub-project-name>/...`. File root sinh 1 lần.
- [ ] Sửa `bin/index.js` để in log phù hợp cho 2 trường hợp.

## Phase 1.5 — Tests & Verify

- [ ] Update `tests/detector.test.js` để test Python, Go, và Monorepo (bằng cách tạo file fake trong temp dir).
- [ ] Chạy `npm test` để verify 100% tests pass.
- [ ] Tạo `review.md` và archive.
