# Review: v0.1 — CLI Core

> Reviewed: 2026-09-27
> Reviewer: AI self-review (spec-review)

---

## Acceptance Criteria Status

| # | Criterion | Status | Ghi chú |
|---|---|---|---|
| 1 | NestJS detected khi có `@nestjs/core` | ✅ Pass | unit test + manual |
| 2 | Next.js detected khi có `next` | ✅ Pass | unit test + manual verify |
| 3 | Vue detected khi có `vue` | ✅ Pass | unit test |
| 4 | React detected khi có `react` (không có `next`) | ✅ Pass | unit test |
| 5 | Generic khi không có `package.json` | ✅ Pass | unit test |
| 6 | `.agents/AGENTS.md` tồn tại, không rỗng | ✅ Pass | integration test + manual |
| 7 | `CLAUDE.md` trỏ về `AGENTS.md` | ✅ Pass | template đúng |
| 8 | `.cursorrules` trỏ về `AGENTS.md` | ✅ Pass | template đúng |
| 9 | `docs/` có ≥ 4 file | ✅ Pass | 6 file được tạo |
| 10 | `specs/` có `_template.md` và `_workflow.md` | ✅ Pass | integration test |
| 11 | `.git/info/exclude` được cập nhật | ✅ Pass | manual test với git init |
| 12 | Không crash khi không phải git repo | ✅ Pass | unit test + log warning |
| 13 | Skip + không ghi đè file đã tồn tại | ✅ Pass | unit test + manual (lần 2) |

**Tất cả 13/13 Acceptance Criteria: PASS ✅**

---

## Test Coverage

| File | Test cases | Kết quả |
|---|---|---|
| `src/detector.js` | 18 cases | ✅ 18/18 pass |
| `src/stealth.js` | 11 cases | ✅ 11/11 pass |
| `src/scaffolder.js` | 14 cases | ✅ 14/14 pass |
| Smoke test | 1 case | ✅ 1/1 pass |
| **Tổng** | **44 cases** | **✅ 44/44 pass** |

---

## Convention Compliance

- [x] Tất cả file trong `src/` đều export module (không có side effect khi require)
- [x] Dùng `path.join()` xuyên suốt — không string concat thủ công
- [x] Mọi file I/O đều sync (phù hợp CLI, không phải server) và có error handling
- [x] Không dùng runtime dependency ngoài Node.js built-in
- [x] `bin/index.js` có shebang line `#!/usr/bin/env node`
- [x] Tất cả function đều có JSDoc comment mô tả input/output
- [x] Mọi log đều có prefix `[create-ai-docs]` — nhất quán

---

## Deviations from Plan

| Điểm | Kế hoạch | Thực tế | Lý do |
|---|---|---|---|
| File I/O | `fs.promises` (async) | `fs` sync | CLI không cần async — sync đơn giản hơn và đủ nhanh (< 1s) |
| `node-express` template | Có trong plan | Chưa tạo template riêng, dùng generic | Out of scope v0.1, không ảnh hưởng functionality |
| Test count | ~21 cases | 44 cases | Viết thêm integration tests khi thấy cần thiết |

---

## Performance

- Chạy trong Next.js test project: **< 1 giây** ✅ (spec yêu cầu < 3 giây)

---

## Known Limitations (để v0.2+)

- ❌ Chưa có template riêng cho `node-express` (đang fallback về `generic`)
- ❌ Chưa có `--mode=existing` với AI-PROMPT markers
- ❌ Chưa có màu sắc terminal (chalk)
- ❌ Chưa publish npm — chỉ chạy được local bằng `node bin/index.js`

---

## Lessons Learned

1. **Sync vs Async cho CLI**: Dùng `fs` sync trong CLI là đúng — đơn giản hơn, không cần handle Promise chain, đủ nhanh cho file I/O nhỏ.
2. **Fallback template**: Cơ chế fallback về `generic/` khi không có template framework-specific rất hữu ích — tránh crash khi thêm framework mới chưa có template.
3. **Self-eating**: Chạy CLI trên chính project của nó (generic detection, skip mode) là cách test tích hợp tự nhiên nhất.

---

## Verdict

> ✅ **v0.1 DONE — Sẵn sàng archive**
