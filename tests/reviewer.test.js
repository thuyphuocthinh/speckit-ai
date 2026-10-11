const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');
const reviewer = require('../src/reviewer');
const llm = require('../src/llm');
const { MAX_DIFF_CHARS } = require('../src/gitdiff');

jest.mock('child_process');
jest.mock('../src/llm');

describe('Reviewer Command', () => {
  let tmpDir;

  function write(rel, content = '# x\n') {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-reviewer-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('AC-6: báo lỗi nếu không có việc active', async () => {
    await expect(reviewer.analyze(undefined, tmpDir)).rejects.toThrow('No active work found');
  });

  it('should return success when review passes and send target specs to the LLM', async () => {
    write('specs/active/feature-a/targets/auth.md', '# Spec: Auth\n### AC-1: A\n');
    write('specs/active/feature-a/targets/order.md', '# Spec: Order\n');
    write('.agents/AGENTS.md', 'rules');
    child_process.execSync.mockReturnValue('diff content');
    llm.reviewCode.mockResolvedValue({ success: true });

    const result = await reviewer.analyze(undefined, tmpDir);

    expect(result.success).toBe(true);
    const [specContent, agentsContent, diff] = llm.reviewCode.mock.calls[0];
    expect(specContent).toContain('# Spec: Auth');
    expect(specContent).toContain('# Spec: Order');
    expect(agentsContent).toBe('rules');
    expect(diff).toBe('diff content');
  });

  it('should return errors when review fails (violates SOLID or AC)', async () => {
    write('specs/active/feature-a/targets/auth.md');
    child_process.execSync.mockReturnValue('diff content');
    llm.reviewCode.mockResolvedValue({ success: false, errors: ['Violates Single Responsibility'] });

    const result = await reviewer.analyze('feature a', tmpDir);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Violates Single Responsibility');
  });

  it('AC-6: nhiều việc active thì bắt buộc nêu tên', async () => {
    write('specs/active/a/targets/x.md');
    write('specs/active/b/targets/y.md');

    await expect(reviewer.analyze(undefined, tmpDir)).rejects.toThrow('Multiple active works found (a, b)');
  });

  it('báo lỗi nếu việc active không có target spec', async () => {
    write('specs/active/a/proposal.md');

    await expect(reviewer.analyze(undefined, tmpDir)).rejects.toThrow('No target specs found');
  });

  it('báo lỗi nếu không có thay đổi code để review', async () => {
    write('specs/active/a/targets/x.md');
    child_process.execSync.mockReturnValue('  ');

    await expect(reviewer.analyze(undefined, tmpDir)).rejects.toThrow('No code changes to review');
  });

  it('đưa file tham chiếu (--ref) vào LLM nếu tồn tại', async () => {
    write('specs/active/a/targets/x.md');
    write('src/reference.js', 'REFERENCE CODE');
    child_process.execSync.mockReturnValue('diff');
    llm.reviewCode.mockResolvedValue({ success: true });

    await reviewer.analyze(undefined, tmpDir, 'src/reference.js');

    expect(llm.reviewCode.mock.calls[0][3]).toBe('REFERENCE CODE');
  });

  describe('diff dài, file mới và lock file', () => {
    /** Section diff giả dài đúng `size` ký tự cho file `name`. */
    function section(name, size) {
      const header = `diff --git a/${name} b/${name}\n`;
      return `${header}${'x'.repeat(size - header.length - 1)}\n`;
    }

    /** Giả lập git: `git diff` trả `diff`, `git ls-files --others` trả `untracked`. */
    function mockGit(diff, untracked = '') {
      child_process.execSync.mockImplementation((command) => (command.startsWith('git ls-files') ? untracked : diff));
    }

    beforeEach(() => {
      write('specs/active/a/targets/x.md', '# Spec: X\n');
    });

    it('AC-3: diff dài được chia theo file, gửi từng phần ≤ giới hạn và không mất ký tự nào', async () => {
      const diff = section('a.js', 9000) + section('b.js', 9000) + section('c.js', 9000);
      mockGit(diff);
      llm.reviewCode.mockResolvedValue({ success: true, errors: [] });

      const result = await reviewer.analyze(undefined, tmpDir);

      const sent = llm.reviewCode.mock.calls.map((call) => call[2]);
      expect(sent).toHaveLength(3);
      expect(sent.every((chunk) => chunk.length <= MAX_DIFF_CHARS)).toBe(true);
      expect(sent.join('')).toBe(diff);
      expect(result).toEqual({ success: true, errors: [], skipped: [] });
    });

    it('AC-3: chỉ passed khi mọi phần passed, và gộp errors của các phần', async () => {
      mockGit(section('a.js', 9000) + section('b.js', 9000) + section('c.js', 9000));
      llm.reviewCode
        .mockResolvedValueOnce({ success: true, errors: [] })
        .mockResolvedValueOnce({ success: false, errors: ['b.js breaks AC-1'] })
        .mockResolvedValueOnce({ success: false, errors: ['c.js breaks AC-2'] });

      const result = await reviewer.analyze(undefined, tmpDir);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['b.js breaks AC-1', 'c.js breaks AC-2']);
    });

    it('AC-4: một file đơn lẻ quá giới hạn thì báo lỗi và không gọi model', async () => {
      mockGit(section('small.js', 100) + section('generated.js', MAX_DIFF_CHARS + 500));

      await expect(reviewer.analyze(undefined, tmpDir)).rejects.toThrow(/generated\.js is \d+ characters.*cannot be reviewed in one piece/);
      expect(llm.reviewCode).not.toHaveBeenCalled();
    });

    it('AC-5: nội dung file mới chưa track được gửi đi review', async () => {
      write('src/new.js', 'const brandNew = 1;\n');
      mockGit('', 'src/new.js\0');
      llm.reviewCode.mockResolvedValue({ success: true, errors: [] });

      await reviewer.analyze(undefined, tmpDir);

      const sent = llm.reviewCode.mock.calls[0][2];
      expect(sent).toContain('diff --git a/src/new.js b/src/new.js');
      expect(sent).toContain('+const brandNew = 1;');
    });

    it('AC-6: lock file không được gửi và được báo là skipped', async () => {
      mockGit(section('src/a.js', 200) + section('package-lock.json', 40000));
      llm.reviewCode.mockResolvedValue({ success: true, errors: [] });

      const result = await reviewer.analyze(undefined, tmpDir);

      expect(llm.reviewCode.mock.calls[0][2]).not.toContain('package-lock.json');
      expect(result.skipped).toEqual(['package-lock.json']);
    });

    it('AC-6: chỉ có lock file thay đổi thì báo không có gì để review', async () => {
      mockGit(section('yarn.lock', 500));

      await expect(reviewer.analyze(undefined, tmpDir)).rejects.toThrow('No code changes to review (not reviewed: yarn.lock)');
      expect(llm.reviewCode).not.toHaveBeenCalled();
    });
  });
});
