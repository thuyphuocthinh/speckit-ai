'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Replace tất cả {{KEY}} trong string với giá trị từ vars.
 */
function renderTemplate(content, vars) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Ghi file nếu chưa tồn tại.
 * Return 'created' hoặc 'skipped'.
 */
function writeFileIfNotExists(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`[create-ai-docs]   [skip] ${path.relative(process.cwd(), filePath)}`);
    return 'skipped';
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[create-ai-docs]   [create] ${path.relative(process.cwd(), filePath)}`);
  return 'created';
}

/**
 * Đảm bảo thư mục tồn tại (tạo đệ quy nếu chưa có).
 */
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Đọc nội dung template file.
 * Trả về chuỗi rỗng nếu không tồn tại.
 */
function readTemplate(templateRelPath) {
  const fullPath = path.join(TEMPLATES_DIR, templateRelPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Xây dựng danh sách file cần tạo cho framework.
 * @param {string} framework - Framework ID
 * @param {'new'|'existing'} mode - 'new' dùng fw-specific Best Practices, 'existing' dùng AI-PROMPT skeletons
 * Mỗi entry: { tmpl: relative path trong templates/, dest: relative path trong targetDir }
 */
function buildFileMap(framework, mode = 'new') {
  const fw = framework;
  // Với mode=existing, các docs template swap sang _existing/ skeleton
  const docsTmpl = (name) => mode === 'existing' ? `_existing/${name}` : null;

  return [
    // Cross-tool wrappers (root) — same in both modes
    { tmpl: '_core/CLAUDE.md.tmpl',         dest: 'CLAUDE.md' },
    { tmpl: '_core/cursorrules.tmpl',        dest: '.cursorrules' },

    // .agents/ — same in both modes
    { tmpl: '_core/AGENTS.md.tmpl',          dest: '.agents/AGENTS.md' },

    // docs/ — same in both modes
    { tmpl: '_core/docs-README.md.tmpl',         dest: 'docs/README.md' },
    { tmpl: '_core/ai-agent-guidelines.md.tmpl', dest: 'docs/ai-agent-guidelines.md' },
    { tmpl: '_core/operation.md.tmpl',           dest: 'docs/operation.md' },

    // docs/ — swapped in existing mode
    { tmpl: docsTmpl('project-overview.md.tmpl') ||
            (fs.existsSync(path.join(TEMPLATES_DIR, `${fw}/project-overview.md.tmpl`))
             ? `${fw}/project-overview.md.tmpl`
             : '_core/project-overview.md.tmpl'),
      dest: 'docs/project-overview.md' },

    // docs/core-principles.../ — swapped in existing mode
    { tmpl: docsTmpl('technology.md.tmpl')            || `${fw}/technology.md.tmpl`,      dest: 'docs/technology.md' },
    { tmpl: docsTmpl('structure.md.tmpl')             || `${fw}/structure.md.tmpl`,       dest: 'docs/core-principles-and-coding-standards/structure.md' },
    { tmpl: docsTmpl('coding-conventions.md.tmpl')    || `${fw}/coding-conventions.md.tmpl`, dest: 'docs/core-principles-and-coding-standards/coding-conventions.md' },
    { tmpl: docsTmpl('coding-style.md.tmpl')          || '_core/coding-style.md.tmpl',   dest: 'docs/core-principles-and-coding-standards/coding-style.md' },

    // docs/instructions-and-work-flows/ — same in both modes
    { tmpl: '_core/workflow-adding-feature.md.tmpl', dest: 'docs/core-principles-and-coding-standards/instructions-and-work-flows/adding-a-new-feature.md' },

    // specs/ — same in both modes
    { tmpl: '_core/specs-template.md.tmpl',  dest: 'specs/_template.md' },
    { tmpl: '_core/specs-workflow.md.tmpl',  dest: 'specs/_workflow.md' },

    // .agents/skills/ — same in both modes
    { tmpl: '_skills/spec-create/SKILL.md',  dest: '.agents/skills/spec-create/SKILL.md' },
    { tmpl: '_skills/spec-plan/SKILL.md',    dest: '.agents/skills/spec-plan/SKILL.md' },
    { tmpl: '_skills/spec-review/SKILL.md',  dest: '.agents/skills/spec-review/SKILL.md' },
  ];
}

/**
 * Tạo toàn bộ cấu trúc thư mục và file cho dự án.
 * @param {object} options
 * @param {string} options.targetDir      - Thư mục đích
 * @param {string} options.framework      - Framework ID
 * @param {string} options.packageManager - 'npm' | 'yarn' | 'pnpm'
 * @param {'new'|'existing'} [options.mode='new'] - 'new': Best Practices templates, 'existing': AI-PROMPT skeletons
 * @returns {{ created: number, skipped: number }}
 */
function scaffold({ targetDir, framework, packageManager, mode = 'new' }) {
  const vars = {
    FRAMEWORK: formatFrameworkName(framework),
    PACKAGE_MANAGER: packageManager,
    YEAR: String(new Date().getFullYear()),
  };

  // Tạo các thư mục rỗng cần thiết trước
  ensureDir(path.join(targetDir, '.agents', 'skills'));
  ensureDir(path.join(targetDir, 'specs', 'features', 'done'));
  ensureDir(path.join(targetDir, 'docs', 'core-principles-and-coding-standards', 'instructions-and-work-flows'));

  const fileMap = buildFileMap(framework, mode);
  let created = 0;
  let skipped = 0;

  for (const { tmpl, dest } of fileMap) {
    const rawContent = readTemplate(tmpl);
    if (!rawContent) {
      // Fallback sang generic nếu template framework-specific không tồn tại
      const fallbackTmpl = tmpl.replace(/^[^/]+\//, 'generic/');
      const fallbackContent = readTemplate(fallbackTmpl);
      if (!fallbackContent) continue;

      const rendered = renderTemplate(fallbackContent, vars);
      const result = writeFileIfNotExists(path.join(targetDir, dest), rendered);
      result === 'created' ? created++ : skipped++;
      continue;
    }

    const rendered = renderTemplate(rawContent, vars);
    const result = writeFileIfNotExists(path.join(targetDir, dest), rendered);
    result === 'created' ? created++ : skipped++;
  }

  return { created, skipped };
}

/**
 * Format framework ID thành tên hiển thị.
 */
function formatFrameworkName(fw) {
  const names = {
    nestjs: 'NestJS',
    nextjs: 'Next.js',
    vue: 'Vue 3',
    react: 'React',
    'node-express': 'Node.js / Express',
    generic: 'Generic',
  };
  return names[fw] ?? fw;
}

module.exports = {
  scaffold,
  renderTemplate,
  writeFileIfNotExists,
  buildFileMap,
  formatFrameworkName,
  ensureDir,
};
