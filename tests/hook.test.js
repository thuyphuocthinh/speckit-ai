'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { installHook, HOOK_CONTENT, HOOK_MARKER } = require('../src/hook');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-hook-test-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('hook.js - installHook()', () => {
  let tmpDir;
  let hooksDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    hooksDir = path.join(tmpDir, '.git', 'hooks');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupDir(tmpDir);
    jest.restoreAllMocks();
  });

  test('trả về false và báo lỗi nếu không có thư mục .git', () => {
    const result = installHook(tmpDir);

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Could not find .git/hooks directory'));
  });

  test('cài đặt thành công nếu có thư mục .git/hooks', () => {
    fs.mkdirSync(hooksDir, { recursive: true });

    const result = installHook(tmpDir);

    expect(result).toBe(true);
    const hookPath = path.join(hooksDir, 'pre-commit');
    expect(fs.readFileSync(hookPath, 'utf8')).toBe(HOOK_CONTENT);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Native Git Hook successfully installed'));
  });

  test('hook chỉ chạy lint, không đòi stage file specs/docs và không gọi verify-commit', () => {
    expect(HOOK_CONTENT).toContain('npx speckit-ai lint');
    expect(HOOK_CONTENT).not.toContain('git diff --cached');
    expect(HOOK_CONTENT).not.toContain('specs/');
    expect(HOOK_CONTENT).not.toContain('verify-commit');
  });

  test('không tạo hook commit-msg', () => {
    fs.mkdirSync(hooksDir, { recursive: true });

    installHook(tmpDir);

    expect(fs.existsSync(path.join(hooksDir, 'commit-msg'))).toBe(false);
  });

  test('từ chối ghi đè pre-commit không phải của speckit-ai nếu không có force', () => {
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(hookPath, '#!/bin/sh\necho custom\n', 'utf8');

    const result = installHook(tmpDir);

    expect(result).toBe(false);
    expect(fs.readFileSync(hookPath, 'utf8')).toBe('#!/bin/sh\necho custom\n');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('--force'));
  });

  test('force ghi đè pre-commit của người khác', () => {
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(hookPath, '#!/bin/sh\necho custom\n', 'utf8');

    const result = installHook(tmpDir, { force: true });

    expect(result).toBe(true);
    expect(fs.readFileSync(hookPath, 'utf8')).toBe(HOOK_CONTENT);
  });

  test('cài lại thì cập nhật hook của chính speckit-ai mà không cần force', () => {
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(hookPath, `#!/bin/sh\n${HOOK_MARKER}\necho old\n`, 'utf8');

    const result = installHook(tmpDir);

    expect(result).toBe(true);
    expect(fs.readFileSync(hookPath, 'utf8')).toBe(HOOK_CONTENT);
  });

  test('xóa hook commit-msg cũ của speckit-ai nhưng giữ hook của người khác', () => {
    fs.mkdirSync(hooksDir, { recursive: true });
    const commitMsgPath = path.join(hooksDir, 'commit-msg');

    fs.writeFileSync(commitMsgPath, '#!/bin/sh\nnpx speckit-ai verify-commit "$1"\n', 'utf8');
    installHook(tmpDir);
    expect(fs.existsSync(commitMsgPath)).toBe(false);

    fs.writeFileSync(commitMsgPath, '#!/bin/sh\nnpx commitlint --edit "$1"\n', 'utf8');
    installHook(tmpDir);
    expect(fs.existsSync(commitMsgPath)).toBe(true);
  });
});
