# Review: v0.4 — Enhanced Vue & React Templates

> Reviewed: 2026-09-27

## Acceptance Criteria Status

| # | Criterion | Status |
|---|---|---|
| 1 | Vue `coding-conventions.md.tmpl` có Router guards pattern | ✅ Pass |
| 2 | Vue `coding-conventions.md.tmpl` có API composable pattern | ✅ Pass |
| 3 | Vue `coding-conventions.md.tmpl` có form validation | ✅ Pass |
| 4 | Vue `project-overview.md.tmpl` tồn tại | ✅ Pass |
| 5 | React `coding-conventions.md.tmpl` có Error Boundary | ✅ Pass |
| 6 | React `coding-conventions.md.tmpl` có API hook + cleanup | ✅ Pass |
| 7 | React `coding-conventions.md.tmpl` có form pattern | ✅ Pass |
| 8 | React `project-overview.md.tmpl` tồn tại | ✅ Pass |
| 9 | `npm test` 100% pass | ✅ 47/47 |

**9/9 Acceptance Criteria: PASS ✅**

## Code Review

- [x] `buildFileMap()` dùng `fs.existsSync` để chọn fw-specific vs _core — logic đúng
- [x] Không breaking change so với v0.3
- [x] Cleanup function trong React `useEffect` hook được document rõ — tránh memory leak

## Lessons Learned

- Pattern "fw-specific với _core fallback" rất hữu ích — có thể áp dụng cho tất cả file docs nếu cần
- React `useEffect` cleanup là điểm hay bị bỏ sót → nên nằm trong conventions

## Verdict

> ✅ **v0.4 DONE — Sẵn sàng archive**
