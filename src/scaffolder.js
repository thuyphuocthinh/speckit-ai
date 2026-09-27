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
 * Ưu tiên đọc từ customTemplatesDir nếu có, nếu không thì đọc từ default TEMPLATES_DIR.
 * Trả về chuỗi rỗng nếu không tồn tại.
 */
function readTemplate(templateRelPath, customTemplatesDir = null) {
  if (customTemplatesDir) {
    const customPath = path.join(customTemplatesDir, templateRelPath);
    if (fs.existsSync(customPath)) {
      return fs.readFileSync(customPath, 'utf8');
    }
  }

  // Fallback về default
  const defaultPath = path.join(TEMPLATES_DIR, templateRelPath);
  if (!fs.existsSync(defaultPath)) return '';
  return fs.readFileSync(defaultPath, 'utf8');
}

/**
 * Xây dựng danh sách file cần tạo cho framework.
 * @param {string} framework - Framework ID
 * @param {'new'|'existing'} mode - 'new' dùng fw-specific Best Practices, 'existing' dùng AI-PROMPT skeletons
 * Mỗi entry: { tmpl: relative path trong templates/, dest: relative path trong targetDir }
 */
function buildFileMap(framework, mode = 'new', scope = 'all') {
  const fw = framework;
  // Với mode=existing, các docs template swap sang _existing/ skeleton
  const docsTmpl = (name) => mode === 'existing' ? `_existing/${name}` : null;

  const allFiles = [
    // Cross-tool wrappers (root) — same in both modes
    { tmpl: '_core/CLAUDE.md.tmpl',         dest: 'CLAUDE.md', isDoc: false },
    { tmpl: '_core/cursorrules.tmpl',        dest: '.cursorrules', isDoc: false },

    // .agents/ — same in both modes
    { tmpl: '_core/AGENTS.md.tmpl',          dest: '.agents/AGENTS.md', isDoc: false },

    // docs/ — same in both modes
    { tmpl: '_core/docs-README.md.tmpl',         dest: 'docs/README.md', isDoc: true },
    { tmpl: '_core/ai-agent-guidelines.md.tmpl', dest: 'docs/ai-agent-guidelines.md', isDoc: true },
    { tmpl: '_core/operation.md.tmpl',           dest: 'docs/operation.md', isDoc: true },

    // docs/ — swapped in existing mode
    { tmpl: docsTmpl('project-overview.md.tmpl') ||
            (fs.existsSync(path.join(TEMPLATES_DIR, `${fw}/project-overview.md.tmpl`))
             ? `${fw}/project-overview.md.tmpl`
             : '_core/project-overview.md.tmpl'),
      dest: 'docs/project-overview.md', isDoc: true },

    // docs/core-principles.../ — swapped in existing mode
    { tmpl: docsTmpl('technology.md.tmpl')            || `${fw}/technology.md.tmpl`,      dest: 'docs/technology.md', isDoc: true },
    { tmpl: docsTmpl('structure.md.tmpl')             || `${fw}/structure.md.tmpl`,       dest: 'docs/core-principles-and-coding-standards/structure.md', isDoc: true },
    { tmpl: docsTmpl('coding-conventions.md.tmpl')    || `${fw}/coding-conventions.md.tmpl`, dest: 'docs/core-principles-and-coding-standards/coding-conventions.md', isDoc: true },
    { tmpl: docsTmpl('coding-style.md.tmpl')          || '_core/coding-style.md.tmpl',   dest: 'docs/core-principles-and-coding-standards/coding-style.md', isDoc: true },

    // docs/adrs/ — same in both modes
    { tmpl: '_core/adrs/0000-template.md.tmpl',      dest: 'docs/adrs/0000-template.md', isDoc: true },

    // docs/instructions-and-work-flows/ — same in both modes
    { tmpl: '_core/workflow-adding-feature.md.tmpl', dest: 'docs/core-principles-and-coding-standards/instructions-and-work-flows/adding-a-new-feature.md', isDoc: true },

    // specs/ — same in both modes
    { tmpl: '_core/specs-template.md.tmpl',  dest: 'specs/_template.md', isDoc: false },
    { tmpl: '_core/specs-workflow.md.tmpl',  dest: 'specs/_workflow.md', isDoc: false },

    // specs/contracts/ — same in both modes
    { tmpl: '_core/contracts/_template.md.tmpl', dest: 'specs/contracts/_template.md', isDoc: false },

    // .agents/skills/ — same in both modes
    { tmpl: '_skills/spec-create/SKILL.md',  dest: '.agents/skills/spec-create/SKILL.md', isDoc: false },
    { tmpl: '_skills/spec-plan/SKILL.md',    dest: '.agents/skills/spec-plan/SKILL.md', isDoc: false },
    { tmpl: '_skills/spec-review/SKILL.md',  dest: '.agents/skills/spec-review/SKILL.md', isDoc: false },
  ];

  if (scope === 'rootOnly') return allFiles.filter(f => !f.isDoc);
  if (scope === 'docsOnly') return allFiles.filter(f => f.isDoc);
  return allFiles;
}

