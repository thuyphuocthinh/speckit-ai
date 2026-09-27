# Implementation Plan: v2 Phase 1 — Multi-Language Support & Monorepo

> Based on: `spec.md`

## Approach

Để hỗ trợ Monorepo và các ngôn ngữ mới, ta cần thay đổi cấu trúc của `detector.js` và `scaffolder.js`:

1. **`detector.js`**: 
   - Thay vì trả về 1 framework duy nhất, giờ đây nó cần trả về thông tin xem project là `single` hay `monorepo`.
   - Nếu là `monorepo`, nó trả về danh sách các `subProjects`, mỗi cái có `framework` và `packageManager` riêng.
   - Bổ sung logic quét file `requirements.txt`, `Pipfile`, `pyproject.toml` (cho Python) và `go.mod` (cho Go).

2. **`scaffolder.js`**:
   - Nếu là dự án `single`, luồng chạy như cũ.
   - Nếu là `monorepo`, các file root (như `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `specs/`) vẫn được sinh 1 lần ở root.
   - Nhưng mục `docs/` sẽ lặp qua danh sách `subProjects` để tạo ra `docs/<sub-project-name>/...`.

3. **Templates**:
   - Thêm thư mục template cho `python-django`, `python-fastapi`, `go-gin`, `go-fiber`.

## Files sẽ TẠO MỚI

| File | Mục đích |
|---|---|
| `templates/python-django/...` | Các template `.md.tmpl` cho Django |
| `templates/python-fastapi/...` | Các template `.md.tmpl` cho FastAPI |
| `templates/go-gin/...` | Các template `.md.tmpl` cho Gin |
| `templates/go-fiber/...` | Các template `.md.tmpl` cho Fiber |

## Files sẽ SỬA

### `src/detector.js`
- Sửa hàm `detect()` để trả về object: 
  `{ type: 'single', framework: '...', packageManager: '...' }` 
  HOẶC 
  `{ type: 'monorepo', tool: 'turborepo', subProjects: [{ name: 'api', path: 'apps/api', framework: 'nestjs' }, ...] }`.
- Thêm các regex/helper đọc file Python, Go.

### `src/scaffolder.js`
- Sửa `scaffold()` để lặp qua `subProjects` nếu `type === 'monorepo'`.
- Cập nhật logic đường dẫn output của mục `docs/` (chèn thêm `<sub-project-name>`).

### `bin/index.js`
- Cập nhật log để hiển thị rõ việc phát hiện Monorepo và số lượng sub-projects.

## Risks & Mitigation
- **Risk:** Quét monorepo quá chậm nếu thư mục lớn. 
  - **Mitigation:** Chỉ quét ở mức nông (chỉ tìm trong `apps/`, `packages/` 1-2 level), không dùng đệ quy sâu.
- **Risk:** Gãy logic cho các dự án bình thường (single).
  - **Mitigation:** Refactor cẩn thận và cập nhật test case cũ, đảm bảo fallback chuẩn.
