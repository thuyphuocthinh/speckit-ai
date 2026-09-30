'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { checkWork, finishWork, findPlaceholders } = require('../src/done');
const { sha256 } = require('../src/features');

const VALID_SPEC = `# Spec: Refund

## Overview

Customers can refund an order.

## Acceptance Criteria

### AC-1: Refund works
Given a paid order
When the customer requests a refund
Then the money is returned

## Open Questions

- [x] Partial refunds? Yes.

## Changelog

<!-- Lines are appended by \`speckit-ai done\`. -->
`;

const VALID_TASKS = `# Tasks: Refund

## Phase 1: Setup

- [x] Create module

## Phase 4: Tests

- [x] Add tests
`;

const VALID_REVIEW = `# Review

## 5a. Code Review

OK

## 5b. Test Review

OK
`;

describe('done.js', () => {
  let tmpDir;
  const today = new Date().toISOString().split('T')[0];

  function write(rel, content = '# x\n') {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
    return full;
  }

  function read(rel) {
    return fs.readFileSync(path.join(tmpDir, rel), 'utf8');
  }

  function exists(rel) {
    return fs.existsSync(path.join(tmpDir, rel));
  }

  /** Ảnh chụp toàn bộ cây thư mục (đường dẫn + nội dung) để so sánh trước/sau. */
  function snapshot() {
    const out = {};
    (function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          out[path.relative(tmpDir, full)] = '<dir>';
          walk(full);
        } else {
          out[path.relative(tmpDir, full)] = fs.readFileSync(full, 'utf8');
        }
      }
    })(tmpDir);
    return out;
  }

  /** Tạo một việc hợp lệ; targets: { slug: { content, baseline } } (baseline=true thì tạo spec gốc). */
  function setupWork(name, targets = { refund: { content: VALID_SPEC, baseline: false } }, extras = {}) {
    const base = `specs/active/${name}`;
    const workTargets = {};
    for (const [slug, t] of Object.entries(targets)) {
      write(`${base}/targets/${slug}.md`, t.content);
      if (t.baseline) {
        const specPath = write(`specs/features/${slug}/spec.md`, t.baselineContent || '# Spec: Old\n');
        workTargets[slug] = sha256(specPath);
      } else {
        workTargets[slug] = null;
      }
    }
    write(`${base}/work.json`, JSON.stringify({ targets: workTargets }));
    write(`${base}/proposal.md`, extras.proposal || '# Proposal: Refund\n\n> **Affects**: refund\n\n## Why\n\nCustomers need refunds.\n');
    write(`${base}/tasks.md`, extras.tasks || VALID_TASKS);
    write(`${base}/review.md`, extras.review || VALID_REVIEW);
  }

  function codes(name) {
    return checkWork(tmpDir, name).errors.map((e) => e.code);
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-done-'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('findPlaceholders()', () => {
    test('tìm placeholder <...> chưa điền', () => {
      expect(findPlaceholders('# Spec: <Feature Name>\nAs a <role>')).toEqual(['<Feature Name>', '<role>']);
    });

    test('bỏ qua code block, inline code, comment HTML và thẻ HTML thường gặp', () => {
      const content = [
        '```',
        '<Generic>',
        '```',
        'Use `<T>` here',
        '<!-- <hidden> -->',
        'Line<br>break and <a href="x">link</a>',
      ].join('\n');
      expect(findPlaceholders(content)).toEqual([]);
    });
  });

  describe('checkWork()', () => {
    test('AC-6: báo lỗi nếu không có việc active', () => {
      expect(() => checkWork(tmpDir)).toThrow('No active work found');
    });

    test('AC-7: việc hợp lệ không có lỗi', () => {
      setupWork('refund');
      expect(checkWork(tmpDir).errors).toEqual([]);
    });

    test('AC-7: báo Open Questions còn mục chưa giải quyết', () => {
      setupWork('refund', { refund: { content: VALID_SPEC.replace('- [x] Partial', '- [ ] Partial') } });
      expect(codes()).toEqual(['open-questions']);
    });

    test('AC-7: báo AC không theo dạng ### AC-n:', () => {
      setupWork('refund', { refund: { content: VALID_SPEC.replace('### AC-1: Refund works', '- [ ] Refund works') } });
      expect(codes()).toEqual(['ac-format']);
    });

    test('AC-7: báo placeholder chưa điền', () => {
      setupWork('refund', { refund: { content: VALID_SPEC.replace('Customers can refund an order.', '<Brief description>') } });
      const { errors } = checkWork(tmpDir);
      expect(errors.map((e) => e.code)).toEqual(['placeholders']);
      expect(errors[0].message).toContain('<Brief description>');
    });

    test('AC-7: báo tasks chưa tick, tasks chưa có mục hoàn tất, và thiếu phase Tests', () => {
      setupWork('refund', undefined, { tasks: '# Tasks\n\n## Phase 4: Tests\n\n- [ ] a\n' });
      expect(codes()).toEqual(['tasks']);
      expect(checkWork(tmpDir).errors[0].message).toContain('1 unfinished');

      write('specs/active/refund/tasks.md', '# Tasks\n\n## Phase 4: Tests\n');
      expect(checkWork(tmpDir).errors[0].message).toContain('no completed tasks');

      write('specs/active/refund/tasks.md', '# Tasks\n\n## Phase 1: Setup\n\n- [x] a\n');
      expect(checkWork(tmpDir).errors[0].message).toContain('no Tests phase');
    });

    test('AC-7: bỏ qua checkbox nằm trong phần Handoff Session', () => {
      setupWork('refund', undefined, { tasks: `${VALID_TASKS}\n## 🔄 Handoff Session (now)\n\n- [ ] next dev should do X\n` });
      expect(codes()).toEqual([]);
    });

    test('AC-7: báo thiếu hoặc rỗng review.md', () => {
      setupWork('refund');
      fs.unlinkSync(path.join(tmpDir, 'specs/active/refund/review.md'));
      expect(codes()).toEqual(['review']);

      write('specs/active/refund/review.md', '  \n');
      expect(codes()).toEqual(['review']);
    });

    test('AC-7: báo tham chiếu Decisions/Contracts không tồn tại, và chấp nhận khi có', () => {
      const spec = VALID_SPEC.replace('# Spec: Refund\n', '# Spec: Refund\n\n> **Decisions**: 0003\n> **Contracts**: refund-api\n');
      setupWork('refund', { refund: { content: spec } });
      expect(codes()).toEqual(['references', 'references']);

      write('specs/decisions/0003-use-jwt.md');
      write('specs/contracts/refund-api.md');
      expect(codes()).toEqual([]);
    });

    test('AC-8: báo baseline đã đổi kể từ lúc start', () => {
      setupWork('token', { auth: { content: VALID_SPEC, baseline: true } });
      write('specs/features/auth/spec.md', '# Spec: Auth\nsomeone edited me\n');

      const { errors } = checkWork(tmpDir);
      expect(errors.map((e) => e.code)).toEqual(['baseline']);
      expect(errors[0].message).toContain('changed since this work started');
    });

    test('feature mới nhưng specs/features/<slug>/spec.md đã tồn tại thì không cho --force', () => {
      setupWork('refund');
      write('specs/features/refund/spec.md', 'exists');

      const { errors } = checkWork(tmpDir);
      expect(errors.map((e) => e.code)).toEqual(['baseline-exists']);
      expect(errors[0].forceable).toBe(false);
    });

    test('contract trùng tên file đã có ở đích thì không cho --force', () => {
      setupWork('refund');
      write('specs/active/refund/contracts/refund-api.md');
      write('specs/features/refund/contracts/refund-api.md');

      const { errors } = checkWork(tmpDir);
      expect(errors.map((e) => e.code)).toEqual(['contract-exists']);
      expect(errors[0].forceable).toBe(false);
    });

    test('thiếu work.json thì báo lỗi không thể bỏ qua', () => {
      write('specs/active/refund/targets/refund.md', VALID_SPEC);

      const { errors } = checkWork(tmpDir);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({ code: 'work-json', forceable: false });
    });
  });

  describe('finishWork() - kiểm tra', () => {
    test('AC-7: liệt kê mọi lý do, không ghi/xóa/di chuyển gì', () => {
      setupWork('refund', { refund: { content: VALID_SPEC.replace('- [x] Partial', '- [ ] Partial') } }, { tasks: '# Tasks\n' });
      const before = snapshot();

      expect(() => finishWork(tmpDir)).toThrow(/unresolved item\(s\) under "Open Questions"[\s\S]*tasks\.md has no completed tasks[\s\S]*Use --force/);

      expect(snapshot()).toEqual(before);
    });

    test('AC-7: --force bỏ qua lỗi bỏ qua được và ghi vào Changelog', () => {
      setupWork('refund', { refund: { content: VALID_SPEC.replace('- [x] Partial', '- [ ] Partial') } }, { tasks: '# Tasks\n\n## Tests\n\n- [x] a\n- [ ] b\n' });

      const res = finishWork(tmpDir, { force: true });

      expect(res.skipped).toEqual(['open-questions', 'tasks']);
      expect(read('specs/features/refund/spec.md')).toContain('forced: open-questions, tasks');
    });

    test('AC-7: --force không vượt qua lỗi không thể bỏ qua', () => {
      setupWork('refund');
      write('specs/features/refund/spec.md', 'exists');
      const before = snapshot();

      expect(() => finishWork(tmpDir, { force: true })).toThrow(/already exists/);

      expect(snapshot()).toEqual(before);
    });
  });

  describe('finishWork() - đóng gói', () => {
    test('AC-8: feature mới được ghi vào specs/features/<slug>/spec.md kèm dòng Changelog', () => {
      setupWork('refund');

      const res = finishWork(tmpDir);

      expect(res.features).toEqual(['refund']);
      const spec = read('specs/features/refund/spec.md');
      expect(spec).toContain('### AC-1: Refund works');
      expect(spec).toContain(
        `- ${today} · refund · Customers need refunds. · review: code, test · chi tiết: .history/${today}-refund`
      );
      expect(spec).not.toContain('forced');
    });

    test('AC-9: thư mục active được đổi tên vào .history, giữ nguyên file làm việc', () => {
      setupWork('refund');

      finishWork(tmpDir);

      expect(exists('specs/active/refund')).toBe(false);
      for (const f of ['proposal.md', 'tasks.md', 'review.md', 'work.json', 'targets/refund.md']) {
        expect(exists(`specs/.history/${today}-refund/${f}`)).toBe(true);
      }
    });

    test('AC-9: .history trùng tên thì thêm hậu tố -2', () => {
      write(`specs/.history/${today}-refund/old.md`);
      setupWork('refund');

      finishWork(tmpDir);

      expect(exists(`specs/.history/${today}-refund/old.md`)).toBe(true);
      expect(exists(`specs/.history/${today}-refund-2/proposal.md`)).toBe(true);
      expect(read('specs/features/refund/spec.md')).toContain(`.history/${today}-refund-2`);
    });

    test('AC-8: sửa feature có sẵn khi hash khớp thì thay spec và thêm Changelog vào cuối lịch sử', () => {
      const baseline = VALID_SPEC.replace('Customers can refund an order.', 'Original.') + '- 2026-01-01 · first · Original · review: code · chi tiết: .history/2026-01-01-first\n';
      setupWork('refund-v2', { refund: { content: VALID_SPEC.replace('Customers can refund an order.', 'Updated.') + '- 2026-01-01 · first · Original · review: code · chi tiết: .history/2026-01-01-first\n', baseline: true, baselineContent: baseline } });

      finishWork(tmpDir);

      const spec = read('specs/features/refund/spec.md');
      expect(spec).toContain('Updated.');
      expect(spec).not.toContain('Original.');
      const lines = spec.trim().split('\n');
      expect(lines[lines.length - 2]).toContain('2026-01-01 · first');
      expect(lines[lines.length - 1]).toContain(`${today} · refund-v2`);
    });

    test('AC-8: nhiều target (sửa xuyên feature) đều được ghi và mỗi spec có dòng Changelog', () => {
      setupWork('token', {
        auth: { content: VALID_SPEC.replace('Refund', 'Auth'), baseline: true },
        order: { content: VALID_SPEC.replace('Refund', 'Order'), baseline: true },
      });

      const res = finishWork(tmpDir);

      expect(res.features).toEqual(['auth', 'order']);
      for (const slug of ['auth', 'order']) {
        expect(read(`specs/features/${slug}/spec.md`)).toContain(`${today} · token`);
      }
    });

    test('AC-8: một target lệch hash thì không target nào được ghi', () => {
      setupWork('token', {
        auth: { content: VALID_SPEC.replace('Refund', 'Auth'), baseline: true },
        order: { content: VALID_SPEC.replace('Refund', 'Order'), baseline: true },
      });
      write('specs/features/order/spec.md', '# Spec: Order\nedited elsewhere\n');
      const before = snapshot();

      expect(() => finishWork(tmpDir)).toThrow(/specs\/features\/order\/spec\.md changed since this work started/);

      expect(snapshot()).toEqual(before);
    });

    test('AC-8: --force cho phép ghi đè khi hash lệch', () => {
      setupWork('token', { auth: { content: VALID_SPEC.replace('Refund', 'Auth'), baseline: true } });
      write('specs/features/auth/spec.md', '# Spec: Auth\nedited elsewhere\n');

      finishWork(tmpDir, { force: true });

      const spec = read('specs/features/auth/spec.md');
      expect(spec).toContain('### AC-1: Refund works');
      expect(spec).toContain('forced: baseline');
    });

    test('tạo section Changelog nếu target chưa có', () => {
      const noChangelog = VALID_SPEC.slice(0, VALID_SPEC.indexOf('## Changelog'));
      setupWork('refund', { refund: { content: noChangelog } });

      finishWork(tmpDir);

      expect(read('specs/features/refund/spec.md')).toMatch(/## Changelog\n\n- \d{4}-\d{2}-\d{2} · refund/);
    });

    test('proposal không có dòng nội dung thì Changelog dùng tên việc', () => {
      setupWork('refund', undefined, { proposal: '# Proposal: Refund\n\n## Why\n\n<Why?>\n' });

      finishWork(tmpDir);

      expect(read('specs/features/refund/spec.md')).toContain(`${today} · refund · refund · review:`);
    });

    test('hoạt động với file dùng xuống dòng CRLF (Windows)', () => {
      const crlf = (s) => s.replace(/\n/g, '\r\n');
      setupWork('refund', { refund: { content: crlf(VALID_SPEC) } }, {
        proposal: crlf('# Proposal: Refund\n\n## Why\n\nCustomers need refunds.\n'),
        tasks: crlf(VALID_TASKS),
        review: crlf(VALID_REVIEW),
      });
      expect(checkWork(tmpDir).errors).toEqual([]);

      finishWork(tmpDir);

      const spec = read('specs/features/refund/spec.md');
      expect(spec).toContain('\r\n');
      expect(spec).not.toMatch(/[^\r]\n/);
      expect(spec).toContain(`- ${today} · refund · Customers need refunds.`);
    });

    test('review.md không nhắc loại review nào thì ghi review.md', () => {
      setupWork('refund', undefined, { review: '# Notes\n\nAll good.\n' });

      finishWork(tmpDir);

      expect(read('specs/features/refund/spec.md')).toContain('review: review.md');
    });
  });

  describe('finishWork() - ADR và contract', () => {
    test('AC-10: việc một target chuyển ADR vào feature và đánh số lại theo thư mục đích', () => {
      setupWork('refund');
      write('specs/features/refund/decisions/0001-existing.md');
      write('specs/active/refund/decisions/0001-use-saga.md');
      write('specs/active/refund/decisions/0002-use-outbox.md');

      finishWork(tmpDir);

      expect(exists('specs/features/refund/decisions/0002-use-saga.md')).toBe(true);
      expect(exists('specs/features/refund/decisions/0003-use-outbox.md')).toBe(true);
      expect(exists(`specs/.history/${today}-refund/decisions/0001-use-saga.md`)).toBe(false);
      expect(exists(`specs/.history/${today}-refund/decisions/0002-use-outbox.md`)).toBe(false);
    });

    test('AC-10: việc nhiều target chuyển ADR và contract vào thư mục chung', () => {
      setupWork('token', {
        auth: { content: VALID_SPEC.replace('Refund', 'Auth'), baseline: true },
        order: { content: VALID_SPEC.replace('Refund', 'Order'), baseline: true },
      });
      write('specs/decisions/0000-template.md');
      write('specs/decisions/0004-old.md');
      write('specs/active/token/decisions/0001-token-format.md');
      write('specs/active/token/contracts/token-api.md');

      finishWork(tmpDir);

      expect(exists('specs/decisions/0005-token-format.md')).toBe(true);
      expect(exists('specs/contracts/token-api.md')).toBe(true);
    });

    test('AC-10: việc một target chuyển contract vào feature', () => {
      setupWork('refund');
      write('specs/active/refund/contracts/refund-api.md', 'contract body');

      finishWork(tmpDir);

      expect(read('specs/features/refund/contracts/refund-api.md')).toBe('contract body');
    });
  });
});
