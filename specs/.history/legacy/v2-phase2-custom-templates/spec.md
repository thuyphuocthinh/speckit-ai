# Spec: v2 Phase 2 — Custom Templates Configuration

## Overview
Cho phép người dùng sử dụng thư mục chứa các template của riêng họ thông qua việc cấu hình một file `.speckitrc` (hoặc `speckit.config.json`). Điều này giải quyết bài toán các công ty muốn sinh ra cấu trúc AI Docs theo chuẩn riêng của công ty thay vì dùng thư viện chuẩn mặc định.

## Feature Type
- [x] Feature có API / business logic — + test review

## User Story
> As a technical lead, I want to define my own AI documentation templates in a shared repository or local folder, and configure `speckit-ai` via `.speckitrc` to use my templates instead of the default ones, so that my team adheres strictly to our company's internal standards.

## Acceptance Criteria

### 1. Configuration Resolution
- [ ] Tool có khả năng tìm kiếm file cấu hình theo thứ tự ưu tiên: 
      1. `.speckitrc` ở project root (nơi đang chạy CLI).
      2. `speckit.config.json` ở project root.
- [ ] Hỗ trợ config theo định dạng JSON.

### 2. Custom Templates Mapping
- [ ] File config có schema cho phép khai báo trường `templatesDir` trỏ tới một thư mục trên máy tính (có thể là đường dẫn tuyệt đối hoặc tương đối).
- [ ] Nếu `templatesDir` được khai báo, hàm `readTemplate` trong `scaffolder.js` sẽ ưu tiên đọc file từ thư mục custom này.
- [ ] Nếu file không tồn tại trong thư mục custom, **fallback** về thư mục templates gốc của gói npm.

### 3. Log Output
- [ ] CLI (trong `bin/index.js`) cần in ra thông báo nếu nó tìm thấy file config và đang sử dụng custom templates.

### 4. Tests
- [ ] Viết unit tests kiểm tra khả năng fallback đọc file (custom -> default).

## Out of Scope
- Config qua biến môi trường (environment variables) hoặc package.json (chỉ tập trung vào file `.speckitrc` cho rõ ràng).

## Config Schema Example
```json
{
  "templatesDir": "./my-custom-templates"
}
```
