'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { MAX_DIFF_CHARS, collectDiff, splitByFile, filterIgnored, chunkDiff } = require('../src/gitdiff');

/** Một section diff giả dài đúng `size` ký tự (kết thúc bằng xuống dòng, như diff thật) cho file `name`. */
function fakeSection(name, size) {
  const header = `diff --git a/${name} b/${name}\n`;
  return `${header}${'x'.repeat(size - header.length - 1)}\n`;
}

describe('gitdiff.js', () => {
  let tmpDir;

  function git(...args) {
    return execFileSync('git', args, { cwd: tmpDir, encoding: 'utf8' });
  }

  function write(rel, content) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  function initRepo({ commit = true } = {}) {
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    git('config', 'core.autocrlf', 'false');
    git('config', 'commit.gpgsign', 'false');
    if (commit) {
      write('tracked.txt', 'one\n');
      git('add', '.');
      git('commit', '-q', '-m', 'init');
    }
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-gitdiff-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('collectDiff()', () => {
    test('AC-5: gồm thay đổi đã stage, chưa stage và nội dung file mới chưa track', () => {
      initRepo();
      write('staged.txt', 'staged line\n');
      git('add', 'staged.txt');
      write('tracked.txt', 'one\ntwo\n'); // chưa stage
      write('src/new.js', 'const a = 1;\nconst b = 2;\n'); // chưa track

      const diff = collectDiff(tmpDir);

      expect(diff).toContain('diff --git a/staged.txt b/staged.txt');
      expect(diff).toContain('+staged line');
      expect(diff).toContain('+two');
      expect(diff).toContain('diff --git a/src/new.js b/src/new.js');
      expect(diff).toContain('new file mode 100644');
      expect(diff).toContain('@@ -0,0 +1,2 @@');
      expect(diff).toContain('+const a = 1;');
      expect(diff).toContain('+const b = 2;');
    });

    test('AC-5: file nhị phân chưa track chỉ có một dòng thông báo, không có nội dung', () => {
      initRepo();
      write('logo.bin', Buffer.from([0x89, 0x50, 0x00, 0x47, 0x0a]));

      const diff = collectDiff(tmpDir);

      expect(diff).toContain('diff --git a/logo.bin b/logo.bin');
      expect(diff).toContain('Binary file logo.bin (new, not shown)');
      expect(diff).not.toContain('+');
    });

    test('AC-5: file bị .git/info/exclude không nằm trong diff', () => {
      initRepo();
      fs.appendFileSync(path.join(tmpDir, '.git', 'info', 'exclude'), 'specs/\n');
      write('specs/secret.md', 'local only\n');
      write('visible.txt', 'shown\n');

      const diff = collectDiff(tmpDir);

      expect(diff).toContain('visible.txt');
      expect(diff).not.toContain('secret.md');
    });

    test('không có thay đổi thì trả chuỗi rỗng', () => {
      initRepo();

      expect(collectDiff(tmpDir)).toBe('');
    });

    test('repo chưa có commit nào vẫn lấy được file mới', () => {
      initRepo({ commit: false });
      write('first.txt', 'hello\n');

      const diff = collectDiff(tmpDir);

      expect(diff).toContain('diff --git a/first.txt b/first.txt');
      expect(diff).toContain('+hello');
    });

    test('báo lỗi nếu không phải git repo', () => {
      expect(() => collectDiff(tmpDir)).toThrow();
    });
  });

  describe('splitByFile()', () => {
    test('tách theo dòng diff --git và lấy tên file mới', () => {
      const diff = `${fakeSection('a.js', 50)}${fakeSection('dir/b.js', 60)}`;

      const sections = splitByFile(diff);

      expect(sections.map((s) => s.file)).toEqual(['a.js', 'dir/b.js']);
      expect(sections.map((s) => s.text).join('')).toBe(diff);
    });

    test('nội dung không có dòng diff --git là một phần không có tên file', () => {
      expect(splitByFile('plain diff')).toEqual([{ file: null, text: 'plain diff' }]);
    });
  });

  describe('filterIgnored()', () => {
    test('AC-6: bỏ lock file ở mọi thư mục và liệt kê chúng', () => {
      const diff = `${fakeSection('src/a.js', 50)}${fakeSection('package-lock.json', 80)}${fakeSection('svc/go.sum', 60)}`;

      const { diff: kept, skipped } = filterIgnored(diff);

      expect(skipped).toEqual(['package-lock.json', 'svc/go.sum']);
      expect(kept).toBe(fakeSection('src/a.js', 50));
    });

    test('AC-6: mọi lock file trong danh sách đều bị bỏ qua', () => {
      const names = ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'go.sum', 'poetry.lock', 'Pipfile.lock', 'composer.lock', 'Cargo.lock', 'Gemfile.lock'];
      const diff = names.map((name) => fakeSection(name, 70)).join('');

      const { diff: kept, skipped } = filterIgnored(diff);

      expect(skipped).toEqual(names);
      expect(kept).toBe('');
    });
  });

  describe('chunkDiff()', () => {
    test('AC-3: diff vượt giới hạn được chia theo ranh giới file, không phần nào quá giới hạn', () => {
      const max = 200;
      const sections = [fakeSection('a.js', 90), fakeSection('b.js', 90), fakeSection('c.js', 90), fakeSection('d.js', 150)];
      const diff = sections.join('');

      const { chunks, skipped } = chunkDiff(diff, max);

      expect(skipped).toEqual([]);
      expect(chunks).toEqual([sections[0] + sections[1], sections[2], sections[3]]);
      expect(chunks.every((chunk) => chunk.length <= max)).toBe(true);
      expect(chunks.join('')).toBe(diff); // không mất ký tự nào
    });

    test('AC-3: diff nhỏ là một phần duy nhất, mặc định theo MAX_DIFF_CHARS', () => {
      const diff = fakeSection('a.js', 100);

      expect(chunkDiff(diff).chunks).toEqual([diff]);
      expect(MAX_DIFF_CHARS).toBe(15000);
    });

    test('AC-4: một file đơn lẻ vượt giới hạn thì báo lỗi nêu tên file và kích thước', () => {
      const diff = `${fakeSection('small.js', 50)}${fakeSection('huge/generated.js', 300)}`;

      expect(() => chunkDiff(diff, 200)).toThrow(/huge\/generated\.js is 300 characters, over the 200 limit/);
    });

    test('AC-6: lock file không vào phần nào và được báo; chỉ có lock file thì không có phần nào', () => {
      const withCode = chunkDiff(`${fakeSection('package-lock.json', 500)}${fakeSection('a.js', 80)}`, 200);
      expect(withCode.skipped).toEqual(['package-lock.json']);
      expect(withCode.chunks).toEqual([fakeSection('a.js', 80)]);

      const onlyLock = chunkDiff(fakeSection('yarn.lock', 500), 200);
      expect(onlyLock.chunks).toEqual([]);
      expect(onlyLock.skipped).toEqual(['yarn.lock']);
    });
  });
});
