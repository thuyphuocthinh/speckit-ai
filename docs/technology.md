# Technology Stack

## Core

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| Runtime | Node.js >= 18 | Native ESM, `fs.promises`, không cần dependency nặng |
| Language | JavaScript (CommonJS) | Đơn giản, không cần build step |
| CLI Framework | `commander` hoặc thuần `process.argv` | Nhẹ, ít dependency |
| File I/O | Node.js `fs/promises` built-in | Không cần thêm package |
| Template engine | String interpolation thuần | Tránh dependency phức tạp |

## Dev Dependencies

| Package | Mục đích |
|---|---|
| `jest` | Unit testing |
| `eslint` | Lint |

## Thư viện KHÔNG dùng

- ❌ TypeScript (thêm build step không cần thiết cho CLI nhỏ)
- ❌ Inquirer.js (chỉ dùng khi thực sự cần interactive prompt)
- ❌ Chalk (color terminal — có thể thêm sau nếu cần)
- ❌ Các framework nặng

## Phân phối

- Publish lên **npm registry** dưới tên `create-ai-docs`
- Entry point: `bin/index.js` (khai báo trong `package.json` field `bin`)
- Chạy được bằng `npx create-ai-docs` không cần cài toàn cục
