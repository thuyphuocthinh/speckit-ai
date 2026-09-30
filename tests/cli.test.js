'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { run, parseArgs, HELP } = require('../src/cli');

describe('cli.js', () => {
  let tmpDir;

  function write(rel, content) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  function exists(rel) {
    return fs.existsSync(path.join(tmpDir, rel));
  }

  function output() {
    return [...console.log.mock.calls, ...console.error.mock.calls].map((c) => c.join(' ')).join('\n');
  }

  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-cli-'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('parseArgs()', () => {
    test('tách positional và flags, giá trị có dấu = được giữ nguyên', () => {
      expect(parseArgs(['start', 'Add 2FA', '--affects=auth,order', '--force', '--ref=a=b'])).toEqual({
        positional: ['start', 'Add 2FA'],
        flags: { affects: 'auth,order', force: true, ref: 'a=b' },
      });
    });

    test('-h là help', () => {
      expect(parseArgs(['-h']).flags.help).toBe(true);
    });
  });

  describe('AC-14: help và lệnh cũ', () => {
    test('--help liệt kê lệnh mới và cờ mới, không còn lệnh cũ', async () => {
      const code = await run(['--help'], tmpDir);

      expect(code).toBe(0);
      const text = output();
      for (const expected of ['idea', 'start', 'done', 'status', '--affects', '--force', '--for', '--work', '--init-hook', 'handoff', 'review', 'serve', 'lint']) {
        expect(text).toContain(expected);
      }
      for (const removed of ['propose', 'archive', 'verify-commit', '--target', 'generate feature']) {
        expect(HELP).not.toContain(removed);
      }
    });

    test('-h cũng in help và không chạy lệnh', async () => {
      expect(await run(['lint', '-h'], tmpDir)).toBe(0);
      expect(output()).not.toContain('Linting specs');
    });

    test.each(['propose', 'archive', 'verify-commit', 'foo'])('lệnh "%s" bị từ chối và không scaffold gì', async (cmd) => {
      const code = await run([cmd, 'x'], tmpDir);

      expect(code).toBe(1);
      expect(output()).toContain(`Unknown command: ${cmd}`);
      expect(fs.readdirSync(tmpDir)).toEqual([]);
    });

    test('generate feature không còn được hỗ trợ', async () => {
      expect(await run(['generate', 'feature', 'X'], tmpDir)).toBe(1);
      expect(output()).toContain('Unknown type: feature');
    });

    test('generate thiếu type thì báo lỗi', async () => {
      expect(await run(['generate'], tmpDir)).toBe(1);
      expect(output()).toContain('Type is required');
    });
  });

  describe('scaffold và cờ', () => {
    test('--mode không hợp lệ thì trả về 1 và không tạo gì', async () => {
      expect(await run(['--mode=bogus'], tmpDir)).toBe(1);
      expect(output()).toContain('Invalid --mode="bogus"');
      expect(fs.readdirSync(tmpDir)).toEqual([]);
    });

    test('AC-13: chạy mặc định tạo bố cục mới', async () => {
      expect(await run([], tmpDir)).toBe(0);
      expect(exists('specs/ideas/_template.md')).toBe(true);
      expect(exists('specs/decisions/0000-template.md')).toBe(true);
      expect(exists('specs/active')).toBe(true);
    });

    test('cờ thiếu giá trị thì báo lỗi rõ', async () => {
      expect(await run(['start', 'X', '--affects'], tmpDir)).toBe(1);
      expect(output()).toContain('--affects requires a value');
    });

    test('AC-12: --init-hook không có .git thì trả về 1; có .git/hooks thì cài pre-commit chạy lint', async () => {
      expect(await run(['--init-hook'], tmpDir)).toBe(1);

      fs.mkdirSync(path.join(tmpDir, '.git', 'hooks'), { recursive: true });
      expect(await run(['--init-hook'], tmpDir)).toBe(0);
      expect(fs.readFileSync(path.join(tmpDir, '.git', 'hooks', 'pre-commit'), 'utf8')).toContain('npx speckit-ai lint');
    });
  });

  describe('flow idea → start → done', () => {
    const SPEC = [
      '# Spec: Refund',
      '',
      '## Overview',
      '',
      'Customers can refund an order.',
      '',
      '## Feature Type',
      '',
      '- [x] Feature with API / business logic',
      '',
      '## User Stories',
      '',
      '- As a customer, I want a refund so that I get my money back',
      '',
      '## Acceptance Criteria',
      '',
      '### AC-1: Refund works',
      'Given a paid order',
      'When I request a refund',
      'Then the money is returned',
      '',
      '## Technical Constraints',
      '',
      '- None',
      '',
      '## Out of Scope',
      '',
      '- Partial refunds',
      '',
      '## Open Questions',
      '',
      '- [x] Currency? Same as order.',
      '',
      '## Changelog',
      '',
    ].join('\n');

    test('đi hết flow: idea, status, start, generate tests, lint, done', async () => {
      await run([], tmpDir); // scaffold

      expect(await run(['idea', 'Refund'], tmpDir)).toBe(0);
      expect(exists('specs/ideas/refund.md')).toBe(true);

      console.log.mockClear();
      expect(await run(['status', '--json'], tmpDir)).toBe(0);
      expect(JSON.parse(console.log.mock.calls[0][0]).ideas.map((i) => i.slug)).toEqual(['refund']);

      expect(await run(['start', 'refund'], tmpDir)).toBe(0);
      expect(exists('specs/ideas/refund.md')).toBe(false);
      expect(exists('specs/active/refund/targets/refund.md')).toBe(true);

      // Chưa điền spec: done bị chặn và không đổi gì
      expect(await run(['done'], tmpDir)).toBe(1);
      expect(output()).toContain('Cannot finish "refund"');
      expect(exists('specs/active/refund')).toBe(true);
      expect(exists('specs/features/refund')).toBe(false);

      write('specs/active/refund/targets/refund.md', SPEC);
      expect(await run(['generate', 'tests'], tmpDir)).toBe(0);
      expect(exists('tests/specs/spec-refund.test.js')).toBe(true);

      expect(await run(['generate', 'adr', 'Use saga'], tmpDir)).toBe(0);
      expect(exists('specs/active/refund/decisions/0001-use-saga.md')).toBe(true);

      write('specs/active/refund/tasks.md', '# Tasks\n\n## Phase 4: Tests\n\n- [x] Add tests\n');
      write('specs/active/refund/review.md', '# Review\n\n## 5a. Code Review\n\nOK\n');

      // Spec đã điền đầy đủ và ADR sinh từ template đều qua lint
      expect(await run(['lint'], tmpDir)).toBe(0);
    });

    test('done thành công: spec vào features, ADR chuyển theo feature, work vào .history', async () => {
      await run([], tmpDir);
      await run(['start', 'Refund'], tmpDir);
      write('specs/active/refund/targets/refund.md', SPEC);
      write('specs/active/refund/tasks.md', '# Tasks\n\n## Phase 4: Tests\n\n- [x] Add tests\n');
      write('specs/active/refund/review.md', '# Review\n\n## 5a. Code Review\n\nOK\n');
      await run(['generate', 'adr', 'Use saga'], tmpDir);

      expect(await run(['done'], tmpDir)).toBe(0);

      expect(fs.readFileSync(path.join(tmpDir, 'specs/features/refund/spec.md'), 'utf8')).toContain(`${today} · refund`);
      expect(exists('specs/features/refund/decisions/0001-use-saga.md')).toBe(true);
      expect(exists(`specs/.history/${today}-refund/proposal.md`)).toBe(true);
      expect(exists('specs/active/refund')).toBe(false);
    });

    test('AC-5/6: nhiều việc active thì các lệnh không đối số bắt buộc nêu tên', async () => {
      await run([], tmpDir);
      await run(['start', 'Feature A'], tmpDir);
      await run(['start', 'Fix token'], tmpDir);

      expect(await run(['done'], tmpDir)).toBe(1);
      expect(output()).toContain('Multiple active works found (feature-a, fix-token)');

      expect(await run(['start', 'Feature A'], tmpDir)).toBe(1);
      expect(output()).toContain('Active work already exists: feature-a');
    });
  });
});
