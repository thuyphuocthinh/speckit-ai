'use strict';

const fs = require('fs');
const path = require('path');
const { toKebabCase, getPaths, listActive, resolveActive } = require('./features');

function getNextAdrNumber(adrsDir) {
  if (!fs.existsSync(adrsDir)) return '0001';
  const files = fs.readdirSync(adrsDir);
  let max = 0;
  for (const file of files) {
    const match = file.match(/^(\d{4})-/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return String(max + 1).padStart(4, '0');
}

/**
 * Tìm thư mục đích cho ADR/contract.
 * - `--for=<feature>`: đặt cạnh feature đó (feature phải tồn tại).
 * - Không có `--for` mà có việc active: đặt trong việc đó (lúc `done` sẽ được chuyển đi).
 *   Nhiều việc active thì phải chọn bằng `--work=<tên>`.
 * - Còn lại: thư mục chung specs/decisions/ hoặc specs/contracts/.
 * @param {'decisions'|'contracts'} kind
 */
function resolveDestinationDir(kind, targetDir, { forFeature, work } = {}) {
  const paths = getPaths(targetDir);

  if (forFeature) {
    const slug = toKebabCase(forFeature);
    if (!fs.existsSync(path.join(paths.features, slug, 'spec.md'))) {
      throw new Error(`Feature "${slug}" not found in specs/features/.`);
    }
    return path.join(paths.features, slug, kind);
  }

  if (work || listActive(targetDir).length > 0) {
    const { dir } = resolveActive(targetDir, work);
    return path.join(dir, kind);
  }

  return paths[kind];
}

/**
 * Sinh file mới từ template của project.
 * @param {'adr'|'a'|'contract'|'c'} type
 * @param {string} title
 * @param {{ forFeature?: string, work?: string }} [options]
 * @param {string} [targetDir]
 * @returns {string} đường dẫn file vừa tạo
 */
function generate(type, title, options = {}, targetDir = process.cwd()) {
  if (!title) {
    throw new Error('Title is required. Example: speckit-ai generate adr "Use JWT for sessions"');
  }

  const paths = getPaths(targetDir);
  const slug = toKebabCase(title);
  let kind;
  let tmplPath;
  let fileName;
  let replacedTitle;

  if (type === 'adr' || type === 'a') {
    kind = 'decisions';
    tmplPath = path.join(paths.decisions, '0000-template.md');
    replacedTitle = `# ${title}`;
  } else if (type === 'contract' || type === 'c') {
    kind = 'contracts';
    tmplPath = path.join(paths.contracts, '_template.md');
    fileName = `${slug}.md`;
    replacedTitle = `# Contract: ${title}`;
  } else {
    throw new Error(`Unknown type: ${type}. Supported types: adr (a), contract (c), tests (t).`);
  }

  if (!fs.existsSync(tmplPath)) {
    throw new Error(`Template not found at ${path.relative(targetDir, tmplPath)}. Did you run 'npx speckit-ai' to initialize the project first?`);
  }

  const destDir = resolveDestinationDir(kind, targetDir, options);
  if (kind === 'decisions') fileName = `${getNextAdrNumber(destDir)}-${slug}.md`;
  const destPath = path.join(destDir, fileName);

  if (fs.existsSync(destPath)) {
    throw new Error(`File already exists: ${path.relative(targetDir, destPath)}`);
  }

  // Replace the first H1 tag
  const newContent = fs.readFileSync(tmplPath, 'utf8').replace(/^#\s+.+/m, replacedTitle);

  // Replace Date if present (ADR has Date: {{YEAR}}-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const finalContent = newContent.replace(/Date: .+/g, `Date: ${today}`);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destPath, finalContent, 'utf8');

  console.log(`[speckit-ai] ✅ Generated ${type}: ${path.relative(targetDir, destPath)}`);
  return destPath;
}

/**
 * Sinh test skeleton từ các Acceptance Criteria (### AC-n: ...) trong targets/ của việc đang làm.
 * Mỗi file target có AC cho ra một file tests/specs/<slug>.test.(js|ts).
 * @param {string} [name] - tên việc active; bỏ trống nếu chỉ có một việc
 * @returns {string[]} các file test đã tạo
 */
function generateTestsFromSpec(name, targetDir = process.cwd()) {
  const { dir } = resolveActive(targetDir, name);
  const targetsDir = path.join(dir, 'targets');
  const targetFiles = fs.existsSync(targetsDir)
    ? fs.readdirSync(targetsDir).filter((f) => f.endsWith('.md')).sort()
    : [];

  if (targetFiles.length === 0) {
    throw new Error(`No target specs found in ${path.relative(targetDir, targetsDir)}.`);
  }

  // Matches ### AC-1: Something or ### AC-1 Something
  const acRegex = /^###\s+(AC-\d+)[^\w]*(.+)$/gm;
  const ext = fs.existsSync(path.join(targetDir, 'tsconfig.json')) ? 'ts' : 'js';
  const testDir = path.join(targetDir, 'tests', 'specs');
  const planned = [];

  for (const file of targetFiles) {
    const content = fs.readFileSync(path.join(targetsDir, file), 'utf8');
    const acs = [];
    let match;
    acRegex.lastIndex = 0;
    while ((match = acRegex.exec(content)) !== null) {
      acs.push({ id: match[1], desc: match[2].trim() });
    }

    if (acs.length === 0) {
      console.log(`[speckit-ai] ⚠️ No Acceptance Criteria (AC) found in ${path.relative(targetDir, path.join(targetsDir, file))}.`);
      console.log(`[speckit-ai] 👉 Please add "### AC-1: <Description>" to your spec file.`);
      continue;
    }

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
    planned.push({
      title,
      acs,
      testFile: path.join(testDir, `${toKebabCase(title) || path.basename(file, '.md')}.test.${ext}`),
    });
  }

  const existing = planned.filter((p) => fs.existsSync(p.testFile));
  if (existing.length > 0) {
    throw new Error(`Test file already exists: ${existing.map((p) => path.relative(targetDir, p.testFile)).join(', ')}`);
  }

  const created = [];
  for (const { title, acs, testFile } of planned) {
    let testCode = `describe('${title.replace(/'/g, "\\'")}', () => {\n`;
    for (const ac of acs) {
      testCode += `  describe('${ac.id}: ${ac.desc.replace(/'/g, "\\'")}', () => {\n`;
      testCode += `    test('should satisfy acceptance criteria', () => {\n`;
      testCode += `      // TODO: Implement test for ${ac.id}\n`;
      testCode += `    });\n`;
      testCode += `  });\n\n`;
    }
    testCode += `});\n`;

    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, testCode, 'utf8');
    console.log(`[speckit-ai] ✅ Found ${acs.length} Acceptance Criteria for "${title}"`);
    console.log(`[speckit-ai] ✅ Generated test skeleton: ${path.relative(targetDir, testFile)}`);
    created.push(testFile);
  }

  return created;
}

module.exports = { toKebabCase, getNextAdrNumber, generate, generateTestsFromSpec, resolveDestinationDir };
