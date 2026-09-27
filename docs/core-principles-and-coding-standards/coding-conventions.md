# Coding Conventions

## Module Pattern

Mỗi file trong `src/` export một object với các function thuần túy (pure function):

```javascript
// ✅ Đúng
async function detectFramework(projectPath) {
  // ...
  return { framework: 'nestjs', confidence: 'high' };
}

module.exports = { detectFramework };

// ❌ Sai — side effect ngay khi require
const result = detectFramework('./'); // Không làm thế này
```

## Error Handling

Tất cả error phải có message rõ ràng, không throw generic Error:

```javascript
// ✅ Đúng
if (!fs.existsSync(projectPath)) {
  throw new Error(`[create-ai-docs] Không tìm thấy thư mục: ${projectPath}`);
}

// ❌ Sai
throw new Error('Not found');
```

## Async/Await

Dùng `async/await` thay vì callback hay `.then()`:

```javascript
// ✅ Đúng
const content = await fs.promises.readFile(filePath, 'utf8');

// ❌ Sai
fs.readFile(filePath, 'utf8', (err, data) => { ... });
```

## Template Files

Template dùng placeholder dạng `{{VARIABLE_NAME}}`:

```
# Project: {{PROJECT_NAME}}
Package manager: {{PACKAGE_MANAGER}}
```

Scaffolder sẽ replace placeholder trước khi ghi ra file.

## Logging

Dùng prefix `[create-ai-docs]` cho mọi output ra console:

```javascript
console.log('[create-ai-docs] ✅ Đã tạo .agents/AGENTS.md');
console.error('[create-ai-docs] ❌ Lỗi: ...');
```
