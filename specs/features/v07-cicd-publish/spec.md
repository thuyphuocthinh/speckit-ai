# Spec: v0.7 — CI/CD Automated Publish

## Overview

Thiết lập quy trình CI/CD tự động bằng GitHub Actions. Khi developer push một release tag (vd: `v0.1.1`) lên GitHub, pipeline sẽ tự động chạy test, build (nếu có), và publish package lên npm registry. 

## Feature Type
- [x] DevOps / Infrastructure / CI-CD

## User Story

> As the maintainer of `speckit-ai`, I want to automatically publish to npm whenever I push a version tag to GitHub, so that I don't have to manually run `npm publish` from my local machine and the release process is standardized.

## Acceptance Criteria

### Workflow Trigger
- [ ] Workflow chỉ chạy khi có tag mới được push lên GitHub với định dạng `v*` (vd: `v1.0.0`, `v0.2.1`).

### Workflow Steps
- [ ] **Checkout code**: Clone repository.
- [ ] **Setup Node.js**: Sử dụng Node.js phiên bản 18.x (chuẩn của project).
- [ ] **Install Dependencies**: Chạy `npm ci` (hoặc `npm install`) để cài đặt các package cần thiết.
- [ ] **Run Tests**: Chạy `npm test` đảm bảo 100% tests pass trước khi publish.
- [ ] **Publish to npm**: Chạy lệnh npm publish tự động.

### Authentication & Security
- [ ] Workflow sử dụng `NPM_TOKEN` lưu trong GitHub Repository Secrets để authenticate với npm.
- [ ] Ghi chú rõ hướng dẫn (trong tài liệu) cách user tạo `NPM_TOKEN` trên npm và add vào GitHub.

## Out of Scope
- Tự động tạo Release notes/Changelog trên GitHub (tạm thời manual).
- Semantic Release (tự động tính toán bump version v1.0.1 hay v1.1.0 dựa trên commit message). Ở v0.7, việc update `package.json` version và tạo tag vẫn do người dùng làm.

## Open Questions
- npm hỗ trợ tính năng "Provenance" (OIDC) cho phép publish từ GitHub Actions mà không cần `NPM_TOKEN` dài hạn. Chúng ta có nên dùng Provenance không? (Đề xuất: Có, sẽ hiện huy hiệu "Published from GitHub Actions" rất uy tín trên trang npm).
