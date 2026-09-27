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

**Bước 2: Nâng phiên bản (Bump version)**
- Mở file `package.json` và thay đổi trường `"version"` sang phiên bản mới. 
  *(Lưu ý tuân thủ Semantic Versioning: Major.Minor.Patch).*
- Commit sự thay đổi này:
  ```bash
  git add package.json
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
Ngay khi Github nhận được lệnh `git push origin v...`, nó sẽ chạy các bước sau trên Server CI/CD:
1. **Checkout source code**: Tải mã nguồn tại đúng thời điểm đánh tag.
2. **Setup Node.js**: Cài đặt môi trường Node 18.x.
3. **Install Dependencies**: Chạy `npm ci` để cài đặt thư viện một cách chính xác nhất dựa trên `package-lock.json`.
4. **Run Tests**: Chạy `npm test`. **Đây là chốt chặn an toàn.** Nếu có bất kỳ test case nào fail, Github Actions sẽ báo đỏ và **dừng toàn bộ quá trình release**.
5. **Publish**: Nếu test pass 100%, Github sẽ sử dụng `NODE_AUTH_TOKEN` (đã lưu trong mục Secrets của kho lưu trữ) để gọi lệnh `npm publish --provenance` và đẩy gói công cụ lên máy chủ NPM toàn cầu.
