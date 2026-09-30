'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { apply, findGitDir, readExcludeFile, appendEntries, STEALTH_ENTRIES } = require('../src/stealth');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-ai-docs-stealth-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- findGitDir ---
describe('findGitDir()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('trả về path khi có .git/', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    expect(findGitDir(tmpDir)).toBe(path.join(tmpDir, '.git'));
  });

  test('trả về null khi không có .git/', () => {
    expect(findGitDir(tmpDir)).toBeNull();
  });
});

// --- appendEntries ---
describe('appendEntries()', () => {
  test('append entry chưa có', () => {
    const result = appendEntries('', ['.agents/']);
    expect(result).toContain('.agents/');
  });

  test('không duplicate entry đã có', () => {
    const existing = '.agents/\ndocs/\n';
    const result = appendEntries(existing, ['.agents/', 'specs/']);
    const count = (result.match(/\.agents\//g) || []).length;
    expect(count).toBe(1);
    expect(result).toContain('specs/');
  });

  test('không thay đổi nếu tất cả entry đã có', () => {
    const existing = STEALTH_ENTRIES.join('\n') + '\n';
    const result = appendEntries(existing, STEALTH_ENTRIES);
    expect(result).toBe(existing);
  });

  test('STEALTH_ENTRIES cũng exclude file config của speckit-ai', () => {
    expect(STEALTH_ENTRIES).toContain('.speckitrc');
    expect(STEALTH_ENTRIES).toContain('speckit.config.json');
  });

  test('xử lý đúng content không có newline cuối', () => {
    const result = appendEntries('.agents/', ['docs/']);
    expect(result).toContain('\n');
    expect(result).toContain('docs/');
  });
});

// --- apply (integration) ---
describe('apply()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('không crash khi không có .git/', () => {
    expect(() => apply(tmpDir)).not.toThrow();
  });

  test('ghi đúng entries vào .git/info/exclude', () => {
    fs.mkdirSync(path.join(tmpDir, '.git', 'info'), { recursive: true });
    apply(tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, '.git', 'info', 'exclude'), 'utf8');
    for (const entry of STEALTH_ENTRIES) {
      expect(content).toContain(entry);
    }
  });

  test('tạo .git/info/exclude nếu chưa tồn tại', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
    apply(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.git', 'info', 'exclude'))).toBe(true);
  });

  test('không duplicate khi chạy 2 lần', () => {
    fs.mkdirSync(path.join(tmpDir, '.git', 'info'), { recursive: true });
    apply(tmpDir);
    apply(tmpDir); // lần 2
    const content = fs.readFileSync(path.join(tmpDir, '.git', 'info', 'exclude'), 'utf8');
    const count = (content.match(/\.agents\//g) || []).length;
    expect(count).toBe(1);
  });
});
