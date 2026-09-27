# Feature: Docs Website (Static Site Generator)

## 1. Overview
Tính năng này biến toàn bộ thư mục `docs/` và `specs/` khô khan thành một trang web giao diện người dùng (Web Portal) cực kỳ chuyên nghiệp. Nó cung cấp lệnh `npx speckit-ai serve` để tự động khởi tạo Local Server và mở trình duyệt.
Đây là giải pháp "Zero-config" (Không cần cấu hình), hướng tới người dùng Non-tech (PO, BA, Tester) để họ có thể đọc tài liệu dễ dàng, có Sidebar điều hướng, có chức năng tìm kiếm (Search).

## 2. Requirements & Constraints
- **Lệnh thực thi:** `npx speckit-ai serve`
- **Engine:** Sử dụng [Docsify](https://docsify.js.org/) vì đây là thư viện render Markdown phía Client siêu nhẹ, không cần Build (Zero-build), chỉ cần cung cấp `index.html`.
- **Backend:** Sử dụng `express` để dựng server tĩnh và thư viện `open` để tự động mở trình duyệt.
- **Auto Sidebar:** Tool phải tự động quét cây thư mục (Directory Tree) của `docs/` và `specs/` để sinh ra file `_sidebar.md` (Docsify cần file này để làm Menu bên trái).

## 3. Architecture & Implementation
- Cài đặt thêm thư viện: `express` và `open`.
- File mới: `src/server.js` chứa logic khởi chạy Web Server.
- File cập nhật: `bin/index.js` (Thêm lệnh `serve`).

### Thuật toán Auto Sidebar
1. Đọc đệ quy thư mục `docs/` và `specs/`.
2. Bỏ qua các file như `_template.md` hoặc thư mục `.agents`.
3. Biến đổi đường dẫn thành Markdown List:
   ```markdown
   * Docs
     * [Overview](/docs/project-overview.md)
     * [Tech Stack](/docs/technology.md)
   * Specs
     * Features
       * [User Login](/specs/features/user-login/spec.md)
   ```
4. Ghi tạm ra file `_sidebar.md` hoặc serve trực tiếp qua API.

### Nội dung file `index.html` (Docsify Template)
Sẽ được inject động trong bộ nhớ (serve qua Route `/`):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css">
</head>
<body>
  <div id="app"></div>
  <script>
    window.$docsify = {
      name: 'Project Specs',
      repo: '',
      loadSidebar: true,
      subMaxLevel: 2,
      search: 'auto'
    }
  </script>
  <script src="//cdn.jsdelivr.net/npm/docsify@4"></script>
  <script src="//cdn.jsdelivr.net/npm/docsify/lib/plugins/search.min.js"></script>
</body>
</html>
```

## 4. UI/UX
```bash
$ npx speckit-ai serve
[speckit-ai] 🚀 Generating navigation tree...
[speckit-ai] 🌐 Starting documentation server...
[speckit-ai] ✅ Server running at http://localhost:3000
[speckit-ai] 🌍 Opening browser...
```

## 5. Security & Edge Cases
- **Xung đột Port:** Nếu port 3000 bị chiếm, tự động thử port 3001, 3002...
- **Bảo mật:** Chỉ bind vào `localhost` để tránh bị lộ tài liệu ra mạng LAN.

## 6. Testing Strategy
- Mock `express` và `open` để kiểm tra luồng gọi hàm.
- Test hàm sinh `_sidebar.md` xem có đệ quy đúng cây thư mục và sinh ra chuẩn syntax Markdown List không.
