# Project Overview

## Dự án là gì?

`create-ai-docs` là một CLI tool viết bằng Node.js, cho phép developer scaffold ngay cấu trúc AI-first documentation (4-layer docs + Specs-Driven Development) vào bất kỳ dự án nào chỉ bằng một lệnh duy nhất:

```bash
npx create-ai-docs
# hoặc
npx create-ai-docs --mode=existing
```

## Vấn đề giải quyết

AI Agent (Gemini, Claude, Cursor, Copilot) không biết context của từng dự án cụ thể. Nếu không có tài liệu chuẩn, AI sẽ:
- Dùng API cũ / deprecated
- Đặt file sai thư mục
- Không tuân theo convention của team
- Lặp lại sai lầm cũ mỗi session

## Phạm vi (Scope)

✅ **Trong scope:**
- Detect framework từ `package.json`
- Scaffold cấu trúc `.agents/`, `docs/`, `specs/`
- Sinh ra nội dung template theo framework
- Stealth mode: ẩn khỏi git của công ty
- Cross-tool: tương thích Gemini, Claude, Cursor, Copilot

❌ **Ngoài scope:**
- Không cài đặt dependencies cho dự án target
- Không sửa source code của dự án target
- Không tự động commit hay push code

## Môi trường

- Node.js >= 18
- Chạy được trên Windows, macOS, Linux
- Publish lên npm registry dưới tên `create-ai-docs`
