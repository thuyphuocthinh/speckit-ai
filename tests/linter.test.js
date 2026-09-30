const fs = require('fs');
const path = require('path');
const os = require('os');
const { lint, extractHeaders, collectFiles } = require('../src/linter');

describe('Spec Linter', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-linter-'));

    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  function write(rel, content) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }

  function errorOutput() {
    return console.error.mock.calls.map((c) => c[0]).join('\n');
  }

  const SPEC_TEMPLATE = '## Overview\n## Security\n';
  const ADR_TEMPLATE = '## Context\n## Decision\n';
  const VALID_SPEC = '# Spec: X\n## Overview\nText.\n## Security\nSecure.\n';

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

  test('lint returns true when feature specs match template', () => {
    write('specs/_template.md', SPEC_TEMPLATE);
    write('specs/features/auth/spec.md', VALID_SPEC);

    expect(lint(tmpDir)).toBe(true);
  });

  test('lint returns false when spec misses required header', () => {
    write('specs/_template.md', '## 1. Overview\n## 2. Security\n');
    write('specs/features/auth/spec.md', '## Overview\nSome text.');

    expect(lint(tmpDir)).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Missing required section: "2. Security"'));
  });

  test('heading ví dụ "### AC-n: ..." trong template không phải section bắt buộc', () => {
    write('specs/_template.md', '## Overview\n## Acceptance Criteria\n### AC-1: <Short name>\n');
    write('specs/features/auth/spec.md', '## Overview\nx\n## Acceptance Criteria\n### AC-1: Login works\n');
    write('specs/features/order/spec.md', '## Overview\nx\n## Acceptance Criteria\nno ACs yet\n');

    expect(lint(tmpDir)).toBe(true);
  });

  test('lint normalizes numbers correctly and matches', () => {
    write('specs/_template.md', '## 1. Overview\n## 2. Security\n');
    write('specs/features/auth/spec.md', '## overview\nSome text.\n## security\nSecure.');

    expect(lint(tmpDir)).toBe(true);
  });

  test('AC-1: chỉ chấm spec.md, không chấm plan/tasks/review của feature', () => {
    write('specs/_template.md', SPEC_TEMPLATE);
    write('specs/features/auth/spec.md', VALID_SPEC);
    write('specs/features/auth/plan.md', '# Plan\n');
    write('specs/features/auth/tasks.md', '# Tasks\n- [ ] a\n');
    write('specs/features/auth/review.md', '# Review\n');

    expect(lint(tmpDir)).toBe(true);
  });

  test('AC-1: chấm targets/*.md của việc đang làm, không chấm proposal/plan/tasks/review', () => {
    write('specs/_template.md', SPEC_TEMPLATE);
    write('specs/active/add-2fa/proposal.md', '# Proposal\n');
    write('specs/active/add-2fa/plan.md', '# Plan\n');
    write('specs/active/add-2fa/tasks.md', '# Tasks\n');
    write('specs/active/add-2fa/review.md', '# Review\n');
    write('specs/active/add-2fa/targets/auth.md', '## Overview\nMissing security.');

    expect(lint(tmpDir)).toBe(false);
    const messages = errorOutput();
    expect(messages).toContain('targets');
    expect(messages).not.toContain('proposal.md');
    expect(messages).not.toContain('plan.md');
    expect(messages).toContain('1 file(s)');
  });

  test('AC-1: bỏ qua .history, ideas, và thư mục feature không có spec.md', () => {
    write('specs/_template.md', SPEC_TEMPLATE);
    write('specs/.history/2026-10-01-old/targets/auth.md', '# broken\n');
    write('specs/ideas/refund.md', '# Idea\n');
    write('specs/features/done/v01/spec.md', '# legacy\n');

    expect(lint(tmpDir)).toBe(true);
  });

  test('AC-1: ADR trong mọi thư mục decisions được so với template ADR', () => {
    write('specs/_template.md', SPEC_TEMPLATE);
    write('specs/decisions/0000-template.md', ADR_TEMPLATE);
    write('specs/decisions/0001-use-jwt.md', '## Context\nx\n## Decision\ny\n');
    write('specs/features/auth/decisions/0001-totp.md', '## Context\nonly\n');
    write('specs/active/add-2fa/decisions/0001-sms.md', '## Decision\nonly\n');

    expect(lint(tmpDir)).toBe(false);
    const messages = errorOutput();
    expect(messages).toContain('0001-totp.md');
    expect(messages).toContain('0001-sms.md');
    expect(messages).not.toContain('0001-use-jwt.md');
    expect(messages).toContain('2 file(s)');
  });

  test('cảnh báo khi thiếu template nhưng vẫn có file cần chấm', () => {
    write('specs/features/auth/spec.md', VALID_SPEC);

    expect(lint(tmpDir)).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Template not found'));
  });

  test('không có file nào cần chấm thì không cảnh báo thiếu template', () => {
    expect(lint(tmpDir)).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  test('collectFiles gom đúng spec và ADR, bỏ file template', () => {
    write('specs/features/auth/spec.md', VALID_SPEC);
    write('specs/decisions/0000-template.md', ADR_TEMPLATE);
    write('specs/decisions/0002-x.md', ADR_TEMPLATE);
    write('specs/active/a/targets/_template.md', SPEC_TEMPLATE);
    write('specs/active/a/targets/order.md', VALID_SPEC);

    const { specFiles, adrFiles } = collectFiles(tmpDir);
    const rel = (f) => path.relative(tmpDir, f).split(path.sep).join('/');
    expect(specFiles.map(rel)).toEqual([
      'specs/features/auth/spec.md',
      'specs/active/a/targets/order.md',
    ]);
    expect(adrFiles.map((f) => path.basename(f))).toEqual(['0002-x.md']);
  });
});
