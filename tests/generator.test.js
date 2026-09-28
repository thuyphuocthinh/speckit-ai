'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { toKebabCase, getNextAdrNumber, generate, generateChangeProposal, archiveChange, generateTestsFromSpec } = require('../src/generator');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-generator-test-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Generator Unit Tests', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tmpDir);
  });

  describe('toKebabCase()', () => {
    test('chuẩn hóa chuỗi cơ bản', () => {
      expect(toKebabCase('Payment Gateway')).toBe('payment-gateway');
    });

    test('loại bỏ dấu tiếng Việt', () => {
      expect(toKebabCase('Thanh toán VNPay')).toBe('thanh-toan-vnpay');
    });

    test('loại bỏ ký tự đặc biệt', () => {
      expect(toKebabCase('Auth & Login (v2)')).toBe('auth-login-v2');
    });
  });

  describe('getNextAdrNumber()', () => {
    test('trả về 0001 nếu thư mục chưa tồn tại', () => {
      expect(getNextAdrNumber(path.join(tmpDir, 'adrs'))).toBe('0001');
    });

    test('trả về số tiếp theo đúng định dạng', () => {
      const adrsDir = path.join(tmpDir, 'adrs');
      fs.mkdirSync(adrsDir, { recursive: true });
      fs.writeFileSync(path.join(adrsDir, '0001-test.md'), '');
      fs.writeFileSync(path.join(adrsDir, '0003-hello.md'), '');
      // Skip 0002 to test max finding
      
      expect(getNextAdrNumber(adrsDir)).toBe('0004');
    });
  });

  describe('generate()', () => {
    test('báo lỗi nếu thiếu title', () => {
      expect(() => generate('feature', '', tmpDir)).toThrow('Title is required');
    });

    test('báo lỗi nếu không có template', () => {
      expect(() => generate('feature', 'Test', tmpDir)).toThrow('Template not found');
    });

    test('generate feature spec thành công', () => {
      // Mock template
      const tmplDir = path.join(tmpDir, 'specs');
      fs.mkdirSync(tmplDir, { recursive: true });
      fs.writeFileSync(path.join(tmplDir, '_template.md'), '# Spec: Title\nSome content');

      const dest = generate('feature', 'User Login', tmpDir);
      
      expect(fs.existsSync(dest)).toBe(true);
      expect(dest.endsWith('user-login\\spec.md') || dest.endsWith('user-login/spec.md')).toBe(true);
      
      const content = fs.readFileSync(dest, 'utf8');
      expect(content).toContain('# Spec: User Login');
    });

    test('generate adr thành công', () => {
      const tmplDir = path.join(tmpDir, 'docs', 'adrs');
      fs.mkdirSync(tmplDir, { recursive: true });
      fs.writeFileSync(path.join(tmplDir, '0000-template.md'), '# Title of the Decision\nDate: {{YEAR}}-MM-DD');

      const dest = generate('adr', 'Use Redis', tmpDir);
      
      expect(fs.existsSync(dest)).toBe(true);
      expect(dest.includes('0001-use-redis.md')).toBe(true);
      
      const content = fs.readFileSync(dest, 'utf8');
      expect(content).toContain('# Use Redis');
      expect(content).toContain('Date: 20'); // Should replace with current year, ex: 2024
      expect(content).not.toContain('{{YEAR}}');
    });

    test('generate contract thành công', () => {
      const tmplDir = path.join(tmpDir, 'specs', 'contracts');
      fs.mkdirSync(tmplDir, { recursive: true });
      fs.writeFileSync(path.join(tmplDir, '_template.md'), '# Contract: Name');

      const dest = generate('contract', 'Auth API', tmpDir);
      
      expect(fs.existsSync(dest)).toBe(true);
      expect(dest.includes('auth-api.md')).toBe(true);
      
      const content = fs.readFileSync(dest, 'utf8');
      expect(content).toContain('# Contract: Auth API');
    });

    test('báo lỗi nếu type không hợp lệ', () => {
      expect(() => generate('unknown', 'Test', tmpDir)).toThrow('Unknown type: unknown');
    });
  });

  describe('generateChangeProposal()', () => {
    test('tạo change proposal thành công', () => {
      generateChangeProposal('Add 2FA', null, tmpDir);
      
      const changeDir = path.join(tmpDir, 'changes', 'add-2fa');
      expect(fs.existsSync(changeDir)).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'proposal.md'))).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'delta-specs.md'))).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'tasks.md'))).toBe(true);
    });

    test('báo lỗi nếu change đã tồn tại', () => {
      generateChangeProposal('Add 2FA', null, tmpDir);
      expect(() => generateChangeProposal('Add 2FA', null, tmpDir)).toThrow('Change "add-2fa" already exists');
    });

    test('tạo brownfield change proposal thành công (có target)', () => {
      const targetSpecDir = path.join(tmpDir, 'specs', 'features', 'login');
      fs.mkdirSync(targetSpecDir, { recursive: true });
      const targetFilePath = path.join('specs', 'features', 'login', 'spec.md');
      fs.writeFileSync(path.join(tmpDir, targetFilePath), '# Spec: User Login\n');

      generateChangeProposal('Add Apple Login', targetFilePath, tmpDir);
      
      const changeDir = path.join(tmpDir, 'changes', 'add-apple-login');
      expect(fs.existsSync(changeDir)).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'proposal.md'))).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'spec-draft.md'))).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'metadata.json'))).toBe(true);
      expect(fs.existsSync(path.join(changeDir, 'tasks.md'))).toBe(true);

      const metadata = JSON.parse(fs.readFileSync(path.join(changeDir, 'metadata.json'), 'utf8'));
      expect(metadata.target).toBe(targetFilePath);
    });
  });

  describe('archiveChange()', () => {
    test('archive greenfield change thành công', () => {
      // Setup
      generateChangeProposal('Add 2FA', null, tmpDir);
      
      // Execute
      archiveChange('Add 2FA', tmpDir);
      
      // Verify
      const archiveDir = path.join(tmpDir, 'archive', 'add-2fa');
      const baselineSpec = path.join(tmpDir, 'specs', 'features', 'add-2fa', 'spec.md');
      const changeDir = path.join(tmpDir, 'changes', 'add-2fa');
      
      expect(fs.existsSync(archiveDir)).toBe(true);
      expect(fs.existsSync(baselineSpec)).toBe(true);
      expect(fs.existsSync(changeDir)).toBe(false);
    });

    test('báo lỗi nếu change không tồn tại', () => {
      expect(() => archiveChange('Non-existent', tmpDir)).toThrow('Change "non-existent" not found');
    });

    test('archive brownfield change thành công', () => {
      // Setup Target
      const targetSpecDir = path.join(tmpDir, 'specs', 'features', 'login');
      fs.mkdirSync(targetSpecDir, { recursive: true });
      const targetFilePath = path.join('specs', 'features', 'login', 'spec.md');
      fs.writeFileSync(path.join(tmpDir, targetFilePath), '# Spec: User Login\n');

      // Propose Brownfield
      generateChangeProposal('Add Apple Login', targetFilePath, tmpDir);

      // Simulate Dev updating spec-draft.md
      const draftPath = path.join(tmpDir, 'changes', 'add-apple-login', 'spec-draft.md');
      fs.writeFileSync(draftPath, '# Spec: User Login\n\n### AC-4: Apple Login\n');

      // Execute
      archiveChange('Add Apple Login', tmpDir);
      
      // Verify
      const archiveDir = path.join(tmpDir, 'archive', 'add-apple-login');
      const changeDir = path.join(tmpDir, 'changes', 'add-apple-login');
      const finalSpecContent = fs.readFileSync(path.join(tmpDir, targetFilePath), 'utf8');
      
      expect(fs.existsSync(archiveDir)).toBe(true);
      expect(fs.existsSync(changeDir)).toBe(false);
      expect(finalSpecContent).toContain('### AC-4: Apple Login');
    });
  });

  describe('generateTestsFromSpec()', () => {
    test('tạo test skeleton từ spec chứa AC', () => {
      // Setup spec
      const specDir = path.join(tmpDir, 'specs', 'features', 'login');
      fs.mkdirSync(specDir, { recursive: true });
      fs.writeFileSync(path.join(specDir, 'spec.md'), `# Spec: User Login\n\n### AC-1: Valid credentials\n\n### AC-2: Invalid password\n`);

      const testFile = generateTestsFromSpec('login', tmpDir);
      
      expect(fs.existsSync(testFile)).toBe(true);
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain("describe('Spec: User Login'");
      expect(content).toContain("describe('AC-1: Valid credentials'");
      expect(content).toContain("describe('AC-2: Invalid password'");
      expect(content).toContain("test('should satisfy acceptance criteria'");
    });

    test('báo lỗi nếu không tìm thấy spec', () => {
      expect(() => generateTestsFromSpec('non-existent', tmpDir)).toThrow('Could not find any spec file');
    });
  });
});
