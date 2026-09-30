'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { scaffold, renderTemplate, writeFileIfNotExists, buildFileMap, formatFrameworkName } = require('../src/scaffolder');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-ai-docs-scaffolder-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- renderTemplate ---
describe('renderTemplate()', () => {
  test('replace đúng {{FRAMEWORK}}', () => {
    expect(renderTemplate('Hello {{FRAMEWORK}}', { FRAMEWORK: 'NestJS' })).toBe('Hello NestJS');
  });

  test('replace đúng {{PACKAGE_MANAGER}}', () => {
    expect(renderTemplate('pm: {{PACKAGE_MANAGER}}', { PACKAGE_MANAGER: 'yarn' })).toBe('pm: yarn');
  });

  test('replace nhiều placeholder cùng lúc', () => {
    const result = renderTemplate('{{FRAMEWORK}} uses {{PACKAGE_MANAGER}}', {
      FRAMEWORK: 'Vue 3',
      PACKAGE_MANAGER: 'pnpm',
    });
    expect(result).toBe('Vue 3 uses pnpm');
  });

  test('không crash khi template không có placeholder', () => {
    expect(renderTemplate('No placeholders here', {})).toBe('No placeholders here');
  });

  test('giữ nguyên {{KEY}} nếu key không có trong vars', () => {
    expect(renderTemplate('{{UNKNOWN}}', {})).toBe('{{UNKNOWN}}');
  });
});

