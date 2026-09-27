'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { installHook, HOOK_CONTENT } = require('../src/hook');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-hook-test-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('hook.js - installHook()', () => {
  let tmpDir;
  
  beforeEach(() => {
    tmpDir = createTempDir();
  });
  
  afterEach(() => {
    cleanupDir(tmpDir);
  });

  test('trả về false và báo lỗi nếu không có thư mục .git', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = installHook(tmpDir);
    
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Khong tim thay thu muc .git/hooks'));
    
    consoleSpy.mockRestore();
  });

  test('cài đặt thành công nếu có thư mục .git/hooks', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Giả lập thư mục .git/hooks
    const gitHooksDir = path.join(tmpDir, '.git', 'hooks');
    fs.mkdirSync(gitHooksDir, { recursive: true });
    
    const result = installHook(tmpDir);
    
    expect(result).toBe(true);
    
    // Kiểm tra file pre-commit có được tạo ra không
    const hookPath = path.join(gitHooksDir, 'pre-commit');
    expect(fs.existsSync(hookPath)).toBe(true);
    expect(fs.readFileSync(hookPath, 'utf8')).toBe(HOOK_CONTENT);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cai dat Native Git Hook thanh cong'));
    
    consoleSpy.mockRestore();
  });
});
