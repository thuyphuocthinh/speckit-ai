'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { scaffold } = require('../src/scaffolder');
const { HOOK_CONTENT, HOOK_MARKER } = require('../src/hook');
const { analyzeUpgrade, applyUpgrade, runUpgrade, findLegacy, MANAGED } = require('../src/upgrade');
const { run } = require('../src/cli');

describe('upgrade.js', () => {
  let tmpDir;

  const projectConfig = { type: 'single', framework: 'generic', packageManager: 'npm' };
  const OLD_WORKFLOW = '# SDD Workflow\n\nspecs/features/<name>/spec.md → plan.md → tasks.md → review.md → done/\n';

  function write(rel, content) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  const read = (rel) => fs.readFileSync(path.join(tmpDir, rel), 'utf8');
  const exists = (rel) => fs.existsSync(path.join(tmpDir, rel));
  const stateOf = (analysis, dest) => analysis.managed.find((m) => m.dest === dest).state;
  const output = () => console.log.mock.calls.map((c) => c.join(' ')).join('\n');

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-upgrade-'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('analyzeUpgrade()', () => {
    test('báo lỗi nếu project chưa được scaffold', () => {
      expect(() => analyzeUpgrade(tmpDir)).toThrow(/Nothing to upgrade/);
    });

    test('project vừa scaffold thì mọi file đều mới, không có gì cần làm', () => {
      scaffold({ targetDir: tmpDir, projectConfig });

      const analysis = analyzeUpgrade(tmpDir);

      expect(analysis.managed.map((m) => m.dest)).toEqual(MANAGED);
      expect(analysis.managed.every((m) => m.state === 'current')).toBe(true);
      expect(analysis.owned).toEqual([]);
      expect(analysis.legacy).toEqual([]);
    });

    test('file do tool sở hữu khác template hiện tại thì là outdated, thiếu thì là missing', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW);
      fs.unlinkSync(path.join(tmpDir, 'specs', 'ideas', '_template.md'));

      const analysis = analyzeUpgrade(tmpDir);

      expect(stateOf(analysis, 'specs/_workflow.md')).toBe('outdated');
      expect(stateOf(analysis, 'specs/ideas/_template.md')).toBe('missing');
      expect(stateOf(analysis, 'specs/_template.md')).toBe('current');
    });

    test('khác biệt chỉ ở kiểu xuống dòng (CRLF/LF) không bị coi là outdated', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', read('specs/_workflow.md').replace(/\r?\n/g, '\r\n'));

      expect(stateOf(analyzeUpgrade(tmpDir), 'specs/_workflow.md')).toBe('current');
    });

    test('file do người dùng sở hữu: liệt kê dòng workflow còn thiếu của template mới', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('.agents/AGENTS.md', '# My agents\n\n- Always be nice\n- Before starting a new feature → create a spec at `specs/features/<name>/` first\n');
      write('docs/README.md', '# Docs\n\nSee specs/features/<name>/spec.md → plan.md\n');

      const { owned } = analyzeUpgrade(tmpDir);

      const agents = owned.find((o) => o.dest === '.agents/AGENTS.md');
      expect(agents.missingLines.join('\n')).toContain('npx speckit-ai start');
      expect(agents.missingLines.join('\n')).toContain('specs/.history/');
      expect(agents.missingLines.join('\n')).not.toContain('Always be nice');
      expect(owned.some((o) => o.dest === 'docs/README.md')).toBe(true);
    });

    test('tôn trọng templatesDir tùy chỉnh trong .speckitrc', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('my-templates/_core/specs-workflow.md.tmpl', '# Company workflow\n');
      write('.speckitrc', JSON.stringify({ templatesDir: './my-templates' }));

      const analysis = analyzeUpgrade(tmpDir);

      expect(stateOf(analysis, 'specs/_workflow.md')).toBe('outdated');
      expect(analysis.expected.get('specs/_workflow.md')).toBe('# Company workflow\n');
    });
  });

  describe('applyUpgrade()', () => {
    test('AC-19: ghi bản mới, lưu bản cũ thành .bak và tạo file còn thiếu (không cần backup)', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW);
      fs.unlinkSync(path.join(tmpDir, 'specs', 'ideas', '_template.md'));

      const result = applyUpgrade(tmpDir, analyzeUpgrade(tmpDir));

      expect(result.written.sort()).toEqual(['specs/_workflow.md', 'specs/ideas/_template.md']);
      expect(result.backups).toEqual(['specs/_workflow.md.bak']);
      expect(read('specs/_workflow.md.bak')).toBe(OLD_WORKFLOW);
      expect(read('specs/_workflow.md')).toContain('speckit-ai start');
      expect(exists('specs/ideas/_template.md')).toBe(true);
      expect(exists('specs/ideas/_template.md.bak')).toBe(false);
    });

    test('chạy lại là idempotent: không ghi thêm và không tạo thêm .bak', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW);
      applyUpgrade(tmpDir, analyzeUpgrade(tmpDir));

      const second = applyUpgrade(tmpDir, analyzeUpgrade(tmpDir));

      expect(second).toEqual({ written: [], backups: [] });
      expect(exists('specs/_workflow.md.bak.1')).toBe(false);
    });

    test('không ghi đè .bak có sẵn mà dùng .bak.1, .bak.2', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md.bak', 'older backup');
      write('specs/_workflow.md', OLD_WORKFLOW);

      const result = applyUpgrade(tmpDir, analyzeUpgrade(tmpDir));

      expect(result.backups).toEqual(['specs/_workflow.md.bak.1']);
      expect(read('specs/_workflow.md.bak')).toBe('older backup');
      expect(read('specs/_workflow.md.bak.1')).toBe(OLD_WORKFLOW);
    });

    test('giữ kiểu xuống dòng CRLF của file cũ', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW.replace(/\n/g, '\r\n'));

      applyUpgrade(tmpDir, analyzeUpgrade(tmpDir));

      const updated = read('specs/_workflow.md');
      expect(updated).toContain('\r\n');
      expect(updated).not.toMatch(/[^\r]\n/);
    });

    test('không đụng vào file do người dùng sở hữu và bố cục cũ', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('.agents/AGENTS.md', '# mine\n');
      write('docs/adrs/0001-old.md', '# old adr\n');
      write('specs/features/done/orders/spec.md', '# Orders\n');
      write('changes/x/proposal.md', '# x\n');

      applyUpgrade(tmpDir, analyzeUpgrade(tmpDir));

      expect(read('.agents/AGENTS.md')).toBe('# mine\n');
      expect(read('docs/adrs/0001-old.md')).toBe('# old adr\n');
      expect(read('specs/features/done/orders/spec.md')).toBe('# Orders\n');
      expect(exists('changes/x/proposal.md')).toBe(true);
    });
  });

  describe('findLegacy()', () => {
    test('phát hiện bố cục và hook của bản 1.x', () => {
      write('specs/features/done/orders/spec.md', '# Orders\n');
      write('specs/features/auth/spec.md', '# Spec: Auth\n\n## Overview\n');
      write('specs/features/billing/spec.md', '# Spec: Billing\n\n## Changelog\n');
      write('changes/x/proposal.md', '# x\n');
      write('archive/y/proposal.md', '# y\n');
      write('docs/adrs/0001-old.md', '# old\n');
      write('.git/hooks/commit-msg', '#!/bin/sh\nnpx speckit-ai verify-commit "$1"\n');
      write('.git/hooks/pre-commit', `#!/bin/sh\n${HOOK_MARKER}\necho old behavior\n`);
      write('.speckitrc', JSON.stringify({ requireCommitPrefix: true }));

      const titles = findLegacy(tmpDir).map((i) => i.title).join('\n');

      expect(titles).toContain('specs/features/done/ (1 feature folder(s))');
      expect(titles).toContain('1 spec(s) in the old format');
      expect(titles).toContain('auth');
      expect(titles).not.toContain('billing');
      expect(titles).toContain('changes/');
      expect(titles).toContain('archive/');
      expect(titles).toContain('docs/adrs/');
      expect(titles).toContain('commit-msg from speckit-ai 1.x');
      expect(titles).toContain('pre-commit from an older speckit-ai');
      expect(titles).toContain('requireCommitPrefix in .speckitrc');
    });

    test('hook pre-commit hiện tại và hook của người khác không bị coi là cũ', () => {
      write('.git/hooks/pre-commit', HOOK_CONTENT);
      expect(findLegacy(tmpDir)).toEqual([]);

      write('.git/hooks/pre-commit', '#!/bin/sh\necho mine\n');
      expect(findLegacy(tmpDir)).toEqual([]);
    });
  });

  describe('runUpgrade()', () => {
    test('AC-19: mặc định chỉ báo cáo (dry run), không ghi gì', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW);

      runUpgrade(tmpDir);

      expect(read('specs/_workflow.md')).toBe(OLD_WORKFLOW);
      expect(exists('specs/_workflow.md.bak')).toBe(false);
      expect(output()).toContain('dry run');
      expect(output()).toContain('↻ outdated');
      expect(output()).toContain('npx speckit-ai upgrade --apply');
    });

    test('--apply ghi file và in danh sách backup', () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW);

      runUpgrade(tmpDir, { apply: true });

      expect(read('specs/_workflow.md')).toContain('speckit-ai start');
      expect(output()).toContain('backup  specs/_workflow.md.bak');
    });

    test('project đã mới hoàn toàn thì báo Everything is up to date', () => {
      scaffold({ targetDir: tmpDir, projectConfig });

      runUpgrade(tmpDir);

      expect(output()).toContain('Everything is up to date');
    });
  });

  describe('lệnh upgrade qua CLI', () => {
    test('AC-19: dry run rồi --apply; cờ lạ và --apply=giá trị bị từ chối; help nhắc upgrade', async () => {
      scaffold({ targetDir: tmpDir, projectConfig });
      write('specs/_workflow.md', OLD_WORKFLOW);

      expect(await run(['upgrade'], tmpDir)).toBe(0);
      expect(read('specs/_workflow.md')).toBe(OLD_WORKFLOW);

      expect(await run(['upgrade', '--aply'], tmpDir)).toBe(1);
      expect(console.error.mock.calls.map((c) => c[0]).join('\n')).toContain('Did you mean --apply?');

      expect(await run(['upgrade', '--apply=yes'], tmpDir)).toBe(1);
      expect(read('specs/_workflow.md')).toBe(OLD_WORKFLOW);

      expect(await run(['upgrade', '--apply'], tmpDir)).toBe(0);
      expect(read('specs/_workflow.md')).toContain('speckit-ai start');

      console.log.mockClear();
      await run(['--help'], tmpDir);
      expect(output()).toContain('upgrade [--apply]');
    });

    test('project chưa scaffold thì upgrade trả về lỗi', async () => {
      expect(await run(['upgrade'], tmpDir)).toBe(1);
      expect(console.error.mock.calls.map((c) => c[0]).join('\n')).toContain('Nothing to upgrade');
    });
  });
});
