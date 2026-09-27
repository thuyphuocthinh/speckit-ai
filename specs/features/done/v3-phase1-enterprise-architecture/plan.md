# Plan: v3 Phase 1 - Enterprise Architecture

## 1. Phân tích kỹ thuật (Technical Approach)
Hiện tại, `scaffolder.js` chỉ copy đè nội dung từ 1 thư mục nguồn: `templates/{framework}/`. 
Để thêm ADR và Contracts (vốn là framework-agnostic - dùng chung cho mọi ngôn ngữ), nếu chúng ta copy vào từng thư mục framework thì sẽ vi phạm nguyên tắc DRY (Don't Repeat Yourself), gây khó bảo trì sau này.

**Giải pháp đề xuất:**
- Tạo thư mục `templates/shared/`.
- Thay đổi `scaffolder.js`: 
  1. Nếu có custom templates (`.speckitrc`), copy từ custom templates.
  2. Ngược lại, COPY TỪ `templates/shared/` TRƯỚC (để rải các file dùng chung như ADR, Contracts).
  3. SAU ĐÓ, COPY ĐÈ TỪ `templates/{framework}/` (để đè các file đặc thù của ngôn ngữ như `technology.md`).
- Sửa đệ quy `copyDir` để không ghi đè mất folder mà merge files. (May quá `copyDir` hiện tại của chúng ta đã có logic tạo folder nếu chưa tồn tại, và copy file, nên nó mặc định là MERGE directory tree).

## 2. Kiến trúc Template mới
```
templates/
├── shared/
│   ├── docs/
│   │   └── adrs/
│   │       └── 0000-template.md
│   └── specs/
│       └── contracts/
│           └── _template.md
├── generic/
├── nextjs/
└── nestjs/
```

## 3. Quá trình kiểm thử (Testing Strategy)
- Run Unit Test: `npm test`
- Đảm bảo mock test của `scaffolder.test.js` kiểm tra được trường hợp nó gọi hàm copy 2 lần (lần 1 từ `shared`, lần 2 từ `framework`).
- Manual E2E test bằng cách chạy `node bin/index.js` ra thư mục tạm.
