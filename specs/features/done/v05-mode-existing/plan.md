# Implementation Plan: v0.5 — `--mode=existing`

> Based on: `spec.md`

## Approach

Thêm tham số `mode` vào toàn bộ pipeline `bin → scaffolder`. Khi `mode=existing`, `buildFileMap()` swap các docs templates (technology, structure, conventions...) sang `_existing/` thay vì fw-specific. Các file _core, skills giữ nguyên.

```
bin/index.js           → parse --mode flag, pass to scaffold()
src/scaffolder.js      → buildFileMap(framework, mode) — thêm tham số mode
templates/_existing/   → 5 skeleton templates với AI-PROMPT markers
```

---

## Files sẽ TẠO MỚI

| File | Mục đích |
|---|---|
| `templates/_existing/technology.md.tmpl` | Skeleton: AI-PROMPT phân tích package.json |
| `templates/_existing/project-overview.md.tmpl` | Skeleton: AI-PROMPT mô tả project |
| `templates/_existing/structure.md.tmpl` | Skeleton: AI-PROMPT phân tích src/ |
| `templates/_existing/coding-conventions.md.tmpl` | Skeleton: AI-PROMPT đúc kết coding patterns |
| `templates/_existing/coding-style.md.tmpl` | Skeleton: AI-PROMPT tìm lint config |

## Files sẽ SỬA

### `bin/index.js`

```
Thêm arg parsing:
- --mode=new (default) hoặc --mode=existing
- Nếu flag không hợp lệ → console.error + process.exit(1)
- Pass mode vào scaffolder.scaffold({ ..., mode })
- Log mode khi chạy
```

### `src/scaffolder.js`

```
buildFileMap(framework, mode):
  Nếu mode === 'existing':
    - technology    → _existing/technology.md.tmpl
    - project-overview → _existing/project-overview.md.tmpl (override fw-specific)
    - structure     → _existing/structure.md.tmpl
    - coding-conventions → _existing/coding-conventions.md.tmpl
    - coding-style  → _existing/coding-style.md.tmpl
  Nếu mode === 'new' (default):
    - Giữ nguyên như hiện tại

  Trong cả 2 mode:
    - _core files (AGENTS, CLAUDE, cursorrules, operation, specs) → không đổi
    - skills → không đổi
```

## Files sẽ THÊM TEST

| File | Test gì |
|---|---|
| `tests/scaffolder.test.js` | `buildFileMap('nestjs', 'existing')` dùng `_existing/` |
| `tests/scaffolder.test.js` | `buildFileMap('nestjs', 'new')` vẫn dùng fw-specific |
| `tests/scaffolder.test.js` | scaffold với `mode=existing` → `coding-conventions.md` chứa `AI-PROMPT` |

## Risks

| Risk | Mitigation |
|---|---|
| Sửa signature `buildFileMap()` break test cũ (tham số thứ 2 mới) | Thêm default `mode = 'new'` → backward compatible |
| `scaffold()` không nhận `mode` → silently fallback | Unit test kiểm tra cụ thể mode=existing vs mode=new |
