'use strict';

const fs = require('fs');
const path = require('path');
const detector = require('./detector');
const scaffolder = require('./scaffolder');
const configLoader = require('./config');
const { HOOK_CONTENT, HOOK_MARKER } = require('./hook');
const { getPaths, listDirs } = require('./features');

/** File do tool sở hữu: nội dung hoàn toàn đến từ template, an toàn để thay bằng bản mới. */
const MANAGED = [
  'specs/_template.md',
  'specs/_workflow.md',
  'specs/ideas/_template.md',
  'specs/decisions/0000-template.md',
  'specs/contracts/_template.md',
  '.agents/skills/spec-create/SKILL.md',
  '.agents/skills/spec-plan/SKILL.md',
  '.agents/skills/spec-review/SKILL.md',
];

/** File do người dùng sở hữu (thường đã chỉnh tay): không bao giờ bị sửa, chỉ gợi ý dòng còn thiếu. */
const OWNED = [
  '.agents/AGENTS.md',
  'docs/README.md',
  'docs/core-principles-and-coding-standards/instructions-and-work-flows/adding-a-new-feature.md',
];

const normalizeEol = (s) => s.replace(/\r\n/g, '\n');
const toPosix = (p) => p.split(path.sep).join('/');

/**
 * Nội dung mong đợi (đã render) của các file MANAGED và OWNED theo template hiện tại
 * (có tính tới templatesDir tùy chỉnh trong .speckitrc).
 * @returns {Map<string, string>} dest -> nội dung
 */
function loadExpected(targetDir) {
  const projectConfig = detector.detect(targetDir);
  const single = projectConfig.type === 'single';
  const framework = single ? projectConfig.framework : 'generic';
  const vars = {
    FRAMEWORK: scaffolder.formatFrameworkName(framework),
    PACKAGE_MANAGER: single ? projectConfig.packageManager : 'npm',
    YEAR: String(new Date().getFullYear()),
  };
  const { templatesDir } = configLoader.loadConfig(targetDir);

  const expected = new Map();
  for (const { tmpl, dest } of scaffolder.buildFileMap(framework, 'new')) {
    if (!MANAGED.includes(dest) && !OWNED.includes(dest)) continue;
    const raw = scaffolder.readTemplate(tmpl, templatesDir || null);
    if (raw) expected.set(dest, scaffolder.renderTemplate(raw, vars));
  }
  return expected;
}

/**
 * Các dòng của template có nhắc tới lệnh speckit-ai hoặc đường dẫn specs/ mà file hiện tại chưa có.
 * (Chỉ xét các dòng liên quan tới flow SDD để tránh nhiễu do người dùng tự viết lại nội dung.)
 */
