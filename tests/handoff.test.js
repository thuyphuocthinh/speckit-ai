const handoff = require('../src/handoff');
const fs = require('fs');
const child_process = require('child_process');
const llm = require('../src/llm');

jest.mock('child_process');
jest.mock('fs');
jest.mock('../src/llm');

describe('Handoff Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw error if no git diff', async () => {
    child_process.execSync.mockReturnValue('');
    await expect(handoff.execute('/target')).rejects.toThrow('No uncommitted changes found');
  });

  it('should append AI summary to latest tasks.md', async () => {
    child_process.execSync.mockReturnValue('some git diff');
    
    fs.existsSync.mockImplementation((p) => {
      if (p.includes('changes')) return true;
      if (p.includes('tasks.md')) return true;
      return false;
    });
    
    fs.readdirSync.mockReturnValue(['feature-a']);
    fs.statSync.mockReturnValue({ isDirectory: () => true, mtimeMs: 1000 });
    fs.readFileSync.mockReturnValue('Original Tasks Content');
    
    llm.generateHandoffSummary.mockResolvedValue('AI Handoff Summary');

    await handoff.execute('/target');

    expect(llm.generateHandoffSummary).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('tasks.md'),
      expect.stringContaining('AI Handoff Summary')
    );
  });
});