function scaffoldFiles({ targetDir, framework, packageManager, mode, subProjectName = null, scope = 'all', customTemplatesDir = null, autoGeneratedDocs = null }) {
  const vars = {
    FRAMEWORK: formatFrameworkName(framework),
    PACKAGE_MANAGER: packageManager,
    YEAR: String(new Date().getFullYear()),
  };

  // Tạo thư mục cơ bản
  ensureDir(path.join(targetDir, '.agents', 'skills'));
  ensureDir(path.join(targetDir, 'specs', 'features', 'done'));
  
  const docsPrefix = subProjectName ? `docs/${subProjectName}` : 'docs';
  ensureDir(path.join(targetDir, docsPrefix, 'core-principles-and-coding-standards', 'instructions-and-work-flows'));

  const fileMap = buildFileMap(framework, mode, scope);
  let created = 0;
  let skipped = 0;

  for (const file of fileMap) {
    const tmpl = file.tmpl;
    let dest = file.dest;
    
    // Nếu là subProject, đổi đường dẫn docs/ thành docs/<subProjectName>/
    if (subProjectName && dest.startsWith('docs/')) {
      dest = dest.replace('docs/', `${docsPrefix}/`);
    }

    // Kiểm tra autoGeneratedDocs
    let rawContent = '';
    let isAutoOverridden = false;

    if (autoGeneratedDocs && dest.endsWith('technology.md') && autoGeneratedDocs.technology) {
      rawContent = autoGeneratedDocs.technology;
      isAutoOverridden = true;
    } else if (autoGeneratedDocs && dest.endsWith('project-overview.md') && autoGeneratedDocs.projectOverview) {
      rawContent = autoGeneratedDocs.projectOverview;
      isAutoOverridden = true;
    }

    if (!isAutoOverridden) {
      rawContent = readTemplate(tmpl, customTemplatesDir);
      if (!rawContent) {
        const fallbackTmpl = tmpl.replace(/^[^/]+\//, 'generic/');
        const fallbackContent = readTemplate(fallbackTmpl, customTemplatesDir);
        if (!fallbackContent) continue;

        const rendered = renderTemplate(fallbackContent, vars);
        const result = writeFileIfNotExists(path.join(targetDir, dest), rendered);
        result === 'created' ? created++ : skipped++;
        continue;
      }
    }

    const rendered = renderTemplate(rawContent, vars);
    const result = writeFileIfNotExists(path.join(targetDir, dest), rendered);
    result === 'created' ? created++ : skipped++;
  }

  return { created, skipped };
}

/**
 * Entry function: gọi scaffoldFiles dựa trên projectConfig (single hoặc monorepo).
 */
function scaffold({ targetDir, projectConfig, mode = 'new', customTemplatesDir = null, autoGeneratedDocs = null }) {
  let totalCreated = 0;
  let totalSkipped = 0;

  if (projectConfig.type === 'single') {
    const { framework, packageManager } = projectConfig;
    const res = scaffoldFiles({ targetDir, framework, packageManager, mode, customTemplatesDir, autoGeneratedDocs });
    totalCreated += res.created;
    totalSkipped += res.skipped;
  } else if (projectConfig.type === 'monorepo') {
    // 1. Root files
    const resRoot = scaffoldFiles({ targetDir, framework: 'generic', packageManager: 'npm', mode, scope: 'rootOnly', customTemplatesDir, autoGeneratedDocs });
    totalCreated += resRoot.created;
    totalSkipped += resRoot.skipped;

    // 2. Docs cho từng subProject
    for (const sub of projectConfig.subProjects) {
      console.log(`\n[speckit-ai] 📦 Scaffolding sub-project: ${sub.name} (${formatFrameworkName(sub.framework)})`);
      const resSub = scaffoldFiles({ targetDir, framework: sub.framework, packageManager: sub.packageManager, mode, subProjectName: sub.name, scope: 'docsOnly', customTemplatesDir, autoGeneratedDocs });
      totalCreated += resSub.created;
      totalSkipped += resSub.skipped;
    }
  }

  return { created: totalCreated, skipped: totalSkipped };
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
    'python-django': 'Python / Django',
    'python-fastapi': 'Python / FastAPI',
    'python-generic': 'Python (Generic)',
    'go-gin': 'Go / Gin',
    'go-fiber': 'Go / Fiber',
    'go-generic': 'Go (Generic)',
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
