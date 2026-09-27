# Tasks: v0.1 — CLI Core

> Dựa trên: `plan.md`
> Thực hiện theo thứ tự từ trên xuống. Check off từng item khi hoàn thành.

---

## Phase 1 — Project Setup

- [ ] Tạo `package.json` với các field: `name`, `version`, `description`, `bin`, `engines`, `scripts`, `license`
- [ ] Khai báo `"bin": { "create-ai-docs": "./bin/index.js" }` trong `package.json`
- [ ] Khai báo `"engines": { "node": ">=18" }` trong `package.json`
- [ ] Thêm script `"test": "node --experimental-vm-modules node_modules/.bin/jest"` vào `package.json`
- [ ] Cài `jest` làm devDependency: `npm install --save-dev jest`
- [ ] Tạo file `jest.config.js` hoặc khai báo `jest` config trong `package.json`
- [ ] Tạo thư mục `bin/`, `src/`, `templates/`, `tests/`

---

## Phase 2 — Templates (`templates/`)

### Core templates (dùng chung)

- [ ] Tạo `templates/_core/AGENTS.md.tmpl` — chứa placeholder `{{FRAMEWORK}}`, `{{PACKAGE_MANAGER}}`
- [ ] Tạo `templates/_core/CLAUDE.md.tmpl` — nội dung: `@.agents/AGENTS.md`
- [ ] Tạo `templates/_core/cursorrules.tmpl` — wrapper trỏ về AGENTS.md
- [ ] Tạo `templates/_core/docs-README.md.tmpl` — Required reading order
- [ ] Tạo `templates/_core/ai-agent-guidelines.md.tmpl` — Do/Don't list
- [ ] Tạo `templates/_core/operation.md.tmpl` — No-bypass rules chi tiết
- [ ] Tạo `templates/_core/specs-template.md.tmpl` — Template viết spec (5 section)
- [ ] Tạo `templates/_core/specs-workflow.md.tmpl` — Hướng dẫn SDD cycle

### NestJS templates

- [ ] Tạo `templates/nestjs/technology.md.tmpl` — NestJS, TypeScript, stack cụ thể
- [ ] Tạo `templates/nestjs/structure.md.tmpl` — Module/Service/Controller/DTO hierarchy
- [ ] Tạo `templates/nestjs/coding-conventions.md.tmpl` — DI, Guards, Pipes, Interceptors pattern

### Next.js templates

- [ ] Tạo `templates/nextjs/technology.md.tmpl` — Next.js, React, App Router
- [ ] Tạo `templates/nextjs/structure.md.tmpl` — `app/`, components atomic design
- [ ] Tạo `templates/nextjs/coding-conventions.md.tmpl` — Server Components, Server Actions, form pattern

### Vue templates

- [ ] Tạo `templates/vue/technology.md.tmpl` — Vue 3, Vite, Pinia
- [ ] Tạo `templates/vue/structure.md.tmpl` — `src/views`, `components`, `composables`, `stores`
- [ ] Tạo `templates/vue/coding-conventions.md.tmpl` — Composition API, `<script setup>`, composables pattern

### React templates

- [ ] Tạo `templates/react/technology.md.tmpl` — React, Vite, state management
- [ ] Tạo `templates/react/structure.md.tmpl` — `src/components`, `hooks`, `pages`
- [ ] Tạo `templates/react/coding-conventions.md.tmpl` — Custom hooks, props typing, component pattern

### Generic template (fallback)

- [ ] Tạo `templates/generic/technology.md.tmpl` — Placeholder rỗng có AI-PROMPT hint
- [ ] Tạo `templates/generic/structure.md.tmpl` — Placeholder rỗng có AI-PROMPT hint
- [ ] Tạo `templates/generic/coding-conventions.md.tmpl` — Placeholder rỗng có AI-PROMPT hint

---

## Phase 3 — Source Code (`src/`)

### `src/detector.js`

- [ ] Viết function `readPackageJson(targetDir)` — đọc và parse `package.json`, return `{}` nếu không tồn tại
- [ ] Viết function `detectFramework(deps)` — nhận object deps, return frameworkId theo thứ tự ưu tiên
- [ ] Viết function `detectPackageManager(targetDir)` — check `yarn.lock`, `pnpm-lock.yaml`, default `npm`
- [ ] Viết function `detect(targetDir)` — orchestrate, return `{ framework, packageManager }`
- [ ] Export: `module.exports = { detect }`

### `src/scaffolder.js`

