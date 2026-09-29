const reviewer = require('../src/reviewer');
const fs = require('fs');
const child_process = require('child_process');
const llm = require('../src/llm');

jest.mock('child_process');
jest.mock('fs');
jest.mock('../src/llm');

describe('Reviewer Command', () => {
  let exitSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('should return success when review passes', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock content');
    child_process.execSync.mockReturnValue('diff content');
    
    llm.reviewCode.mockResolvedValue({ success: true });

    const result = await reviewer.analyze('feature a', '/target');
    
    expect(llm.reviewCode).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('should return errors when review fails (violates SOLID or AC)', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock content');
    child_process.execSync.mockReturnValue('diff content');
    
    llm.reviewCode.mockResolvedValue({ success: false, errors: ['Violates Single Responsibility'] });

    const result = await reviewer.analyze('feature a', '/target');
    
    expect(llm.reviewCode).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Violates Single Responsibility');
  });
});
