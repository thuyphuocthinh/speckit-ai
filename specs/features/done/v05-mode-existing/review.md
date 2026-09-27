# Review: v0.5 — `--mode=existing`

> Reviewed: 2026-09-27

## Acceptance Criteria Status

| # | Criterion | Status |
|---|---|---|
| 1 | `node bin/index.js --mode=existing` runs without error | ✅ Pass |
| 2 | No flag = `mode=new`, same behavior as before | ✅ Pass |
| 3 | Unknown flags: error + exit code 1 | ✅ Pass (`--mode=invalid` → exit 1) |
| 4 | `_existing/technology.md.tmpl` exists with AI-PROMPT markers | ✅ Pass |
| 5 | `_existing/project-overview.md.tmpl` exists | ✅ Pass |
| 6 | `_existing/structure.md.tmpl` exists | ✅ Pass |
| 7 | `_existing/coding-conventions.md.tmpl` exists | ✅ Pass |
| 8 | `_existing/coding-style.md.tmpl` exists | ✅ Pass |
| 9 | mode=existing: docs use `_existing/` templates | ✅ Pass (unit + integration test) |
| 10 | mode=existing: `_core` files unchanged | ✅ Pass (test + manual) |
| 11 | mode=existing: skills unchanged | ✅ Pass |
| 12 | Output log shows mode clearly | ✅ Pass |
| 13 | All 47 previous tests still pass | ✅ Pass (54/54 total) |

**13/13 Acceptance Criteria: PASS ✅**

## Test Review

- Tests: 47 → 54 (+7 cases for v0.5)
- `buildFileMap(fw, 'existing')` → correct `_existing/` tmpl ✅
- `buildFileMap(fw, 'new')` → fw-specific not changed ✅
- Integration: `coding-conventions.md` contains `AI-PROMPT` in existing mode ✅

## Code Review

- [x] `mode` default = `'new'` — fully backward compatible
- [x] `parseArgs()` isolated, easy to extend if more flags added later
- [x] `docsTmpl()` helper keeps `buildFileMap` readable (no duplication)
- [x] `--help` flag documented

## Verdict

> ✅ **v0.5 DONE — Ready to archive**
