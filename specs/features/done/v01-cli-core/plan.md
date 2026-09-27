# Implementation Plan: v0.1 — CLI Core

> Dựa trên: `specs/features/v01-cli-core/spec.md`

---

## Approach

Chia CLI thành **3 module độc lập** (`detector`, `scaffolder`, `stealth`), được điều phối bởi `bin/index.js`. Mỗi module có trách nhiệm rõ ràng, test riêng lẻ được, không phụ thuộc lẫn nhau.

Luồng thực thi:
```
bin/index.js
  → detector.js        (đọc package.json → trả về frameworkId)
  → scaffolder.js      (nhận frameworkId → copy templates → ghi file)
  → stealth.js         (cập nhật .git/info/exclude)
```

Template dùng placeholder `{{VARIABLE}}`, scaffolder replace trước khi ghi ra file. Không dùng template engine ngoài.

---

## Files sẽ TẠO MỚI

### Source code

| File | Mục đích |
|---|---|
| `bin/index.js` | Entry point: đọc `process.cwd()`, gọi 3 module theo thứ tự, log kết quả |
| `src/detector.js` | Đọc `package.json`, map dependencies → frameworkId |
| `src/scaffolder.js` | Tạo thư mục, render template, ghi file (skip nếu đã tồn tại) |
| `src/stealth.js` | Tìm `.git/info/exclude`, append các entry cần ẩn |
| `package.json` | Khai báo `bin`, `engines`, `main`, scripts |

### Templates — `_core/` (dùng chung mọi framework)

| File | Nội dung |
|---|---|
| `templates/_core/AGENTS.md.tmpl` | Template AGENTS.md với `{{FRAMEWORK}}`, `{{PACKAGE_MANAGER}}` |
| `templates/_core/CLAUDE.md.tmpl` | Chỉ chứa `@.agents/AGENTS.md` |
| `templates/_core/cursorrules.tmpl` | Wrapper trỏ về AGENTS.md |
| `templates/_core/docs-README.md.tmpl` | Required reading order |
| `templates/_core/ai-agent-guidelines.md.tmpl` | Do/Don't nhanh |
| `templates/_core/operation.md.tmpl` | No-bypass rules |
| `templates/_core/specs-template.md.tmpl` | Template viết spec |
| `templates/_core/specs-workflow.md.tmpl` | Hướng dẫn SDD cycle |

### Templates — framework-specific

Mỗi framework có **3 file**:

| File | Nội dung |
|---|---|
| `templates/<fw>/technology.md.tmpl` | Stack, thư viện đặc trưng |
| `templates/<fw>/structure.md.tmpl` | Cấu trúc thư mục đặc trưng |
| `templates/<fw>/coding-conventions.md.tmpl` | Pattern, naming convention |

Frameworks cần tạo: `nestjs/`, `nextjs/`, `vue/`, `react/`, `generic/`

### Tests

| File | Test gì |
|---|---|
| `tests/detector.test.js` | Các case detect: nestjs, nextjs, vue, react, no-pkg-json |
| `tests/scaffolder.test.js` | File được tạo, skip nếu tồn tại, placeholder được replace |
| `tests/stealth.test.js` | Ghi vào exclude, bỏ qua nếu không phải git repo |

---

## Files sẽ KHÔNG tạo / KHÔNG sửa

- Không tạo `README.md` ở root (để v0.6 khi publish npm)
- Không sửa bất kỳ file nào của dự án target của user
- Không tạo `.gitignore` (chỉ dùng `.git/info/exclude`)

---

## Chi tiết implementation từng module

### `src/detector.js`

Logic detect theo **thứ tự ưu tiên** (từ cụ thể → tổng quát):

```
1. Đọc package.json (dependencies + devDependencies)
2. Nếu có @nestjs/core        → 'nestjs'
3. Nếu có next                → 'nextjs'   (ưu tiên hơn react)
4. Nếu có vue                 → 'vue'
5. Nếu có react               → 'react'
6. Nếu có express/fastify     → 'node-express'
7. package.json tồn tại nhưng không khớp → 'generic'
8. package.json không tồn tại → 'generic'
```

Return value: `{ framework: string, packageManager: string }`

Detect `packageManager`:
- Có `yarn.lock` → `yarn`
- Có `pnpm-lock.yaml` → `pnpm`
- Mặc định → `npm`

---

### `src/scaffolder.js`

**Input:** `{ targetDir, framework, packageManager }`

**Output:** List các file đã tạo / skip

**Quy trình:**
1. Xác định danh sách file cần tạo từ `templates/_core/` + `templates/<framework>/`
2. Với mỗi file:
   - Nếu file đích đã tồn tại → log `[skip] <path>`, bỏ qua
   - Nếu chưa tồn tại → đọc template, replace placeholder, ghi ra file
3. Tạo thư mục rỗng cần thiết: `specs/features/`, `specs/features/done/`, `.agents/skills/`

**Placeholder map:**
```javascript
{
  '{{FRAMEWORK}}': framework,        // 'NestJS', 'Next.js', ...
  '{{PACKAGE_MANAGER}}': pm,         // 'npm', 'yarn', 'pnpm'
  '{{YEAR}}': new Date().getFullYear()
}
```

**Path handling:** Dùng `path.join()` cho tất cả, không dùng string concat thủ công.

---

### `src/stealth.js`

**Input:** `targetDir`

**Quy trình:**
1. Tìm `.git/` folder tại `targetDir` (không đệ quy lên parent)
2. Nếu không có `.git/` → log warning, return (không crash)
3. Đảm bảo `.git/info/` tồn tại (tạo nếu chưa có)
4. Đọc nội dung `.git/info/exclude` hiện tại (hoặc rỗng nếu chưa có)
5. Với mỗi entry cần thêm, chỉ append nếu chưa có trong file:
   ```
   .agents/
   CLAUDE.md
   .cursorrules
   docs/
   specs/
   ```
6. Ghi lại file

---

### `bin/index.js`

```
1. targetDir = process.cwd()
2. Log: "[create-ai-docs] Đang phân tích dự án tại: <targetDir>"
3. { framework, packageManager } = detector.detect(targetDir)
4. Log: "[create-ai-docs] Detected: <framework> / <packageManager>"
5. results = scaffolder.scaffold({ targetDir, framework, packageManager })
6. Log từng result (created / skip)
7. stealth.apply(targetDir)
8. Log: "[create-ai-docs] ✅ Hoàn tất! Đọc .agents/AGENTS.md để bắt đầu."
```

---

## Dependencies

| Package | Lý do | Bắt buộc? |
|---|---|---|
| Không có runtime dependency | Dùng Node.js built-in hoàn toàn | — |
| `jest` (devDep) | Unit testing | Có |

---

## Risks & Mitigations

| Risk | Khả năng | Mitigation |
|---|---|---|
| Path separator khác nhau Win vs Unix | Cao | Dùng `path.join()` xuyên suốt, test trên cả 2 OS |
| `.git/info/exclude` không tồn tại trên repo mới | Trung bình | Tạo thư mục `info/` nếu chưa có, tạo file nếu chưa có |
| User chạy CLI 2 lần → file bị ghi đè | Cao | Check tồn tại trước khi ghi, skip nếu có |
| `package.json` có cả `react` và `next` | Thấp | Đã quyết định trong spec: ưu tiên `next` |
| Dự án không phải git repo | Trung bình | Check `.git/` folder, warn và skip stealth thay vì crash |
