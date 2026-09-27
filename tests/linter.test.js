const fs = require('fs');
const path = require('path');
const os = require('os');
const { lint, extractHeaders } = require('../src/linter');

describe('Spec Linter', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-linter-'));
    // Setup directory structure
    fs.mkdirSync(path.join(tmpDir, 'specs', 'features'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'docs', 'adrs'), { recursive: true });

    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('extractHeaders normalizes correctly', () => {
    const markdown = `
# Title
## 1. Overview
### 2.1 Security
## Edge Cases
`;
    const headers = extractHeaders(markdown);
    expect(headers).toEqual([
      { level: 2, text: 'overview', raw: '1. Overview' },
      { level: 3, text: 'security', raw: '2.1 Security' },
      { level: 2, text: 'edge cases', raw: 'Edge Cases' }
    ]);
  });

  test('lint returns true when specs match template', () => {
    // Template
    fs.writeFileSync(path.join(tmpDir, 'specs', '_template.md'), '## Overview\n## Security\n');
    
    // Valid feature spec
    fs.writeFileSync(path.join(tmpDir, 'specs', 'features', 'valid.md'), '## Overview\nSome text.\n## Security\nSecure.');

    const result = lint(tmpDir);
    expect(result).toBe(true);
  });

  test('lint returns false when spec misses required header', () => {
    // Template
    fs.writeFileSync(path.join(tmpDir, 'specs', '_template.md'), '## 1. Overview\n## 2. Security\n');
    
    // Invalid feature spec (Missing Security)
    fs.writeFileSync(path.join(tmpDir, 'specs', 'features', 'invalid.md'), '## Overview\nSome text.');

    const result = lint(tmpDir);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Missing required section: "2. Security"'));
  });

  test('lint normalizes numbers correctly and matches', () => {
    // Template with numbers
    fs.writeFileSync(path.join(tmpDir, 'specs', '_template.md'), '## 1. Overview\n## 2. Security\n');
    
    // Spec without numbers but matching text
    fs.writeFileSync(path.join(tmpDir, 'specs', 'features', 'match.md'), '## overview\nSome text.\n## security\nSecure.');

    const result = lint(tmpDir);
    expect(result).toBe(true);
  });
});
