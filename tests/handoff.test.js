const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');
const handoff = require('../src/handoff');
const llm = require('../src/llm');

jest.mock('child_process');
jest.mock('../src/llm');

describe('Handoff Command', () => {
  let tmpDir;

  function write(rel, content = '# x\n') {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-handoff-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('AC-6: báo lỗi nếu không có việc active', async () => {
    await expect(handoff.execute(tmpDir)).rejects.toThrow('No active work found');
  });

  it('should throw error if no git diff', async () => {
    write('specs/active/feature-a/tasks.md', 'Original Tasks Content');
    child_process.execSync.mockReturnValue('');

    await expect(handoff.execute(tmpDir)).rejects.toThrow('No uncommitted changes found');
  });

  it('AC-6: ghi tóm tắt vào tasks.md của việc active duy nhất', async () => {
    write('specs/active/feature-a/tasks.md', 'Original Tasks Content');
    child_process.execSync.mockReturnValue('some git diff');
    llm.generateHandoffSummary.mockResolvedValue('AI Handoff Summary');

    const saved = await handoff.execute(tmpDir);

    expect(saved).toBe(path.join('specs', 'active', 'feature-a', 'tasks.md'));
    const content = fs.readFileSync(path.join(tmpDir, saved), 'utf8');
    expect(content).toContain('Original Tasks Content');
    expect(content).toContain('AI Handoff Summary');
  });

  it('AC-6: nhiều việc active thì bắt buộc nêu tên và chỉ ghi vào việc được chọn', async () => {
    write('specs/active/a/tasks.md', 'A');
    write('specs/active/b/tasks.md', 'B');
    child_process.execSync.mockReturnValue('diff');
    llm.generateHandoffSummary.mockResolvedValue('Summary');

    await expect(handoff.execute(tmpDir)).rejects.toThrow('Multiple active works found (a, b)');

    await handoff.execute(tmpDir, 'b');
    expect(fs.readFileSync(path.join(tmpDir, 'specs/active/b/tasks.md'), 'utf8')).toContain('Summary');
    expect(fs.readFileSync(path.join(tmpDir, 'specs/active/a/tasks.md'), 'utf8')).toBe('A');
  });

  it('báo lỗi nếu việc active không có tasks.md', async () => {
    write('specs/active/a/proposal.md');

    await expect(handoff.execute(tmpDir)).rejects.toThrow('No tasks.md found');
  });

  describe('AC-7: cùng nguồn diff với review', () => {
    /** Section diff giả dài đúng `size` ký tự cho file `name`. */
    function section(name, size) {
      const header = `diff --git a/${name} b/${name}\n`;
      return `${header}${'x'.repeat(size - header.length - 1)}\n`;
    }

    function mockGit(diff, untracked = '') {
      child_process.execSync.mockImplementation((command) => (command.startsWith('git ls-files') ? untracked : diff));
    }

    beforeEach(() => {
      write('specs/active/a/tasks.md', 'Tasks');
      llm.generateHandoffSummary.mockResolvedValue('Summary');
    });

    it('diff dài hơn giới hạn thì khối Handoff Session có cảnh báo chỉ tóm tắt một phần', async () => {
      mockGit(section('big.js', 20000));

      await handoff.execute(tmpDir);

      expect(fs.readFileSync(path.join(tmpDir, 'specs/active/a/tasks.md'), 'utf8')).toContain(
        'Only the first 15000 of 20000 characters of the diff were summarized.'
      );
    });

    it('diff trong giới hạn thì không có cảnh báo', async () => {
      mockGit(section('small.js', 500));

      await handoff.execute(tmpDir);

      expect(fs.readFileSync(path.join(tmpDir, 'specs/active/a/tasks.md'), 'utf8')).not.toContain('Only the first');
    });

    it('lock file bị bỏ khỏi diff gửi đi, và nội dung file mới chưa track được gồm vào', async () => {
      write('src/new.js', 'const brandNew = 1;\n');
      mockGit(section('src/a.js', 200) + section('package-lock.json', 40000), 'src/new.js\0');

      await handoff.execute(tmpDir);

      const sent = llm.generateHandoffSummary.mock.calls[0][0];
      expect(sent).not.toContain('package-lock.json');
      expect(sent).toContain('diff --git a/src/a.js b/src/a.js');
      expect(sent).toContain('+const brandNew = 1;');
    });

    it('chỉ có lock file thay đổi thì không có gì để handoff', async () => {
      mockGit(section('yarn.lock', 500));

      await expect(handoff.execute(tmpDir)).rejects.toThrow('No uncommitted changes found');
      expect(llm.generateHandoffSummary).not.toHaveBeenCalled();
    });

    it('báo lỗi rõ nếu git lỗi', async () => {
      child_process.execSync.mockImplementation(() => { throw new Error('fatal: not a git repository'); });

      await expect(handoff.execute(tmpDir)).rejects.toThrow('Not a git repository or git command failed.');
    });
  });
});
