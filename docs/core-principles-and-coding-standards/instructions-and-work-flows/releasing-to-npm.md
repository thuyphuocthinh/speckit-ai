# CI/CD: Quy trình Release lên NPM (Github Actions)

Tài liệu này mô tả quy trình xuất bản (publish) một phiên bản mới của `speckit-ai` lên NPM Registry một cách tự động và an toàn thông qua Github Actions.

## 1. Cơ chế hoạt động (The Trigger)
Hệ thống CI/CD được cấu hình trong file `.github/workflows/publish.yml`.
Việc **merge code vào nhánh `main` SẼ KHÔNG KÍCH HOẠT QUÁ TRÌNH PUBLISH**. Điều này giúp bảo vệ NPM khỏi các bản release lỗi hoặc các đoạn code nháp chưa sẵn sàng.

Để kích hoạt hệ thống tự động publish, bắt buộc phải tạo một **Git Tag** bắt đầu bằng ký tự `v` (Ví dụ: `v0.3.0`, `v1.0.0`) và push tag đó lên Github.

## 2. Quy trình thực hiện chuẩn (Step-by-step Workflow)

Khi hoàn thành tính năng và sẵn sàng phát hành phiên bản mới, hãy làm theo các bước sau:

**Bước 1: Gộp code vào nhánh chính**
- Hoàn tất mọi Pull Request và đảm bảo code đã được merge vào nhánh `main`.
- Pull code mới nhất về máy local:
  ```bash
  git checkout main
  git pull origin main --rebase
  ```

**Bước 2: Ghi changelog và nâng phiên bản (Bump version)**
- Thêm mục cho phiên bản mới vào `CHANGELOG.md` (những gì người dùng npm sẽ thấy khác đi, nêu rõ thay đổi hành vi).
- Mở file `package.json` và `package-lock.json`, đổi trường `"version"` sang phiên bản mới. 
  *(Lưu ý tuân thủ Semantic Versioning: Major.Minor.Patch).*
- Chạy `npm test` và `npm pack --dry-run` để chắc gói đủ file.
- Commit sự thay đổi này:
  ```bash
  git add CHANGELOG.md package.json package-lock.json
  git commit -m "chore: bump version to v<version_mới>"
  git push origin main
  ```

**Bước 3: Đánh dấu và Kích hoạt CI/CD (Tagging)**
- Tạo tag trùng với phiên bản vừa bump:
  ```bash
  git tag v<version_mới>
  ```
- Push tag lên Github:
  ```bash
  git push origin v<version_mới>
  ```

## 3. Chuyện gì xảy ra đằng sau Github Actions?
Có hai workflow:
- `.github/workflows/ci.yml` chạy khi push lên `main` và khi có Pull Request: `npm test` và `lint` trên Node 18, 20, 22, cộng một bước đóng gói `npm pack` rồi cài tarball vào thư mục tạm và chạy thử CLI (scaffold, `start`, `lint`). Nhờ đó test hỏng được phát hiện trước khi đánh tag.
- `.github/workflows/publish.yml` chạy khi push tag `v*`.

Ngay khi Github nhận được lệnh `git push origin v...`, `publish.yml` sẽ chạy các bước sau trên Server CI/CD:
1. **Checkout source code**: Tải mã nguồn tại đúng thời điểm đánh tag.
2. **Setup Node.js**: Cài đặt môi trường Node 18.x.
3. **Check tag**: So tag với `version` trong `package.json`. Lệch thì dừng ngay, chưa publish gì.
4. **Install Dependencies**: Chạy `npm ci` để cài đặt thư viện một cách chính xác nhất dựa trên `package-lock.json`.
5. **Run Tests**: Chạy `npm test`. **Đây là chốt chặn an toàn.** Nếu có bất kỳ test case nào fail, Github Actions sẽ báo đỏ và **dừng toàn bộ quá trình release**.
6. **Publish**: Nếu test pass 100%, Github sẽ sử dụng `NODE_AUTH_TOKEN` (đã lưu trong mục Secrets của kho lưu trữ) để gọi lệnh `npm publish --provenance` và đẩy gói công cụ lên máy chủ NPM toàn cầu.
