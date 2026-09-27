# Tasks: v0.6 — Publish npm

> Based on: `plan.md`
> ⚠️ Resolve Open Questions trong spec.md trước Phase 1

---

## Phase 0 — Resolve Open Questions (TRƯỚC KHI CODE)

- [ ] Xác nhận GitHub repo URL → điền vào `package.json` và `README.md`
- [ ] Xác nhận tên package: `create-ai-docs` hoặc scoped `@<username>/create-ai-docs`
- [ ] Chạy `npm view create-ai-docs` → kiểm tra tên đã bị đặt chưa

---

## Phase 1 — README.md

- [ ] Tạo `README.md` tại root với cấu trúc theo plan.md
  - [ ] Badges: npm version, node >=18, MIT license
  - [ ] Quick start code block (< 5 dòng)
  - [ ] Section "What does it do?" — 3 bullet points
  - [ ] Section "Usage" — `--mode=new` và `--mode=existing` với example output
  - [ ] Section "Supported Frameworks" — table với framework + detection signal
  - [ ] Section "What gets generated?" — directory tree của output
  - [ ] Section "How it works" — 3 bước ngắn gọn
  - [ ] Section "License" — MIT

---

## Phase 2 — LICENSE file

- [ ] Tạo `LICENSE` tại root với MIT License
  - Năm: 2026
  - Tên: điền sau khi biết GitHub username

---

## Phase 3 — Cập nhật package.json

- [ ] Thêm `description`
- [ ] Thêm `keywords` (≥ 8 keywords)
- [ ] Thêm `repository` (type: git, url)
- [ ] Thêm `homepage`
- [ ] Thêm `bugs`
- [ ] Thêm `license: "MIT"`
- [ ] Thêm `files: ["bin/", "src/", "templates/", "README.md", "LICENSE"]`
- [ ] Đảm bảo `author` có tên và/hoặc email

---

## Phase 4 — Verify pack

- [ ] Chạy `npm pack --dry-run` → kiểm tra danh sách files trong package
  - Phải có: `bin/index.js`, `src/*.js`, `templates/**`
  - Không được có: `specs/`, `tests/`, `.agents/`, `docs/`
- [ ] Kiểm tra total size < 500KB (templates không quá nặng)

---

## Phase 5 — Publish

- [ ] `npm login` (nếu chưa login)
- [ ] `npm publish --dry-run` → không có error
- [ ] `npm publish` → publish thật lên npm registry
- [ ] Verify: `npx create-ai-docs --help` trong một thư mục tạm → chạy được

---

## Phase 6 — Review & Archive

- [ ] Tất cả AC trong spec.md đã check
- [ ] Tạo `review.md`
- [ ] Archive sang `specs/features/done/`
