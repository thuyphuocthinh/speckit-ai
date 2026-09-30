const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');
const reviewer = require('../src/reviewer');
const llm = require('../src/llm');

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
});
