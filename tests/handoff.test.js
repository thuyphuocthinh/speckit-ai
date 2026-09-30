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
});
