# Tasks: v0.7 — CI/CD Automated Publish

> Based on: `plan.md`

## Phase 1 — Create GitHub Workflow

- [ ] Tạo thư mục `.github/workflows/` (nếu chưa có).
- [ ] Tạo file `.github/workflows/publish.yml`.
  - Khai báo sự kiện trigger: `on: push: tags: - 'v*'`
  - Khai báo permissions: `id-token: write`, `contents: read`
  - Thêm bước checkout code: `actions/checkout@v4`
  - Thêm bước setup node: `actions/setup-node@v4` với config registry URL `https://registry.npmjs.org/`
  - Thêm bước install dependencies: `npm ci`
  - Thêm bước chạy test: `npm test`
  - Thêm bước publish: `npm publish --provenance` với biến môi trường `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`.

## Phase 2 — Hướng dẫn Release trong README

- [ ] Sửa file `README.md`, thêm một section "Contributing & Releasing".
- [ ] Hướng dẫn 4 bước cơ bản để trigger release (đổi version, commit, đánh tag, push tag).

## Phase 3 — Cài đặt (Manual trên GitHub và npm)

*Phần này user cần thao tác trên trình duyệt, không làm bằng code được*
- [ ] Lên npmjs.com, tạo một **Automation Access Token** (chọn loại Automation để publish từ CI/CD).
- [ ] Lên GitHub repo `thuyphuocthinh/speckit-ai`, vào Settings > Secrets and variables > Actions > New repository secret.
- [ ] Tên secret là `NPM_TOKEN`, paste token của npm vào.

## Phase 4 — Test Pipeline (Tùy chọn)

- [ ] Sửa `package.json` lên version `0.1.1` (hoặc test version).
- [ ] Commit, đánh tag `v0.1.1` và push lên.
- [ ] Lên tab Actions của GitHub kiểm tra xem pipeline có chạy xanh và publish lên npm thành công không.
- [ ] Tạo `review.md` và archive specs v0.7.