function missingWorkflowLines(current, expected) {
  const have = new Set(normalizeEol(current).split('\n').map((l) => l.trim()));
  const missing = [];
  for (const raw of normalizeEol(expected).split('\n')) {
    const line = raw.trim();
    if (line && !have.has(line) && /speckit-ai|specs\//.test(line) && !missing.includes(line)) {
      missing.push(line);
    }
  }
  return missing;
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

/**
 * Tìm các dấu vết bố cục và hook của bản 1.x.
 * @returns {Array<{ title: string, advice: string }>}
 */
function findLegacy(targetDir) {
  const paths = getPaths(targetDir);
  const items = [];

  const doneDir = path.join(paths.features, 'done');
  if (fs.existsSync(doneDir)) {
    const count = listDirs(doneDir).length;
    items.push({
      title: `specs/features/done/ (${count} feature folder(s))`,
      advice: 'speckit-ai 2.x does not look here. Move each folder to specs/features/<slug>/ (--affects needs that path) or to specs/.history/legacy/.',
    });
  }

  for (const dir of ['changes', 'archive']) {
    if (fs.existsSync(path.join(targetDir, dir))) {
      items.push({
        title: `${dir}/`,
        advice: 'Old propose/archive folders are not recognized. Finish in-flight changes with the old version or recreate them with "speckit-ai start", then delete the folder.',
      });
    }
  }

  if (fs.existsSync(path.join(targetDir, 'docs', 'adrs'))) {
    items.push({
      title: 'docs/adrs/',
      advice: 'Decision records now live next to the feature (specs/features/<slug>/decisions/) or in specs/decisions/. Move the ones you want checked by lint.',
    });
  }

  const oldFormat = listDirs(paths.features)
    .filter((slug) => slug !== 'done' && fs.existsSync(path.join(paths.features, slug, 'spec.md')))
    .filter((slug) => !/^##\s+Changelog\s*$/im.test(fs.readFileSync(path.join(paths.features, slug, 'spec.md'), 'utf8')));
  if (oldFormat.length > 0) {
    const shown = oldFormat.slice(0, 5).join(', ') + (oldFormat.length > 5 ? ', ...' : '');
    items.push({
      title: `${oldFormat.length} spec(s) in the old format (no "## Changelog"): ${shown}`,
      advice: '"speckit-ai lint" fails on them. Bring them to specs/_template.md when you next change them, or move them to specs/.history/legacy/.',
    });
  }

  const hooksDir = path.join(targetDir, '.git', 'hooks');
  const commitMsg = readIfExists(path.join(hooksDir, 'commit-msg'));
  if (commitMsg && commitMsg.includes('speckit-ai verify-commit')) {
    items.push({
      title: '.git/hooks/commit-msg from speckit-ai 1.x',
      advice: 'It only prints a warning now, but run "npx speckit-ai --init-hook" to remove it and update the pre-commit hook.',
    });
  }
  const preCommit = readIfExists(path.join(hooksDir, 'pre-commit'));
  if (preCommit && preCommit.includes(HOOK_MARKER) && normalizeEol(preCommit) !== normalizeEol(HOOK_CONTENT)) {
    items.push({
      title: '.git/hooks/pre-commit from an older speckit-ai',
      advice: 'Run "npx speckit-ai --init-hook" to update it (the old one also required staged spec files, which stealth mode makes impossible).',
    });
  }

  for (const name of ['.speckitrc', 'speckit.config.json']) {
    const raw = readIfExists(path.join(targetDir, name));
    if (!raw) continue;
    try {
      if (Object.prototype.hasOwnProperty.call(JSON.parse(raw), 'requireCommitPrefix')) {
        items.push({ title: `requireCommitPrefix in ${name}`, advice: 'This option was removed and is ignored. Delete it.' });
      }
    } catch {
      // file cấu hình không phải JSON hợp lệ: config.js đã cảnh báo, bỏ qua ở đây
    }
  }

  return items;
}

/**
 * So project với template hiện tại mà không ghi gì.
 * @returns {{ managed: Array<{dest: string, state: 'current'|'outdated'|'missing'}>,
 *             owned: Array<{dest: string, missingLines: string[]}>,
 *             legacy: Array<{title: string, advice: string}>,
 *             expected: Map<string, string> }}
 */
function analyzeUpgrade(targetDir) {
  if (!fs.existsSync(getPaths(targetDir).specs) && !fs.existsSync(path.join(targetDir, '.agents'))) {
    throw new Error("Nothing to upgrade: no specs/ or .agents/ found. Run 'npx speckit-ai' first.");
  }

  const expected = loadExpected(targetDir);

  const managed = MANAGED.filter((dest) => expected.has(dest)).map((dest) => {
    const file = path.join(targetDir, dest);
    if (!fs.existsSync(file)) return { dest, state: 'missing' };
    const same = normalizeEol(fs.readFileSync(file, 'utf8')).trimEnd() === normalizeEol(expected.get(dest)).trimEnd();
    return { dest, state: same ? 'current' : 'outdated' };
  });

  const owned = OWNED
    .filter((dest) => expected.has(dest) && fs.existsSync(path.join(targetDir, dest)))
    .map((dest) => ({
      dest,
      missingLines: missingWorkflowLines(fs.readFileSync(path.join(targetDir, dest), 'utf8'), expected.get(dest)),
    }))
    .filter((item) => item.missingLines.length > 0);

  return { managed, owned, legacy: findLegacy(targetDir), expected };
}

/** Đường dẫn backup chưa tồn tại: <file>.bak, <file>.bak.1, <file>.bak.2, ... */
function uniqueBackupPath(file) {
  let candidate = `${file}.bak`;
  for (let n = 1; fs.existsSync(candidate); n++) candidate = `${file}.bak.${n}`;
  return candidate;
}

/**
 * Ghi các file MANAGED cũ hoặc thiếu; file cũ được sao lưu trước. Không đụng vào file OWNED và bố cục cũ.
 * @returns {{ written: string[], backups: string[] }}
 */
function applyUpgrade(targetDir, analysis) {
  const written = [];
  const backups = [];

  for (const { dest, state } of analysis.managed) {
    if (state === 'current') continue;

    const file = path.join(targetDir, dest);
    let content = analysis.expected.get(dest);

    if (state === 'outdated') {
      const backup = uniqueBackupPath(file);
      fs.copyFileSync(file, backup);
      backups.push(toPosix(path.relative(targetDir, backup)));
      if (fs.readFileSync(file, 'utf8').includes('\r\n')) content = normalizeEol(content).replace(/\n/g, '\r\n');
    }

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    written.push(dest);
  }

  return { written, backups };
}

/**
 * Lệnh `upgrade`: mặc định chỉ báo cáo (dry run); có `apply` thì ghi.
 */
function runUpgrade(targetDir, { apply = false } = {}) {
  const analysis = analyzeUpgrade(targetDir);
  const icons = { current: '✓ up to date', outdated: '↻ outdated  ', missing: '+ missing   ' };

  console.log(`[speckit-ai] Upgrade ${apply ? 'apply' : 'check (dry run: nothing is changed)'}`);
  console.log('');
  console.log('Files managed by speckit-ai (replaced by the new version, the old one is saved as .bak):');
  for (const { dest, state } of analysis.managed) console.log(`  ${icons[state]}  ${dest}`);

  let result = { written: [], backups: [] };
  if (apply) {
    result = applyUpgrade(targetDir, analysis);
    console.log('');
    if (result.written.length === 0) {
      console.log('Nothing to write: managed files are already up to date.');
    } else {
      console.log(`Written: ${result.written.length} file(s)`);
      for (const backup of result.backups) console.log(`  backup  ${backup}`);
    }
  }

  if (analysis.owned.length > 0) {
    console.log('');
    console.log('Files you own (never changed). The new templates have these workflow lines that yours lack:');
    for (const { dest, missingLines } of analysis.owned) {
      console.log(`  ${dest}`);
      for (const line of missingLines) console.log(`    + ${line}`);
    }
  }

  if (analysis.legacy.length > 0) {
    console.log('');
    console.log('Left over from speckit-ai 1.x (nothing is moved for you):');
    for (const { title, advice } of analysis.legacy) {
      console.log(`  • ${title}`);
      console.log(`    ${advice}`);
    }
  }

  const pending = analysis.managed.filter((m) => m.state !== 'current').length;
  console.log('');
  if (!apply && pending > 0) {
    console.log(`[speckit-ai] ${pending} managed file(s) can be updated. Run: npx speckit-ai upgrade --apply`);
  } else if (pending === 0 && analysis.owned.length === 0 && analysis.legacy.length === 0) {
    console.log('[speckit-ai] ✅ Everything is up to date.');
  }

  return { analysis, result };
}

module.exports = { analyzeUpgrade, applyUpgrade, runUpgrade, findLegacy, MANAGED, OWNED };