- [ ] Viết function `renderTemplate(content, vars)` — replace tất cả `{{KEY}}` trong string với giá trị từ `vars`
- [ ] Viết function `writeFileIfNotExists(filePath, content)` — ghi file, skip và log nếu đã tồn tại, return `'created'` hoặc `'skipped'`
- [ ] Viết function `ensureDir(dirPath)` — tạo thư mục đệ quy nếu chưa có (`fs.mkdirSync` với `recursive: true`)
- [ ] Viết function `buildFileMap(framework)` — return danh sách `[{ src: templatePath, dest: outputPath }]` cho framework đó
- [ ] Viết function `scaffold({ targetDir, framework, packageManager })` — orchestrate: ensureDir + render + writeFileIfNotExists cho từng entry trong fileMap
- [ ] Đảm bảo tạo các thư mục rỗng cần thiết: `specs/features/`, `specs/features/done/`, `.agents/skills/`
- [ ] Export: `module.exports = { scaffold }`

### `src/stealth.js`

- [ ] Viết function `findGitDir(targetDir)` — check `.git/` tồn tại tại `targetDir`, return path hoặc `null`
- [ ] Viết function `readExcludeFile(gitDir)` — đọc `.git/info/exclude`, return string rỗng nếu chưa có file
- [ ] Viết function `appendEntries(currentContent, entries)` — chỉ append entry chưa có trong content, return content mới
- [ ] Viết function `apply(targetDir)` — orchestrate: findGitDir → warn + return nếu null → readExcludeFile → appendEntries → ghi lại
- [ ] Export: `module.exports = { apply }`

### `bin/index.js`

- [ ] Thêm shebang line đầu file: `#!/usr/bin/env node`
- [ ] Lấy `targetDir = process.cwd()`
- [ ] Log header: `[create-ai-docs] Bắt đầu setup AI-first workspace...`
- [ ] Gọi `detector.detect(targetDir)`, log framework và package manager detected
- [ ] Gọi `scaffolder.scaffold(...)`, log từng file created/skipped
- [ ] Gọi `stealth.apply(targetDir)`, log kết quả
- [ ] Log footer thành công: `✅ Hoàn tất! Mở .agents/AGENTS.md để bắt đầu.`
- [ ] Wrap toàn bộ trong try/catch, log lỗi rõ ràng nếu crash

---

## Phase 4 — Tests (`tests/`)

### `tests/detector.test.js`

- [ ] Test: `package.json` có `@nestjs/core` → detect `nestjs`
- [ ] Test: `package.json` có `next` → detect `nextjs`
- [ ] Test: `package.json` có `next` và `react` → detect `nextjs` (ưu tiên next)
- [ ] Test: `package.json` có `vue` → detect `vue`
- [ ] Test: `package.json` có `react` (không có `next`) → detect `react`
- [ ] Test: `package.json` không có framework nào quen → detect `generic`
- [ ] Test: không có `package.json` → detect `generic`
- [ ] Test: có `yarn.lock` → packageManager `yarn`
- [ ] Test: có `pnpm-lock.yaml` → packageManager `pnpm`
- [ ] Test: không có lock file → packageManager `npm`

### `tests/scaffolder.test.js`

- [ ] Test: `renderTemplate` replace đúng `{{FRAMEWORK}}` và `{{PACKAGE_MANAGER}}`
- [ ] Test: `renderTemplate` không crash nếu template không có placeholder nào
- [ ] Test: `writeFileIfNotExists` tạo file mới thành công, return `'created'`
- [ ] Test: `writeFileIfNotExists` skip nếu file đã tồn tại, return `'skipped'`
- [ ] Test: `scaffold` với framework `nestjs` tạo đúng danh sách file
- [ ] Test: `scaffold` với framework `generic` tạo đúng danh sách file

### `tests/stealth.test.js`

- [ ] Test: `findGitDir` return đúng path khi có `.git/`
- [ ] Test: `findGitDir` return `null` khi không có `.git/`
- [ ] Test: `appendEntries` chỉ thêm entry chưa có, không duplicate
- [ ] Test: `apply` không crash khi `findGitDir` return `null`

---

## Phase 5 — Verify Checklist

Phải pass **toàn bộ** trước khi sang bước Review:

- [ ] `npm test` — tất cả test pass, không có test nào fail hoặc skip
- [ ] `node bin/index.js` chạy thành công trong thư mục Next.js test — tạo đúng file
- [ ] `node bin/index.js` chạy thành công trong thư mục NestJS test — tạo đúng file
- [ ] `node bin/index.js` chạy thành công trong thư mục không có `package.json` — dùng generic, không crash
- [ ] Chạy `node bin/index.js` lần 2 trong cùng thư mục — toàn bộ file đều log `[skip]`, không ghi đè
- [ ] Check `.git/info/exclude` — có đủ 5 entry cần thiết
- [ ] Chạy trong thư mục không phải git repo — log warning, không crash
- [ ] Kiểm tra tất cả Acceptance Criteria trong `spec.md` đã được check off

---

## Notes cho AI khi implement

- Dùng `path.join()` cho mọi đường dẫn, tuyệt đối không string concat thủ công
- Template files trong repo này nằm tại `path.join(__dirname, '../templates/')` tính từ `src/`
- Mọi file I/O dùng `fs.promises` (async), không dùng sync API trong production code
- Test có thể dùng `fs` sync để setup/teardown fixture folder tạm thời
