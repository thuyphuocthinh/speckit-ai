# Spec: v0.6 — Publish npm

## Overview

Chuẩn bị và publish package `create-ai-docs` lên npm registry. Bao gồm: viết README.md đầy đủ cho npm page, cập nhật `package.json` với đủ metadata npm cần, tạo `.npmignore`, và publish lần đầu.

## Feature Type
- [x] Feature có API / business logic — + test review

## Acceptance Criteria

### README.md
- [ ] `README.md` tồn tại ở root với nội dung đầy đủ cho npm page
- [ ] Có section: What is this?, Installation, Usage (`--mode=new` và `--mode=existing`), Supported Frameworks, How it works, License
- [ ] Có code example rõ ràng ngay đầu README (dễ scan)
- [ ] Có badge: npm version, node version, license

### package.json
- [ ] `description` có nội dung mô tả rõ
- [ ] `keywords` có ít nhất 8 keywords liên quan (ai, docs, scaffold, nestjs, nextjs, vue, react, cli)
- [ ] `repository` trỏ đúng
- [ ] `homepage` trỏ đúng (GitHub repo)
- [ ] `bugs` trỏ đúng (GitHub issues)
- [ ] `license` là `MIT`
- [ ] `files` array chỉ include những gì cần thiết: `["bin/", "src/", "templates/"]`

### .npmignore / files
- [ ] `.npmignore` tồn tại HOẶC `package.json#files` được dùng (chọn 1)
- [ ] Các file bị loại khỏi package: `specs/`, `tests/`, `.agents/`, `docs/`, `*.test.js`
- [ ] Dry-run `npm pack` không có file không cần thiết

### License
- [ ] `LICENSE` file tồn tại với MIT license

### Publish
- [ ] `npm publish --dry-run` thành công, không có error
- [ ] Tên package `create-ai-docs` chưa bị đặt trên npm (hoặc đã là của mình)

## Out of Scope

- Không tạo CI/CD pipeline (GitHub Actions)
- Không tạo CHANGELOG.md (có thể làm sau)
- Không tạo website/docs site

## Open Questions

- [ ] GitHub repo URL là gì? (cần để điền `repository`, `homepage`, `bugs`)
- [ ] Tên npm package là `create-ai-docs`? Hay có prefix khác?
