'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { loadConfig } = require('../src/config');

// Helper
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-ai-docs-config-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('config.js - loadConfig()', () => {
  let tmpDir;
  
  beforeEach(() => {
    tmpDir = createTempDir();
  });
  
  afterEach(() => {
    cleanupDir(tmpDir);
  });

  test('trả về {} nếu không có file config', () => {
    const config = loadConfig(tmpDir);
    expect(config).toEqual({});
  });

  test('parse đúng file .speckitrc hợp lệ', () => {
    const customDir = path.join(tmpDir, 'my-templates');
    fs.mkdirSync(customDir); // Tạo thư mục custom giả lập
    
    fs.writeFileSync(path.join(tmpDir, '.speckitrc'), JSON.stringify({ templatesDir: './my-templates' }));
    
    const config = loadConfig(tmpDir);
    expect(config.templatesDir).toBe(customDir);
  });

  test('parse đúng file speckit.config.json', () => {
    const customDir = path.join(tmpDir, 'shared', 'templates');
    fs.mkdirSync(path.join(tmpDir, 'shared'));
    fs.mkdirSync(customDir);
    
    fs.writeFileSync(path.join(tmpDir, 'speckit.config.json'), JSON.stringify({ templatesDir: 'shared/templates' }));
    
    const config = loadConfig(tmpDir);
    expect(config.templatesDir).toBe(customDir);
  });

  test('ưu tiên .speckitrc hơn speckit.config.json', () => {
    const customDir1 = path.join(tmpDir, 'dir1');
    const customDir2 = path.join(tmpDir, 'dir2');
    fs.mkdirSync(customDir1);
    fs.mkdirSync(customDir2);

    fs.writeFileSync(path.join(tmpDir, '.speckitrc'), JSON.stringify({ templatesDir: './dir1' }));
    fs.writeFileSync(path.join(tmpDir, 'speckit.config.json'), JSON.stringify({ templatesDir: './dir2' }));
    
    const config = loadConfig(tmpDir);
    expect(config.templatesDir).toBe(customDir1);
  });

  test('trả về {} nếu JSON lỗi cú pháp', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.writeFileSync(path.join(tmpDir, '.speckitrc'), '{ invalid json');
    
    const config = loadConfig(tmpDir);
    expect(config).toEqual({});
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to parse .speckitrc'));
    
    consoleSpy.mockRestore();
  });

  test('trả về {} nếu templatesDir không tồn tại trên thực tế', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.writeFileSync(path.join(tmpDir, '.speckitrc'), JSON.stringify({ templatesDir: './non-existent-dir' }));
    
    const config = loadConfig(tmpDir);
    expect(config).toEqual({});
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist'));
    
    consoleSpy.mockRestore();
  });
});
