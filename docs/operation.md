# Operation Rules — No-Bypass Policy

> Các quy tắc này là **tuyệt đối**. Không có ngoại lệ, không có "chỉ lần này thôi".

---

## 1. no-bypass-lint

**Không được làm:**
```js
// eslint-disable-next-line
// eslint-disable
```

**Thay vào đó:** Fix lỗi thật sự. Nếu rule sai → thảo luận và sửa config ESLint đúng cách.

---

## 2. no-bypass-type-check

**Không được làm:**
```ts
// @ts-ignore
// @ts-nocheck
const x = value as any;
```

**Thay vào đó:** Khai báo type đúng. Nếu type của thư viện bên thứ 3 sai → dùng declaration merging hoặc tạo `.d.ts`.

---

## 3. no-bypass-commit-hook

**Không được làm:**
```bash
git commit --no-verify
```

**Thay vào đó:** Fix lỗi mà pre-commit hook phát hiện. Hook tồn tại vì lý do chính đáng.

---

## 4. no-auto-deploy

**Không được làm:**
- Tự chạy lệnh deploy, publish lên npm, push lên production branch

**Thay vào đó:** Báo cáo cho người dùng và chờ xác nhận.

---

## 5. no-install-unknown-package

**Không được làm:**
- Tự ý chạy `npm install <package>` mà không hỏi

**Thay vào đó:** Đề xuất package, giải thích lý do, chờ người dùng xác nhận trước.
