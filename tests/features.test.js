'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  toKebabCase,
  getPaths,
  parseMeta,
  setMeta,
  parseList,
  sha256,
  listActive,
  resolveActive,
  listFeatures,
  listIdeas,
  orderIdeas,
} = require('../src/features');

describe('features.js', () => {
  let tmpDir;

  function write(rel, content = '# x\n') {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
    return full;
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-features-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('toKebabCase()', () => {
    test('chuẩn hóa, bỏ dấu tiếng Việt và ký tự đặc biệt', () => {
      expect(toKebabCase('  Refund đơn hàng! ')).toBe('refund-don-hang');
    });
  });

  describe('getPaths()', () => {
    test('trả về các đường dẫn chuẩn dưới specs/', () => {
      const p = getPaths(tmpDir);
      expect(p.ideas).toBe(path.join(tmpDir, 'specs', 'ideas'));
      expect(p.active).toBe(path.join(tmpDir, 'specs', 'active'));
      expect(p.features).toBe(path.join(tmpDir, 'specs', 'features'));
      expect(p.decisions).toBe(path.join(tmpDir, 'specs', 'decisions'));
      expect(p.contracts).toBe(path.join(tmpDir, 'specs', 'contracts'));
      expect(p.history).toBe(path.join(tmpDir, 'specs', '.history'));
    });
  });

  describe('parseMeta() / parseList()', () => {
    test('đọc các dòng > **Key**: value trước heading ## đầu tiên', () => {
      const content = '# Idea\n\n> **Depends-on**: auth, order\n> **Affects**: payment\n\n## Problem\n> **Late**: ignored\n';
      expect(parseMeta(content)).toEqual({ 'depends-on': 'auth, order', affects: 'payment' });
    });

    test('bỏ qua blockquote thường không có **Key**', () => {
      expect(parseMeta('# T\n\n> Copy this file somewhere\n')).toEqual({});
    });

    test('parseList tách, chuẩn hóa slug và bỏ placeholder', () => {
      expect(parseList('Auth, Order Refund')).toEqual(['auth', 'order-refund']);
      expect(parseList('<slug>, -')).toEqual([]);
      expect(parseList(undefined)).toEqual([]);
    });
  });

  describe('setMeta()', () => {
    test('thay giá trị của dòng metadata đã có (không phân biệt hoa thường)', () => {
      const out = setMeta('# T\n\n> **Affects**: old\n\n## S\n', 'affects', 'auth, order');
      expect(parseMeta(out)).toEqual({ affects: 'auth, order' });
      expect(out).not.toContain('old');
    });

    test('thêm sau dòng metadata cuối cùng', () => {
      const out = setMeta('# T\n\n> **Depends-on**: a\n\n## S\n', 'Affects', 'auth');
      expect(parseMeta(out)).toEqual({ 'depends-on': 'a', affects: 'auth' });
      expect(out.indexOf('Depends-on')).toBeLessThan(out.indexOf('Affects'));
    });

    test('chưa có metadata thì thêm ngay sau H1', () => {
      const out = setMeta('# T\n\n## S\ntext\n', 'Affects', 'auth');
      expect(out).toBe('# T\n\n> **Affects**: auth\n\n## S\ntext\n');
    });

    test('không đụng vào dòng giống metadata nằm sau heading ##', () => {
      const out = setMeta('# T\n\n## S\n> **Affects**: inner\n', 'Affects', 'auth');
      expect(out).toContain('> **Affects**: inner');
      expect(parseMeta(out)).toEqual({ affects: 'auth' });
    });

    test('giữ kiểu xuống dòng CRLF', () => {
      const out = setMeta('# T\r\n\r\n## S\r\n', 'Affects', 'auth');
      expect(out).toBe('# T\r\n\r\n> **Affects**: auth\r\n\r\n## S\r\n');
    });
  });

  describe('sha256()', () => {
    test('cùng nội dung cho cùng hash, khác nội dung cho hash khác', () => {
      const a = write('a.md', 'hello');
      const b = write('b.md', 'hello');
      const c = write('c.md', 'world');
      expect(sha256(a)).toBe(sha256(b));
      expect(sha256(a)).not.toBe(sha256(c));
      expect(sha256(a)).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('listActive() / resolveActive()', () => {
    test('không có thư mục active thì danh sách rỗng và resolve báo lỗi rõ', () => {
      expect(listActive(tmpDir)).toEqual([]);
      expect(() => resolveActive(tmpDir)).toThrow(/No active work found/);
    });

    test('một việc active thì resolve không cần tên', () => {
      write('specs/active/add-2fa/proposal.md');
      const res = resolveActive(tmpDir);
      expect(res.name).toBe('add-2fa');
      expect(res.dir).toBe(path.join(tmpDir, 'specs', 'active', 'add-2fa'));
    });

    test('nhiều việc active thì bắt buộc nêu tên và liệt kê danh sách', () => {
      write('specs/active/add-2fa/proposal.md');
      write('specs/active/fix-token/proposal.md');
      expect(() => resolveActive(tmpDir)).toThrow(/Multiple active works found \(add-2fa, fix-token\)/);
      expect(resolveActive(tmpDir, 'Fix Token').name).toBe('fix-token');
    });

    test('tên không tồn tại thì báo lỗi kèm danh sách đang có', () => {
      write('specs/active/add-2fa/proposal.md');
      expect(() => resolveActive(tmpDir, 'nope')).toThrow(/No active work named "nope".*add-2fa/);
    });

    test('bỏ qua thư mục ẩn trong active', () => {
      write('specs/active/.hidden/x.md');
      expect(listActive(tmpDir)).toEqual([]);
    });
  });

  describe('listFeatures()', () => {
    test('chỉ tính thư mục có spec.md và bỏ qua .history', () => {
      write('specs/features/auth/spec.md');
      write('specs/features/order/decisions/0001-x.md');
      write('specs/features/.history/old/spec.md');
      expect(listFeatures(tmpDir)).toEqual(['auth']);
    });
  });

  describe('listIdeas()', () => {
    test('đọc tiêu đề, Depends-on, Affects và bỏ file bắt đầu bằng _', () => {
      write('specs/ideas/refund.md', '# Refund\n\n> **Depends-on**: auth\n> **Affects**: order, payment\n');
      write('specs/ideas/_template.md', '# T\n');
      write('specs/ideas/notes.txt', 'no');
      const ideas = listIdeas(tmpDir);
      expect(ideas).toHaveLength(1);
      expect(ideas[0]).toMatchObject({
        slug: 'refund',
        title: 'Refund',
        dependsOn: ['auth'],
        affects: ['order', 'payment'],
      });
    });

    test('thư mục ideas chưa có thì trả về rỗng', () => {
      expect(listIdeas(tmpDir)).toEqual([]);
    });
  });

  describe('orderIdeas()', () => {
    const idea = (slug, dependsOn = []) => ({ slug, dependsOn, affects: [], title: slug, file: slug });

    test('phụ thuộc được xếp trước', () => {
      const { ordered, cycle } = orderIdeas([idea('b', ['a']), idea('a'), idea('c', ['b'])], []);
      expect(cycle).toBeNull();
      expect(ordered.map((o) => o.idea.slug)).toEqual(['a', 'b', 'c']);
    });

    test('đánh dấu bị chặn khi phụ thuộc chưa là feature đã xong', () => {
      const { ordered } = orderIdeas([idea('refund', ['auth', 'ghost'])], ['auth']);
      expect(ordered[0].blockedBy).toEqual(['ghost']);
    });

    test('phụ thuộc đã xong thì không bị chặn', () => {
      const { ordered } = orderIdeas([idea('refund', ['auth'])], ['auth']);
      expect(ordered[0].blockedBy).toEqual([]);
    });

    test('phát hiện phụ thuộc vòng', () => {
      const { cycle } = orderIdeas([idea('a', ['b']), idea('b', ['a'])], []);
      expect(cycle).toEqual(['a', 'b', 'a']);
    });
  });
});
