'use strict';

const fs = require('fs');
const path = require('path');
const {
  toKebabCase,
  getPaths,
  parseMeta,
  setMeta,
  parseList,
  sha256,
  listActive,
  listFeatures,
  listIdeas,
  orderIdeas,
} = require('./features');

/**
 * Tạo một ý tưởng mới tại specs/ideas/<slug>.md từ specs/ideas/_template.md.
 * @returns {string} đường dẫn file vừa tạo
 */
function createIdea(title, targetDir = process.cwd()) {
  if (!title) {
    throw new Error('Title is required. Example: speckit-ai idea "Order refund"');
  }

  const slug = toKebabCase(title);
  if (!slug) {
    throw new Error(`Title "${title}" does not produce a valid name.`);
  }

  const { ideas } = getPaths(targetDir);
  const tmplPath = path.join(ideas, '_template.md');
  const destPath = path.join(ideas, `${slug}.md`);

  if (!fs.existsSync(tmplPath)) {
    throw new Error(`Template not found at ${path.relative(targetDir, tmplPath)}. Did you run 'npx speckit-ai' to initialize the project first?`);
  }

  if (fs.existsSync(destPath)) {
    throw new Error(`Idea already exists: ${path.relative(targetDir, destPath)}`);
  }

  const content = fs.readFileSync(tmplPath, 'utf8').replace(/^#\s+.+/m, `# Idea: ${title}`);
  fs.mkdirSync(ideas, { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');

  console.log(`[speckit-ai] ✅ Created idea: ${path.relative(targetDir, destPath)}`);
  return destPath;
}

/**
 * Tổng hợp trạng thái: việc đang làm, ý tưởng theo thứ tự phụ thuộc, feature đã xong.
 * @throws nếu các ý tưởng phụ thuộc vòng
 */
function getStatus(targetDir = process.cwd()) {
  const features = listFeatures(targetDir);
  const { ordered, cycle } = orderIdeas(listIdeas(targetDir), features);

  if (cycle) {
    throw new Error(`Dependency cycle between ideas: ${cycle.join(' → ')}`);
  }

  return {
    active: listActive(targetDir),
    ideas: ordered.map(({ idea, blockedBy }) => ({
      slug: idea.slug,
      title: idea.title,
      dependsOn: idea.dependsOn,
      affects: idea.affects,
      blockedBy,
    })),
    features,
  };
}

/**
 * In trạng thái ra console (dạng chữ hoặc JSON).
 * @returns {object} dữ liệu trạng thái
 */
function printStatus(targetDir = process.cwd(), { json = false } = {}) {
  const status = getStatus(targetDir);

  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return status;
  }

  console.log(`[speckit-ai] Active (${status.active.length}):`);
  for (const name of status.active) console.log(`  ● ${name}`);

  console.log(`[speckit-ai] Ideas (${status.ideas.length}), in dependency order:`);
  status.ideas.forEach((idea, i) => {
    const blocked = idea.blockedBy.length > 0 ? `  (blocked by: ${idea.blockedBy.join(', ')})` : '';
    console.log(`  ${i + 1}. ${idea.slug}${blocked}`);
  });

  console.log(`[speckit-ai] Features done (${status.features.length}):`);
  for (const slug of status.features) console.log(`  ✓ ${slug}`);

  return status;
}

const TASKS_SKELETON = (title) => `# Tasks: ${title}

## Phase 1: Setup

## Phase 2: Logic

## Phase 3: UI / API

## Phase 4: Tests
`;

const PROPOSAL_SKELETON = (title) => `# Proposal: ${title}

## Why

<Why are we making this change?>

## What

<What will change, at a high level?>
`;

/**
 * Mở một việc mới trong specs/active/<tên>/.
 * - `input` là tên một ý tưởng trong specs/ideas/ (ý tưởng được chuyển thành proposal) hoặc một tiêu đề mới.
 * - Không có `affects`: tạo feature mới (targets/<tên>.md từ template spec).
 * - Có `affects`: copy spec của các feature đó vào targets/ và ghi sha256 gốc vào work.json.
 * Mọi kiểm tra chạy xong trước khi ghi bất cứ thứ gì.
 * @returns {{ name: string, dir: string }}
 */
function startWork(input, { affects = [] } = {}, targetDir = process.cwd()) {
  if (!input) {
    throw new Error('Title is required. Example: speckit-ai start "Add 2FA" --affects=auth');
  }

  const name = toKebabCase(input);
  if (!name) {
    throw new Error(`Title "${input}" does not produce a valid name.`);
  }

  const paths = getPaths(targetDir);
  const workDir = path.join(paths.active, name);
  if (fs.existsSync(workDir)) {
    throw new Error(`Active work already exists: ${name}`);
  }

  // Ý tưởng cùng tên (nếu có) là nguồn của proposal
  const ideaFile = path.join(paths.ideas, `${name}.md`);
  const idea = fs.existsSync(ideaFile) ? fs.readFileSync(ideaFile, 'utf8') : null;
  let title = input.trim();
  if (idea) {
    const titleMatch = idea.match(/^#\s+(?:Idea:\s*)?(.+)$/m);
    title = titleMatch ? titleMatch[1].trim() : name;
  }

  let affected = affects.map(toKebabCase).filter(Boolean);
  if (affected.length === 0 && idea) affected = parseList(parseMeta(idea).affects);
  affected = [...new Set(affected)];

  const missing = affected.filter((slug) => !fs.existsSync(path.join(paths.features, slug, 'spec.md')));
  if (missing.length > 0) {
    throw new Error(`Feature(s) not found in specs/features/: ${missing.join(', ')}`);
  }

  // targets: slug -> { content, hash } (hash = null nghĩa là feature mới, chưa có bản gốc)
  const targets = {};
  if (affected.length > 0) {
    for (const slug of affected) {
      const specPath = path.join(paths.features, slug, 'spec.md');
      targets[slug] = { content: fs.readFileSync(specPath, 'utf8'), hash: sha256(specPath) };
    }
  } else {
    if (fs.existsSync(path.join(paths.features, name, 'spec.md'))) {
      throw new Error(`Feature "${name}" already exists. To change it run: speckit-ai start "<title>" --affects=${name}`);
    }
    const tmplPath = path.join(paths.specs, '_template.md');
    if (!fs.existsSync(tmplPath)) {
      throw new Error(`Template not found at ${path.relative(targetDir, tmplPath)}. Did you run 'npx speckit-ai' to initialize the project first?`);
    }
    targets[name] = {
      content: fs.readFileSync(tmplPath, 'utf8').replace(/^#\s+.+/m, `# Spec: ${title}`),
      hash: null,
    };
  }

  const affectsValue = Object.keys(targets).join(', ');
  const proposalBase = idea ? idea.replace(/^#\s+.+/m, `# Proposal: ${title}`) : PROPOSAL_SKELETON(title);
  const proposal = setMeta(proposalBase, 'Affects', affectsValue);
  const workJson = { targets: Object.fromEntries(Object.entries(targets).map(([slug, t]) => [slug, t.hash])) };

  try {
    fs.mkdirSync(path.join(workDir, 'targets'), { recursive: true });
    fs.writeFileSync(path.join(workDir, 'proposal.md'), proposal, 'utf8');
    fs.writeFileSync(path.join(workDir, 'tasks.md'), TASKS_SKELETON(title), 'utf8');
    for (const [slug, target] of Object.entries(targets)) {
      fs.writeFileSync(path.join(workDir, 'targets', `${slug}.md`), target.content, 'utf8');
    }
    fs.writeFileSync(path.join(workDir, 'work.json'), JSON.stringify(workJson, null, 2) + '\n', 'utf8');
  } catch (err) {
    fs.rmSync(workDir, { recursive: true, force: true }); // chỉ xóa thư mục vừa tạo dở
    throw err;
  }

  if (idea) fs.unlinkSync(ideaFile);

  console.log(`[speckit-ai] ✅ Started: ${path.relative(targetDir, workDir)}`);
  console.log(`[speckit-ai] 👉 Edit targets/*.md, then plan → tasks → code → review. Finish with: speckit-ai done`);
  return { name, dir: workDir };
}

module.exports = { createIdea, startWork, getStatus, printStatus };
