# Implementation Plan: v0.7 — CI/CD Automated Publish

> Based on: `spec.md`

## Approach

Sử dụng **GitHub Actions** kết hợp với tính năng **npm Provenance**. 
Provenance là chuẩn mới của npm cho phép GitHub Actions tự động authenticate với npm registry thông qua token ngắn hạn (OIDC) mà không cần bạn phải copy-paste `NPM_TOKEN` dài hạn vào repository secrets. Điều này bảo mật hơn và tạo ra một "tích xanh" (huy hiệu chứng thực) trên trang npm.

## Files sẽ TẠO MỚI

| File | Mục đích |
|---|---|
| `.github/workflows/publish.yml` | Chứa toàn bộ kịch bản CI/CD (YAML config). |

### Nội dung cấu trúc của `publish.yml`
- **Triggers**:
  - `push` với `tags`: `['v*']`
- **Permissions**:
  - `id-token: write` (Bắt buộc cho npm provenance)
  - `contents: read`
- **Jobs**: 
  - `build-and-publish`:
    - Check out code
    - Setup Node.js (version 18, set registry url)
    - Run `npm ci`
    - Run `npm test`
    - Run `npm publish --provenance`

## Hướng dẫn Vận hành (Operational Guide)
Vì pipeline này tự động, người dùng cần biết quy trình release mới:
1. Sửa `version` trong `package.json` (vd: `0.1.1`).
2. Chạy `git add package.json && git commit -m "chore: bump version to 0.1.1"`.
3. Tạo tag mới: `git tag v0.1.1`.
4. Đẩy tag lên GitHub: `git push origin v0.1.1`.
(Sẽ ghi chú hướng dẫn này vào một phần trong README hoặc file hướng dẫn riêng để người dùng thao tác).

## Risks

| Risk | Mitigation |
|---|---|
| User không biết cách trigger | Thêm command rõ ràng vào docs/README. |
| Test failed nhưng vẫn publish | Config job chỉ chạy publish nếu step `npm test` thành công (mặc định của GitHub Actions nếu step trước fail thì step sau không chạy). |
| Lỗi Authentication 403 từ npm | Đảm bảo `id-token: write` được cấp trong permission của job. |
