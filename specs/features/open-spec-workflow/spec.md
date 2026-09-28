# Feature: OpenSpec Workflow

## 1. Overview
Tính năng này giới thiệu mô hình OpenSpec Workflow để quản lý các thay đổi Specs song song. Tránh việc thêm trực tiếp Specs vào thư mục baseline (`specs/features`) gây sai lệch hiểu biết của hệ thống khi code chưa được merge.

## 2. Requirements & Constraints
- **Lệnh 1:** `npx speckit-ai propose "Tên tính năng"`
  - Tạo thư mục con: `changes/ten-tinh-nang/`.
  - Khởi tạo 3 file bên trong: `proposal.md` (giải thích tại sao làm), `delta-specs.md` (nội dung spec mới/thay đổi), và `tasks.md` (danh sách công việc cần làm để pass QA).
- **Lệnh 2:** `npx speckit-ai archive "Tên tính năng"`
  - Copy nội dung `delta-specs.md` vào một file mới trong thư mục baseline (`specs/features/ten-tinh-nang/spec.md`).
  - Move thư mục `changes/ten-tinh-nang/` vào `archive/ten-tinh-nang/`.
  - In ra thông báo thành công và xóa thư mục bên trong `changes`.

## 3. Architecture & Implementation
- Cập nhật `src/generator.js`:
  - Thêm phương thức `generateChangeProposal(title)` để xử lý lệnh `propose`.
  - Thêm phương thức `archiveChange(title)` để xử lý lệnh `archive`.
- Cập nhật `bin/index.js` để thêm 2 commands: `propose` và `archive`.
- Cập nhật `src/linter.js` (hoặc test) để linter hiểu được thư mục `changes/` (bỏ qua hoặc kiểm tra cấu trúc riêng).

## 4. UI/UX
**Lệnh Propose:**
```bash
$ npx speckit-ai propose "Add 2FA"
[speckit-ai] 💡 Change proposal created at: changes/add-2fa/
[speckit-ai] 👉 Open changes/add-2fa/proposal.md to explain the "why".
```

**Lệnh Archive:**
```bash
$ npx speckit-ai archive "Add 2FA"
[speckit-ai] 📦 Archiving change "add-2fa"...
[speckit-ai] ✅ Baseline specs updated at specs/features/add-2fa/spec.md
[speckit-ai] ✅ Change moved to archive/add-2fa/
```

## 5. Security & Edge Cases
- **Lỗi trùng lặp:** Nếu chạy `propose` mà thư mục `changes/` đã tồn tại, hiển thị lỗi `❌ Change "add-2fa" already exists.`.
- **Lỗi Archive không tồn tại:** Nếu chạy `archive` mà thư mục `changes/` không tồn tại, hiển thị lỗi `❌ Change "add-2fa" not found in changes/`.

## 6. Acceptance Criteria

### AC-1: Tạo change proposal hợp lệ
Given: Lệnh propose được gọi với title mới
When: CLI thực thi xong
Then: Thư mục changes/ và 3 file được tạo thành công

### AC-2: Lỗi trùng lặp change proposal
Given: Lệnh propose được gọi với title đã tồn tại
When: CLI thực thi xong
Then: Hiển thị lỗi đã tồn tại và không tạo mới

### AC-3: Archive change hợp lệ
Given: Thư mục changes/ đang tồn tại
When: Gọi lệnh archive
Then: Thư mục changes/ được di chuyển vào archive/ và nội dung delta được copy sang specs/
