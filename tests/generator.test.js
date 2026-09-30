'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { toKebabCase, getNextAdrNumber, generate, generateTestsFromSpec } = require('../src/generator');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-generator-test-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Generator Unit Tests', () => {
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

  const ADR_TEMPLATE = '# Title of the Decision\n\n* Status: proposed\n* Date: 2026-MM-DD\n\n## Context and Problem Statement\n';
  const CONTRACT_TEMPLATE = '# Contract: [Service / Component Name]\n\n> **Version**: 1.0.0\n\n## 1. Overview\n';

  beforeEach(() => {
    tmpDir = createTempDir();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupDir(tmpDir);
    jest.restoreAllMocks();
  });

  describe('toKebabCase()', () => {
    test('chuẩn hóa chuỗi cơ bản', () => {
      expect(toKebabCase('Hello World')).toBe('hello-world');
    });

    test('loại bỏ dấu tiếng Việt', () => {
      expect(toKebabCase('Thêm tính năng Đăng nhập')).toBe('them-tinh-nang-dang-nhap');
    });

    test('loại bỏ ký tự đặc biệt', () => {
      expect(toKebabCase('Feature: Login! (v2)')).toBe('feature-login-v2');
    });
  });

  describe('getNextAdrNumber()', () => {
    test('trả về 0001 nếu thư mục chưa tồn tại', () => {
      expect(getNextAdrNumber(path.join(tmpDir, 'nope'))).toBe('0001');
    });

    test('trả về số tiếp theo đúng định dạng', () => {
      write('decisions/0000-template.md');
      write('decisions/0007-x.md');
      write('decisions/notes.md');
      expect(getNextAdrNumber(path.join(tmpDir, 'decisions'))).toBe('0008');
    });
  });

  describe('generate()', () => {
    test('báo lỗi nếu thiếu title', () => {
      expect(() => generate('adr', '', {}, tmpDir)).toThrow('Title is required');
    });

    test('báo lỗi nếu type không hợp lệ (feature không còn được hỗ trợ)', () => {
      expect(() => generate('feature', 'X', {}, tmpDir)).toThrow('Unknown type: feature');
    });

    test('báo lỗi nếu không có template', () => {
      expect(() => generate('adr', 'Use JWT', {}, tmpDir)).toThrow('Template not found');
    });

    test('AC-10: không có việc active và không có --for thì ADR vào specs/decisions/ với số thứ tự', () => {
      write('specs/decisions/0000-template.md', ADR_TEMPLATE);
      write('specs/decisions/0001-old.md');

      const dest = generate('adr', 'Use JWT', {}, tmpDir);

      expect(dest).toBe(path.join(tmpDir, 'specs', 'decisions', '0002-use-jwt.md'));
      const content = read('specs/decisions/0002-use-jwt.md');
      expect(content).toMatch(/^# Use JWT$/m);
      expect(content).toMatch(/Date: \d{4}-\d{2}-\d{2}/);
      expect(content).not.toContain('MM-DD');
    });

    test('AC-10: contract không có việc active vào specs/contracts/<slug>.md', () => {
      write('specs/contracts/_template.md', CONTRACT_TEMPLATE);

      const dest = generate('contract', 'Auth API', {}, tmpDir);

      expect(dest).toBe(path.join(tmpDir, 'specs', 'contracts', 'auth-api.md'));
      expect(read('specs/contracts/auth-api.md')).toMatch(/^# Contract: Auth API$/m);
    });

    test('AC-10: --for=<feature> đặt ADR cạnh feature và đánh số riêng trong thư mục đó', () => {
      write('specs/decisions/0000-template.md', ADR_TEMPLATE);
      write('specs/decisions/0009-elsewhere.md');
      write('specs/features/auth/spec.md');

      generate('adr', 'Use TOTP', { forFeature: 'auth' }, tmpDir);

      expect(exists('specs/features/auth/decisions/0001-use-totp.md')).toBe(true);
    });

    test('AC-10: --for với feature không tồn tại thì báo lỗi', () => {
      write('specs/decisions/0000-template.md', ADR_TEMPLATE);

      expect(() => generate('adr', 'X', { forFeature: 'ghost' }, tmpDir)).toThrow('Feature "ghost" not found');
    });

    test('AC-10: đang có một việc active thì ADR/contract vào việc đó', () => {
      write('specs/decisions/0000-template.md', ADR_TEMPLATE);
      write('specs/contracts/_template.md', CONTRACT_TEMPLATE);
      write('specs/active/add-2fa/proposal.md');

      generate('adr', 'Use TOTP', {}, tmpDir);
      generate('contract', 'Otp API', {}, tmpDir);

      expect(exists('specs/active/add-2fa/decisions/0001-use-totp.md')).toBe(true);
      expect(exists('specs/active/add-2fa/contracts/otp-api.md')).toBe(true);
      expect(exists('specs/decisions/0001-use-totp.md')).toBe(false);
    });

    test('AC-10: nhiều việc active thì phải chọn bằng work, và --for thắng việc active', () => {
      write('specs/decisions/0000-template.md', ADR_TEMPLATE);
      write('specs/active/a/proposal.md');
      write('specs/active/b/proposal.md');
      write('specs/features/auth/spec.md');

      expect(() => generate('adr', 'X', {}, tmpDir)).toThrow(/Multiple active works found \(a, b\)/);

      generate('adr', 'For B', { work: 'b' }, tmpDir);
      expect(exists('specs/active/b/decisions/0001-for-b.md')).toBe(true);

      generate('adr', 'For auth', { forFeature: 'auth' }, tmpDir);
      expect(exists('specs/features/auth/decisions/0001-for-auth.md')).toBe(true);
    });

    test('báo lỗi nếu file đã tồn tại và không ghi đè', () => {
      write('specs/contracts/_template.md', CONTRACT_TEMPLATE);
      write('specs/contracts/auth-api.md', 'mine');

      expect(() => generate('contract', 'Auth API', {}, tmpDir)).toThrow('File already exists');
      expect(read('specs/contracts/auth-api.md')).toBe('mine');
    });
  });

  describe('generateTestsFromSpec()', () => {
    test('AC-6: không có việc active thì báo lỗi rõ', () => {
      expect(() => generateTestsFromSpec(undefined, tmpDir)).toThrow('No active work found');
    });

    test('AC-6: sinh test skeleton từ targets/*.md của việc duy nhất', () => {
      write('specs/active/login/targets/login.md', '# Spec: User Login\n\n### AC-1: Valid credentials\n\n### AC-2: Invalid password\n');

      const files = generateTestsFromSpec(undefined, tmpDir);

      expect(files).toEqual([path.join(tmpDir, 'tests', 'specs', 'spec-user-login.test.js')]);
      const content = fs.readFileSync(files[0], 'utf8');
      expect(content).toContain("describe('Spec: User Login'");
      expect(content).toContain("describe('AC-1: Valid credentials'");
      expect(content).toContain("describe('AC-2: Invalid password'");
      expect(content).toContain("test('should satisfy acceptance criteria'");
    });

    test('nhiều target thì mỗi target có AC cho một file test; target không có AC bị bỏ qua', () => {
      write('specs/active/token/targets/auth.md', '# Spec: Auth\n\n### AC-1: Issue token\n');
      write('specs/active/token/targets/order.md', '# Spec: Order\n\n### AC-1: Authorize order\n');
      write('specs/active/token/targets/notes.md', '# Spec: Notes\n\nNo criteria here.\n');

      const files = generateTestsFromSpec('token', tmpDir);

      expect(files.map((f) => path.basename(f))).toEqual(['spec-auth.test.js', 'spec-order.test.js']);
    });

    test('dùng đuôi .ts khi project có tsconfig.json', () => {
      write('tsconfig.json', '{}');
      write('specs/active/login/targets/login.md', '# Spec: Login\n\n### AC-1: Works\n');

      const files = generateTestsFromSpec(undefined, tmpDir);

      expect(files[0]).toMatch(/\.test\.ts$/);
    });

    test('không ghi đè file test đã có và không tạo file nào khi một file trùng', () => {
      write('specs/active/token/targets/auth.md', '# Spec: Auth\n\n### AC-1: A\n');
      write('specs/active/token/targets/order.md', '# Spec: Order\n\n### AC-1: B\n');
      write('tests/specs/spec-order.test.js', 'mine');

      expect(() => generateTestsFromSpec('token', tmpDir)).toThrow('Test file already exists');
      expect(exists('tests/specs/spec-auth.test.js')).toBe(false);
      expect(read('tests/specs/spec-order.test.js')).toBe('mine');
    });

    test('báo lỗi nếu việc active không có target nào', () => {
      write('specs/active/empty/proposal.md');

      expect(() => generateTestsFromSpec('empty', tmpDir)).toThrow('No target specs found');
    });

    test('cảnh báo và trả về rỗng khi không target nào có AC', () => {
      write('specs/active/login/targets/login.md', '# Spec: Login\n\nNo AC\n');

      expect(generateTestsFromSpec(undefined, tmpDir)).toEqual([]);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No Acceptance Criteria'));
    });
  });
});
