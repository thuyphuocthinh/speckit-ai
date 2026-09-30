'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createIdea, startWork, getStatus, printStatus } = require('../src/lifecycle');
const { sha256 } = require('../src/features');

const IDEA_TEMPLATE = '# Idea: <Title>\n\n> **Depends-on**:\n> **Affects**:\n\n## Problem\n\n<Why?>\n';

describe('lifecycle.js', () => {
  let tmpDir;

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

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-lifecycle-'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('createIdea()', () => {
    test('báo lỗi nếu thiếu title', () => {
      expect(() => createIdea('', tmpDir)).toThrow(/Title is required/);
    });

    test('báo lỗi nếu chưa có template ý tưởng', () => {
      expect(() => createIdea('Order refund', tmpDir)).toThrow(/Template not found/);
    });

    test('AC-2: tạo specs/ideas/<slug>.md với tiêu đề đã thay', () => {
      write('specs/ideas/_template.md', IDEA_TEMPLATE);

      const dest = createIdea('Refund đơn hàng', tmpDir);

      expect(dest).toBe(path.join(tmpDir, 'specs', 'ideas', 'refund-don-hang.md'));
      const content = read('specs/ideas/refund-don-hang.md');
      expect(content).toMatch(/^# Idea: Refund đơn hàng$/m);
      expect(content).toContain('> **Depends-on**:');
    });

    test('báo lỗi nếu ý tưởng đã tồn tại và không ghi đè', () => {
      write('specs/ideas/_template.md', IDEA_TEMPLATE);
      write('specs/ideas/refund.md', 'mine');

      expect(() => createIdea('Refund', tmpDir)).toThrow(/Idea already exists/);
      expect(read('specs/ideas/refund.md')).toBe('mine');
    });
  });

  describe('startWork()', () => {
    const SPEC_TEMPLATE = '# Spec: <Feature Name>\n\n> **Decisions**:\n\n## Overview\n\n<x>\n\n## Changelog\n';

    function setupProject() {
      write('specs/_template.md', SPEC_TEMPLATE);
      write('specs/ideas/_template.md', IDEA_TEMPLATE);
    }

    test('báo lỗi nếu thiếu tiêu đề', () => {
      expect(() => startWork('', {}, tmpDir)).toThrow(/Title is required/);
    });

    test('AC-3: tạo việc mới với proposal, tasks 4 phase, target từ template và work.json', () => {
      setupProject();

      const res = startWork('Refund đơn hàng', {}, tmpDir);

      expect(res.name).toBe('refund-don-hang');
      const base = 'specs/active/refund-don-hang';
      expect(read(`${base}/proposal.md`)).toMatch(/^# Proposal: Refund đơn hàng$/m);
      expect(read(`${base}/proposal.md`)).toContain('> **Affects**: refund-don-hang');
      const tasks = read(`${base}/tasks.md`);
      for (const phase of ['Phase 1: Setup', 'Phase 2: Logic', 'Phase 3: UI / API', 'Phase 4: Tests']) {
        expect(tasks).toContain(phase);
      }
      expect(read(`${base}/targets/refund-don-hang.md`)).toMatch(/^# Spec: Refund đơn hàng$/m);
      expect(JSON.parse(read(`${base}/work.json`))).toEqual({ targets: { 'refund-don-hang': null } });
    });

    test('AC-3: start từ ý tưởng dùng nội dung ý tưởng làm proposal và chuyển file ý tưởng đi', () => {
      setupProject();
      write('specs/ideas/refund.md', '# Idea: Refund\n\n> **Depends-on**: auth\n\n## Problem\n\nCustomers cannot refund.\n');

      startWork('refund', {}, tmpDir);

      const proposal = read('specs/active/refund/proposal.md');
      expect(proposal).toMatch(/^# Proposal: Refund$/m);
      expect(proposal).toContain('Customers cannot refund.');
      expect(proposal).toContain('> **Depends-on**: auth');
      expect(proposal).toContain('> **Affects**: refund');
      expect(exists('specs/ideas/refund.md')).toBe(false);
    });

    test('AC-4: --affects copy spec gốc vào targets/ và ghi sha256, không tạo feature mới', () => {
      setupProject();
      const authSpec = write('specs/features/auth/spec.md', '# Spec: Auth\nA\n');
      const orderSpec = write('specs/features/order/spec.md', '# Spec: Order\nO\n');

      startWork('Đổi cấu trúc token', { affects: ['auth', 'order'] }, tmpDir);

      const base = 'specs/active/doi-cau-truc-token';
      expect(read(`${base}/targets/auth.md`)).toBe('# Spec: Auth\nA\n');
      expect(read(`${base}/targets/order.md`)).toBe('# Spec: Order\nO\n');
      expect(exists(`${base}/targets/doi-cau-truc-token.md`)).toBe(false);
      expect(JSON.parse(read(`${base}/work.json`))).toEqual({
        targets: { auth: sha256(authSpec), order: sha256(orderSpec) },
      });
      expect(read(`${base}/proposal.md`)).toContain('> **Affects**: auth, order');
      expect(read('specs/features/auth/spec.md')).toBe('# Spec: Auth\nA\n');
    });

    test('AC-4: ý tưởng có Affects mà không truyền --affects thì dùng Affects của ý tưởng', () => {
      setupProject();
      write('specs/features/auth/spec.md', '# Spec: Auth\n');
      write('specs/ideas/add-2fa.md', '# Idea: Add 2FA\n\n> **Affects**: auth\n');

      startWork('add-2fa', {}, tmpDir);

      expect(exists('specs/active/add-2fa/targets/auth.md')).toBe(true);
      expect(exists('specs/active/add-2fa/targets/add-2fa.md')).toBe(false);
    });

    test('AC-4: feature không tồn tại thì dừng và không tạo/xóa gì', () => {
      setupProject();
      write('specs/features/auth/spec.md', '# Spec: Auth\n');
      write('specs/ideas/big.md', '# Idea: Big\n');

      expect(() => startWork('big', { affects: ['auth', 'ghost'] }, tmpDir)).toThrow(/not found in specs\/features\/: ghost/);

      expect(exists('specs/active')).toBe(false);
      expect(exists('specs/ideas/big.md')).toBe(true);
    });

    test('AC-5: cho phép nhiều việc, từ chối trùng tên', () => {
      setupProject();
      write('specs/features/auth/spec.md', '# Spec: Auth\n');

      startWork('Feature A', {}, tmpDir);
      startWork('Fix token', { affects: ['auth'] }, tmpDir);

      expect(exists('specs/active/feature-a')).toBe(true);
      expect(exists('specs/active/fix-token')).toBe(true);
      expect(() => startWork('Feature A', {}, tmpDir)).toThrow(/Active work already exists: feature-a/);
    });

    test('từ chối tạo feature mới trùng tên feature đã có và gợi ý --affects', () => {
      setupProject();
      write('specs/features/auth/spec.md', '# Spec: Auth\n');

      expect(() => startWork('auth', {}, tmpDir)).toThrow(/Feature "auth" already exists.*--affects=auth/);
      expect(exists('specs/active')).toBe(false);
    });

    test('thiếu template spec thì báo lỗi và không tạo gì', () => {
      expect(() => startWork('New thing', {}, tmpDir)).toThrow(/Template not found/);
      expect(exists('specs/active')).toBe(false);
    });
  });

  describe('getStatus() / printStatus()', () => {
    test('AC-2: liệt kê việc đang làm, ý tưởng theo thứ tự phụ thuộc, feature đã xong', () => {
      write('specs/features/auth/spec.md');
      write('specs/active/add-2fa/proposal.md');
      write('specs/ideas/refund.md', '# Idea: Refund\n\n> **Depends-on**: auth, order\n');
      write('specs/ideas/order.md', '# Idea: Order\n\n> **Depends-on**: auth\n');

      const status = getStatus(tmpDir);

      expect(status.active).toEqual(['add-2fa']);
      expect(status.features).toEqual(['auth']);
      expect(status.ideas.map((i) => i.slug)).toEqual(['order', 'refund']);
      expect(status.ideas[0].blockedBy).toEqual([]);
      expect(status.ideas[1].blockedBy).toEqual(['order']);
    });

    test('AC-2: báo lỗi khi các ý tưởng phụ thuộc vòng', () => {
      write('specs/ideas/a.md', '# A\n\n> **Depends-on**: b\n');
      write('specs/ideas/b.md', '# B\n\n> **Depends-on**: a\n');

      expect(() => getStatus(tmpDir)).toThrow(/Dependency cycle between ideas: a → b → a/);
    });

    test('AC-9: không tính nội dung trong specs/.history vào việc, ý tưởng hay feature', () => {
      write('specs/.history/2026-10-01-old/proposal.md');
      write('specs/.history/2026-10-01-old/targets/auth.md');
      write('specs/.history/ideas/ghost.md', '# Ghost\n');
      write('specs/features/.history/spec.md');

      expect(getStatus(tmpDir)).toEqual({ active: [], ideas: [], features: [] });
    });

    test('project trống thì trả về danh sách rỗng', () => {
      expect(getStatus(tmpDir)).toEqual({ active: [], ideas: [], features: [] });
    });

    test('printStatus --json in JSON hợp lệ', () => {
      write('specs/ideas/a.md', '# A\n');

      printStatus(tmpDir, { json: true });

      const printed = console.log.mock.calls.map((c) => c[0]).join('\n');
      expect(JSON.parse(printed).ideas[0].slug).toBe('a');
    });

    test('printStatus in chữ có đánh dấu bị chặn', () => {
      write('specs/ideas/refund.md', '# R\n\n> **Depends-on**: ghost\n');

      printStatus(tmpDir);

      const printed = console.log.mock.calls.map((c) => c[0]).join('\n');
      expect(printed).toContain('refund  (blocked by: ghost)');
      expect(exists('specs/ideas/refund.md')).toBe(true);
    });
  });
});