// --- writeFileIfNotExists ---
describe('writeFileIfNotExists()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('tạo file mới, trả về "created"', () => {
    const filePath = path.join(tmpDir, 'test.md');
    const result = writeFileIfNotExists(filePath, 'content');
    expect(result).toBe('created');
    expect(fs.readFileSync(filePath, 'utf8')).toBe('content');
  });

  test('skip file đã tồn tại, trả về "skipped"', () => {
    const filePath = path.join(tmpDir, 'existing.md');
    fs.writeFileSync(filePath, 'original');
    const result = writeFileIfNotExists(filePath, 'new content');
    expect(result).toBe('skipped');
    expect(fs.readFileSync(filePath, 'utf8')).toBe('original'); // không bị ghi đè
  });

  test('tự tạo nested directory nếu chưa có', () => {
    const filePath = path.join(tmpDir, 'a', 'b', 'c', 'file.md');
    writeFileIfNotExists(filePath, 'nested');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

// --- buildFileMap ---
describe('buildFileMap()', () => {
  test('nestjs fileMap có đúng số lượng entry', () => {
    const map = buildFileMap('nestjs');
    expect(map.length).toBeGreaterThan(8);
  });

  test('generic fileMap có đúng số lượng entry', () => {
    const map = buildFileMap('generic');
    expect(map.length).toBeGreaterThan(8);
  });

  test('tất cả entry có trường tmpl và dest', () => {
    const map = buildFileMap('nextjs');
    for (const entry of map) {
      expect(entry).toHaveProperty('tmpl');
      expect(entry).toHaveProperty('dest');
    }
  });

  test('node-express fileMap không dùng generic/ template', () => {
    const map = buildFileMap('node-express');
    const frameworkEntries = map.filter(e => !e.tmpl.startsWith('_core/'));
    frameworkEntries.forEach(e => {
      expect(e.tmpl).not.toMatch(/^generic\//); // không fallback generic
    });
  });

  test('buildFileMap include project-overview.md', () => {
    const map = buildFileMap('nestjs');
    const dests = map.map(e => e.dest);
    expect(dests).toContain('docs/project-overview.md');
  });

  test('buildFileMap include coding-style.md', () => {
    const map = buildFileMap('vue');
    const dests = map.map(e => e.dest);
    expect(dests).toContain('docs/core-principles-and-coding-standards/coding-style.md');
  });


  test('buildFileMap include 3 SDD skill files', () => {
    const map = buildFileMap('nestjs');
    const dests = map.map(e => e.dest);
    expect(dests).toContain('.agents/skills/spec-create/SKILL.md');
    expect(dests).toContain('.agents/skills/spec-plan/SKILL.md');
    expect(dests).toContain('.agents/skills/spec-review/SKILL.md');
  });

  // --- mode=existing ---
  test('buildFileMap mode=existing dùng _existing/technology.md.tmpl', () => {
    const map = buildFileMap('nestjs', 'existing');
    const techEntry = map.find(e => e.dest === 'docs/technology.md');
    expect(techEntry.tmpl).toBe('_existing/technology.md.tmpl');
  });

  test('buildFileMap mode=existing dùng _existing/coding-conventions.md.tmpl', () => {
    const map = buildFileMap('vue', 'existing');
    const entry = map.find(e => e.dest === 'docs/core-principles-and-coding-standards/coding-conventions.md');
    expect(entry.tmpl).toBe('_existing/coding-conventions.md.tmpl');
  });

  test('buildFileMap mode=new vẫn dùng fw-specific template', () => {
    const map = buildFileMap('nestjs', 'new');
    const techEntry = map.find(e => e.dest === 'docs/technology.md');
    expect(techEntry.tmpl).toBe('nestjs/technology.md.tmpl');
  });

  test('buildFileMap mode=existing giữ nguyên _core/AGENTS.md.tmpl', () => {
    const map = buildFileMap('react', 'existing');
    const agentsEntry = map.find(e => e.dest === '.agents/AGENTS.md');
    expect(agentsEntry.tmpl).toBe('_core/AGENTS.md.tmpl'); // không đổi
  });
});

// --- scaffold (integration) ---
describe('scaffold()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('tạo .agents/AGENTS.md cho nestjs project', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' } });
    expect(fs.existsSync(path.join(tmpDir, '.agents', 'AGENTS.md'))).toBe(true);
  });

  test('tạo CLAUDE.md', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nextjs', packageManager: 'yarn' } });
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
  });

  test('tạo specs/_workflow.md', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'vue', packageManager: 'pnpm' } });
    expect(fs.existsSync(path.join(tmpDir, 'specs', '_workflow.md'))).toBe(true);
  });

  test('AC-13: tạo bố cục specs ideas/active/features/decisions/contracts', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' } });
    const specs = path.join(tmpDir, 'specs');
    expect(fs.existsSync(path.join(specs, 'ideas', '_template.md'))).toBe(true);
    expect(fs.existsSync(path.join(specs, 'active'))).toBe(true);
    expect(fs.existsSync(path.join(specs, 'features'))).toBe(true);
    expect(fs.existsSync(path.join(specs, 'decisions', '0000-template.md'))).toBe(true);
    expect(fs.existsSync(path.join(specs, 'contracts', '_template.md'))).toBe(true);
  });

  test('AC-13: không tạo docs/adrs, changes, archive, specs/features/done', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' } });
    expect(fs.existsSync(path.join(tmpDir, 'docs', 'adrs'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'changes'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'archive'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'specs', 'features', 'done'))).toBe(false);
  });

  test('AC-13: template spec có Changelog và AC dạng ### AC-n:', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' } });
    const content = fs.readFileSync(path.join(tmpDir, 'specs', '_template.md'), 'utf8');
    expect(content).toMatch(/^## Changelog$/m);
    expect(content).toMatch(/^### AC-1:/m);
  });

  test('AC-14/15: _workflow.md, AGENTS.md và skill mô tả flow mới, hotfix, và không còn lệnh cũ', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' } });
    const read = (...p) => fs.readFileSync(path.join(tmpDir, ...p), 'utf8');
    const workflow = read('specs', '_workflow.md');
    const agents = read('.agents', 'AGENTS.md');

    for (const cmd of ['speckit-ai idea', 'speckit-ai start', 'speckit-ai done', '--affects', 'Bugs and hotfixes', '.history']) {
      expect(workflow).toContain(cmd);
    }
    expect(agents).toContain('npx speckit-ai done');
    expect(agents).toContain('specs/.history/');

    const everything = [
      workflow,
      agents,
      read('docs', 'README.md'),
      read('.agents', 'skills', 'spec-create', 'SKILL.md'),
      read('.agents', 'skills', 'spec-plan', 'SKILL.md'),
      read('.agents', 'skills', 'spec-review', 'SKILL.md'),
      read('docs', 'core-principles-and-coding-standards', 'instructions-and-work-flows', 'adding-a-new-feature.md'),
    ].join('\n');
    for (const removed of ['propose', 'features/done', 'Move-Item', 'docs/adrs', 'delta-specs']) {
      expect(everything).not.toContain(removed);
    }
  });

  test('monorepo: specs/ chỉ tạo một lần ở root, không lặp theo sub-project', () => {
    scaffold({
      targetDir: tmpDir,
      projectConfig: {
        type: 'monorepo',
        tool: 'workspaces',
        subProjects: [{ name: 'api', framework: 'nestjs', packageManager: 'npm' }],
      },
    });
    expect(fs.existsSync(path.join(tmpDir, 'specs', 'decisions', '0000-template.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'docs', 'api', 'adrs'))).toBe(false);
  });

  test('AGENTS.md chứa tên framework đã render', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' } });
    const content = fs.readFileSync(path.join(tmpDir, '.agents', 'AGENTS.md'), 'utf8');
    expect(content).toContain('NestJS');
    expect(content).not.toContain('{{FRAMEWORK}}'); // không còn placeholder thô
  });

  test('skip file đã tồn tại, trả về skipped count đúng', () => {
    // Chạy lần đầu
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'react', packageManager: 'npm' } });
    // Chạy lần hai
    const { created, skipped } = scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'react', packageManager: 'npm' } });
    expect(skipped).toBeGreaterThan(0);
    expect(created).toBe(0);
  });

  // --- mode=existing integration ---
  test('mode=existing: docs/coding-conventions.md chứa AI-PROMPT', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' }, mode: 'existing' });
    const content = fs.readFileSync(
      path.join(tmpDir, 'docs', 'core-principles-and-coding-standards', 'coding-conventions.md'), 'utf8'
    );
    expect(content).toContain('AI-PROMPT');
  });

  test('mode=new: docs/coding-conventions.md không chứa AI-PROMPT', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' }, mode: 'new' });
    const content = fs.readFileSync(
      path.join(tmpDir, 'docs', 'core-principles-and-coding-standards', 'coding-conventions.md'), 'utf8'
    );
    expect(content).not.toContain('AI-PROMPT');
  });

  test('mode=existing: .agents/AGENTS.md vẫn được tạo', () => {
    scaffold({ targetDir: tmpDir, projectConfig: { type: 'single', framework: 'vue', packageManager: 'yarn' }, mode: 'existing' });
    expect(fs.existsSync(path.join(tmpDir, '.agents', 'AGENTS.md'))).toBe(true);
  });

  // --- Monorepo integration ---
  test('monorepo: tạo docs cho nhiều subProjects', () => {
    const projectConfig = {
      type: 'monorepo',
      subProjects: [
        { name: 'api', framework: 'nestjs', packageManager: 'pnpm' },
        { name: 'web', framework: 'nextjs', packageManager: 'pnpm' }
      ]
    };
    scaffold({ targetDir: tmpDir, projectConfig });
    
    // Root files
    expect(fs.existsSync(path.join(tmpDir, '.agents', 'AGENTS.md'))).toBe(true);
    // Sub files
    expect(fs.existsSync(path.join(tmpDir, 'docs', 'api', 'technology.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'docs', 'web', 'technology.md'))).toBe(true);
  });

  // --- Custom Templates integration ---
  test('sử dụng custom templates nếu được cấu hình', () => {
    // Tạo custom template
    const customTmplDir = path.join(tmpDir, 'my-templates');
    const customCoreDir = path.join(customTmplDir, '_core');
    fs.mkdirSync(customCoreDir, { recursive: true });
    fs.writeFileSync(path.join(customCoreDir, 'CLAUDE.md.tmpl'), 'This is a custom CLAUDE {{FRAMEWORK}}');

    scaffold({
      targetDir: tmpDir,
      projectConfig: { type: 'single', framework: 'nestjs', packageManager: 'npm' },
      customTemplatesDir: customTmplDir
    });

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    expect(content).toBe('This is a custom CLAUDE NestJS'); // Dùng custom
    // Các file không override (như AGENTS.md) vẫn đọc được từ default nhờ fallback
    expect(fs.existsSync(path.join(tmpDir, '.agents', 'AGENTS.md'))).toBe(true);
  });
});
