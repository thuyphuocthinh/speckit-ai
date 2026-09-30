'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths, parseMeta, parseList, sha256, resolveActive } = require('./features');
const { getNextAdrNumber } = require('./generator');

/** Các thẻ HTML thường gặp, không coi là placeholder `<...>` */
const HTML_TAGS = new Set([
  'a', 'b', 'i', 'p', 'br', 'hr', 'em', 'strong', 'code', 'pre', 'ul', 'ol', 'li', 'div', 'span',
  'details', 'summary', 'kbd', 'sub', 'sup', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img',
]);

/**
 * Bỏ các phần không phải nội dung viết tay: code block, comment HTML, inline code.
 */
function stripNonProse(content) {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/`[^`\n]*`/g, '');
}

/**
 * Tìm các placeholder dạng `<...>` chưa được điền.
 */
function findPlaceholders(content) {
  const found = new Set();
  for (const match of stripNonProse(content).matchAll(/<([A-Za-z][^<>\n]*)>/g)) {
    const inner = match[1].trim();
    const [first, ...rest] = inner.split(/\s+/);
    const isHtml = HTML_TAGS.has(first.replace(/\/$/, '').toLowerCase())
      && (rest.length === 0 || inner.includes('='));
    if (!isHtml) found.add(match[0]);
  }
  return [...found];
}

/**
 * Lấy các dòng của một section `## <title>` (đến heading `##` kế tiếp).
 */
function getSectionLines(content, title) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${title}\\s*$`, 'i').test(l));
  if (start === -1) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Dòng đầu có nghĩa của proposal (bỏ heading, metadata, comment, dòng placeholder).
 */
function proposalSummary(proposal, fallback) {
  const lines = stripNonProse(proposal).split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('>')) continue;
    if (/^<[^<>]*>$/.test(line)) continue;
    return line.length > 120 ? `${line.slice(0, 117)}...` : line;
  }
  return fallback;
}

/**
 * Các loại review được nhắc tới trong review.md (code/test/security/performance).
 */
function reviewTypes(review) {
  const types = new Set();
  for (const match of review.matchAll(/^#{2,4}\s.*\b(code|test|security|performance)\b/gim)) {
    types.add(match[1].toLowerCase());
  }
  return types.size > 0 ? [...types].join(', ') : 'review.md';
}

/**
 * Thêm một dòng vào cuối section `## Changelog` (tạo section nếu chưa có).
 */
function appendChangelog(content, line) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Changelog\s*$/i.test(l));

  if (start === -1) {
    const trimmed = content.replace(/\s+$/, '');
    return `${trimmed}${eol}${eol}## Changelog${eol}${eol}${line}${eol}`;
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  let last = start;
  for (let i = start + 1; i < end; i++) {
    if (lines[i].trim() !== '') last = i;
  }
  if (last === start) {
    lines.splice(start + 1, 0, '', line);
  } else {
    lines.splice(last + 1, 0, line);
  }
  return lines.join(eol);
}

function error(code, message, forceable = true) {
  return { code, message, forceable };
}

function decisionExists(decisionsDir, ref) {
  if (!fs.existsSync(decisionsDir)) return false;
  return fs.readdirSync(decisionsDir).some((f) => f === `${ref}.md` || (f.startsWith(`${ref}-`) && f.endsWith('.md')));
}

