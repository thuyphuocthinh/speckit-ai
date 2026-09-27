# Implementation Plan: v0.6 — Publish npm

> Based on: `spec.md`
> ⚠️ Cần resolve Open Questions trước khi implement: GitHub repo URL và tên package

---

## Approach

Chuẩn bị "publishing checklist" — tất cả file cần có trước khi `npm publish`. Dùng `package.json#files` thay vì `.npmignore` (đơn giản hơn, rõ hơn). Sau khi chuẩn bị xong, chạy `npm publish --dry-run` để verify trước khi publish thật.

---

## Files sẽ TẠO MỚI

### `README.md` (file quan trọng nhất)

Cấu trúc:
```
# create-ai-docs
[badges: npm, node, license]

One-line description

## Quick Start
npx create-ai-docs              (mode=new)
npx create-ai-docs --mode=existing

## What does it do?
- Mô tả 3 bullet points rõ ràng

## Usage
### New project
### Existing project

## Supported Frameworks
Table: framework + detection logic

## What gets generated?
Tree structure của output

## How it works
3 bước: Detect → Scaffold → Stealth

## License
MIT
```

### `LICENSE`
MIT License với tên và năm

---

## Files sẽ SỬA

### `package.json`

Thêm/cập nhật các field:
```json
{
  "description": "Scaffold AI-first workspace documentation for any project",
  "keywords": ["ai", "docs", "scaffold", "cli", "nestjs", "nextjs", "vue", "react", "create"],
  "repository": { "type": "git", "url": "https://github.com/<user>/create-ai-docs" },
  "homepage": "https://github.com/<user>/create-ai-docs#readme",
  "bugs": { "url": "https://github.com/<user>/create-ai-docs/issues" },
  "license": "MIT",
  "files": ["bin/", "src/", "templates/"]
}
```

> **Note:** Thay `<user>` bằng GitHub username thật sau khi resolve Open Question.

---

## Verify Steps

| Step | Command | Expected |
|---|---|---|
| Check package size | `npm pack --dry-run` | Chỉ có `bin/`, `src/`, `templates/` + root files |
| Check publish ready | `npm publish --dry-run` | No error |
| Check package name | `npm view create-ai-docs` | 404 (chưa có) hoặc là của mình |

---

## Risks

| Risk | Mitigation |
|---|---|
| Package name `create-ai-docs` đã bị đặt | Check trước: `npm view create-ai-docs`. Nếu bị đặt, dùng scoped: `@<username>/create-ai-docs` |
| `templates/` quá lớn → slow install | Check `npm pack` output size. Target < 500KB |
| README quá ngắn → người dùng không hiểu | Review README trước publish: phải có example output rõ ràng |