function readWorkJson(dir) {
  const file = path.join(dir, 'work.json');
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed.targets === 'object' && parsed.targets !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Nơi ADR/contract của việc sẽ được chuyển tới: cạnh feature nếu việc có đúng một target,
 * ngược lại vào thư mục chung.
 */
function resolveMoveDestination(paths, targetSlugs, kind) {
  return targetSlugs.length === 1
    ? path.join(paths.features, targetSlugs[0], kind)
    : paths[kind];
}

/**
 * Chạy toàn bộ cổng kiểm tra của `done` mà không ghi/xóa gì.
 * @returns {{ name: string, dir: string, errors: Array<{code: string, message: string, forceable: boolean}> }}
 */
function checkWork(targetDir, name) {
  const { name: workName, dir } = resolveActive(targetDir, name);
  const paths = getPaths(targetDir);
  const errors = [];

  const work = readWorkJson(dir);
  if (!work) {
    errors.push(error('work-json', 'work.json is missing or invalid (run "speckit-ai start" to create a work).', false));
    return { name: workName, dir, errors };
  }

  const targetSlugs = Object.keys(work.targets);
  const targetsDir = path.join(dir, 'targets');

  for (const slug of targetSlugs) {
    const targetFile = path.join(targetsDir, `${slug}.md`);
    const rel = path.join('targets', `${slug}.md`);
    if (!fs.existsSync(targetFile)) {
      errors.push(error('target-missing', `${rel} is missing.`, false));
      continue;
    }

    const content = fs.readFileSync(targetFile, 'utf8');

    const openQuestions = getSectionLines(content, 'Open Questions').filter((l) => /^\s*[-*]\s*\[ \]/.test(l)).length;
    if (openQuestions > 0) {
      errors.push(error('open-questions', `${rel}: ${openQuestions} unresolved item(s) under "Open Questions".`));
    }

    if (!/^###\s+AC-\d+:\s*\S/m.test(content)) {
      errors.push(error('ac-format', `${rel}: no Acceptance Criteria in the form "### AC-n: <name>".`));
    }

    const placeholders = findPlaceholders(content);
    if (placeholders.length > 0) {
      errors.push(error('placeholders', `${rel}: unfilled placeholder(s): ${placeholders.slice(0, 5).join(', ')}${placeholders.length > 5 ? ', ...' : ''}`));
    }

    const meta = parseMeta(content);
    for (const ref of parseList(meta.decisions)) {
      if (!decisionExists(paths.decisions, ref)) {
        errors.push(error('references', `${rel}: Decisions references "${ref}" but no matching file exists in specs/decisions/.`));
      }
    }
    for (const ref of parseList(meta.contracts)) {
      if (!fs.existsSync(path.join(paths.contracts, `${ref}.md`))) {
        errors.push(error('references', `${rel}: Contracts references "${ref}" but specs/contracts/${ref}.md does not exist.`));
      }
    }

    // Bản gốc phải còn nguyên như lúc start (hoặc chưa tồn tại nếu là feature mới)
    const baselineHash = work.targets[slug];
    const featureSpec = path.join(paths.features, slug, 'spec.md');
    if (baselineHash === null) {
      if (fs.existsSync(featureSpec)) {
        errors.push(error('baseline-exists', `specs/features/${slug}/spec.md already exists; this work was started as a new feature.`, false));
      }
    } else if (!fs.existsSync(featureSpec)) {
      errors.push(error('baseline', `specs/features/${slug}/spec.md no longer exists.`));
    } else if (sha256(featureSpec) !== baselineHash) {
      errors.push(error('baseline', `specs/features/${slug}/spec.md changed since this work started. Merge the change into targets/${slug}.md by hand, then use --force.`));
    }
  }

  const tasksFile = path.join(dir, 'tasks.md');
  if (!fs.existsSync(tasksFile)) {
    errors.push(error('tasks', 'tasks.md is missing.'));
  } else {
    // Bỏ các phần "Handoff Session" (tóm tắt tự sinh) khỏi việc đếm task
    const body = fs.readFileSync(tasksFile, 'utf8').split(/^## 🔄 Handoff Session/m)[0];
    const unchecked = (body.match(/^\s*[-*]\s*\[ \]/gm) || []).length;
    const checked = (body.match(/^\s*[-*]\s*\[[xX]\]/gm) || []).length;
    if (unchecked > 0) {
      errors.push(error('tasks', `tasks.md has ${unchecked} unfinished task(s).`));
    } else if (checked === 0) {
      errors.push(error('tasks', 'tasks.md has no completed tasks.'));
    }
    if (!/^#{2,}\s+.*\btests?\b/im.test(body)) {
      errors.push(error('tasks', 'tasks.md has no Tests phase (add a "## Phase 4: Tests" section).'));
    }
  }

  const reviewFile = path.join(dir, 'review.md');
  if (!fs.existsSync(reviewFile) || fs.readFileSync(reviewFile, 'utf8').trim() === '') {
    errors.push(error('review', 'review.md is missing or empty.'));
  }

  // ADR/contract sẽ được chuyển đi: contract không được ghi đè file đã có
  const contractsDest = resolveMoveDestination(paths, targetSlugs, 'contracts');
  for (const file of listMarkdown(path.join(dir, 'contracts'))) {
    if (fs.existsSync(path.join(contractsDest, file))) {
      errors.push(error('contract-exists', `${path.relative(targetDir, path.join(contractsDest, file))} already exists.`, false));
    }
  }

  return { name: workName, dir, errors };
}

/**
 * Hoàn tất một việc: kiểm tra chặt, ghi spec vào specs/features/, chuyển ADR/contract,
 * rồi cất thư mục việc vào specs/.history/. Kiểm tra xong mới ghi; sai thì không đổi gì.
 * @param {string} targetDir
 * @param {{ name?: string, force?: boolean }} [options]
 * @returns {{ name: string, features: string[], historyDir: string, skipped: string[] }}
 */
function finishWork(targetDir, { name, force = false } = {}) {
  const { name: workName, dir, errors } = checkWork(targetDir, name);
  const paths = getPaths(targetDir);

  const blocking = force ? errors.filter((e) => !e.forceable) : errors;
  if (blocking.length > 0) {
    const lines = blocking.map((e) => `  - ${e.message}`);
    const hint = !force && blocking.some((e) => e.forceable)
      ? '\nUse --force to bypass these checks (recorded in the Changelog).'
      : '';
    throw new Error(`Cannot finish "${workName}":\n${lines.join('\n')}${hint}`);
  }
  const skipped = [...new Set(errors.map((e) => e.code))];

  const work = readWorkJson(dir);
  const targetSlugs = Object.keys(work.targets);
  const date = today();

  // Chuẩn bị mọi nội dung trước khi ghi
  const proposalFile = path.join(dir, 'proposal.md');
  const proposal = fs.existsSync(proposalFile) ? fs.readFileSync(proposalFile, 'utf8') : '';
  const summary = proposalSummary(proposal, workName);
  const review = fs.readFileSync(path.join(dir, 'review.md'), 'utf8');

  let historyName = `${date}-${workName}`;
  for (let n = 2; fs.existsSync(path.join(paths.history, historyName)); n++) {
    historyName = `${date}-${workName}-${n}`;
  }
  const historyDir = path.join(paths.history, historyName);

  const forced = force && skipped.length > 0 ? ` · forced: ${skipped.join(', ')}` : '';
  const changelogLine = `- ${date} · ${workName} · ${summary} · review: ${reviewTypes(review)}${forced} · chi tiết: .history/${historyName}`;

  const specWrites = targetSlugs.map((slug) => ({
    dest: path.join(paths.features, slug, 'spec.md'),
    content: appendChangelog(fs.readFileSync(path.join(dir, 'targets', `${slug}.md`), 'utf8'), changelogLine),
  }));

  // ADR: đánh số lại theo thư mục đích; contract: giữ tên file
  const moves = [];
  const nextNumber = new Map();
  const decisionsDest = resolveMoveDestination(paths, targetSlugs, 'decisions');
  for (const file of listMarkdown(path.join(dir, 'decisions'))) {
    if (!nextNumber.has(decisionsDest)) nextNumber.set(decisionsDest, parseInt(getNextAdrNumber(decisionsDest), 10));
    const num = nextNumber.get(decisionsDest);
    nextNumber.set(decisionsDest, num + 1);
    const rest = file.replace(/^\d{4}-/, '');
    moves.push({ from: path.join(dir, 'decisions', file), to: path.join(decisionsDest, `${String(num).padStart(4, '0')}-${rest}`) });
  }
  const contractsDest = resolveMoveDestination(paths, targetSlugs, 'contracts');
  for (const file of listMarkdown(path.join(dir, 'contracts'))) {
    moves.push({ from: path.join(dir, 'contracts', file), to: path.join(contractsDest, file) });
  }

  // Ghi
  for (const { dest, content } of specWrites) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, 'utf8');
  }
  for (const { from, to } of moves) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
  }
  fs.mkdirSync(paths.history, { recursive: true });
  fs.renameSync(dir, historyDir);

  console.log(`[speckit-ai] ✅ Done: ${workName}`);
  for (const slug of targetSlugs) {
    console.log(`[speckit-ai]   → specs/features/${slug}/spec.md`);
  }
  console.log(`[speckit-ai]   → work files kept in ${path.relative(targetDir, historyDir)}`);
  if (skipped.length > 0) {
    console.log(`[speckit-ai] ⚠️  Bypassed with --force: ${skipped.join(', ')}`);
  }

  return { name: workName, features: targetSlugs, historyDir, skipped };
}

module.exports = { checkWork, finishWork, findPlaceholders };
