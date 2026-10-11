'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/** Số ký tự diff tối đa gửi cho model trong một lần gọi. */
const MAX_DIFF_CHARS = 15000;

/** File sinh tự động, rất dài và không có gì để review: không gửi cho model. */
const IGNORED_FILES = new Set([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'go.sum',
  'poetry.lock',
  'Pipfile.lock',
  'composer.lock',
  'Cargo.lock',
  'Gemfile.lock',
]);

// stderr của git được thu lại (không in thẳng ra màn hình) để lỗi của lệnh git không làm rối output của CLI
const GIT_OPTIONS = { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] };

/**
 * Diff dạng "thêm mới" của một file chưa được git track, cùng định dạng với `git diff`.
 * @returns {string|null} null nếu file không đọc được (đã bị xóa, hoặc là thư mục)
 */
function untrackedSection(targetDir, file) {
  let buffer;
  try {
    buffer = fs.readFileSync(path.join(targetDir, file));
  } catch {
    return null;
  }

  const header = `diff --git a/${file} b/${file}\nnew file mode 100644\n`;
  if (buffer.includes(0)) return `${header}Binary file ${file} (new, not shown)\n`;

  const lines = buffer.toString('utf8').split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  if (lines.length === 0) return header;

  const body = lines.map((line) => `+${line}`).join('\n');
  return `${header}--- /dev/null\n+++ b/${file}\n@@ -0,0 +1,${lines.length} @@\n${body}\n`;
}

/**
 * Thu thập mọi thay đổi chưa commit: đã stage và chưa stage (so với HEAD), cộng nội dung các file mới chưa track.
 * File bị `.gitignore` / `.git/info/exclude` loại không nằm trong kết quả.
 * @param {string} targetDir
 * @returns {string} diff; chuỗi rỗng nếu không có thay đổi
 * @throws nếu không phải git repo hoặc lệnh git lỗi
 */
function collectDiff(targetDir) {
  let diff;
  try {
    diff = execSync('git diff HEAD', { cwd: targetDir, ...GIT_OPTIONS });
  } catch {
    diff = execSync('git diff', { cwd: targetDir, ...GIT_OPTIONS }); // repo chưa có commit nào (không có HEAD)
  }

  const untracked = execSync('git ls-files --others --exclude-standard -z', { cwd: targetDir, ...GIT_OPTIONS });
  const sections = untracked
    .split('\0')
    .filter(Boolean)
    .map((file) => untrackedSection(targetDir, file))
    .filter(Boolean);
  if (sections.length === 0) return diff;

  const separator = diff && !diff.endsWith('\n') ? '\n' : '';
  return diff + separator + sections.join('');
}

/**
 * Tách diff thành từng phần theo file (mỗi phần bắt đầu bằng `diff --git`).
 * Phần đứng trước dòng `diff --git` đầu tiên (nếu có) có `file` là null.
 * @returns {Array<{ file: string|null, text: string }>}
 */
function splitByFile(diff) {
  return diff
    .split(/^(?=diff --git )/m)
    .filter(Boolean)
    .map((text) => {
      const match = text.match(/^diff --git a\/.+? b\/(.+)$/m);
      return { file: match ? match[1].trim() : null, text };
    });
}

/**
 * Bỏ các phần diff của file không cần review (lock file).
 * @returns {{ diff: string, skipped: string[] }}
 */
function filterIgnored(diff) {
  const skipped = [];
  const kept = [];
  for (const { file, text } of splitByFile(diff)) {
    if (file && IGNORED_FILES.has(path.posix.basename(file))) skipped.push(file);
    else kept.push(text);
  }
  return { diff: kept.join(''), skipped };
}

/**
 * Chia diff thành các phần không quá `max` ký tự, theo ranh giới file (không bao giờ cắt giữa chừng).
 * @returns {{ chunks: string[], skipped: string[] }} skipped là các file không cần review
 * @throws nếu diff của một file đơn lẻ vượt `max`
 */
function chunkDiff(diff, max = MAX_DIFF_CHARS) {
  const { diff: reviewable, skipped } = filterIgnored(diff);
  const chunks = [];
  let current = '';

  for (const { file, text } of splitByFile(reviewable)) {
    if (text.length > max) {
      throw new Error(`The diff of ${file || 'this change'} is ${text.length} characters, over the ${max} limit, so it cannot be reviewed in one piece. Review it by hand or split the change.`);
    }
    if (current && current.length + text.length > max) {
      chunks.push(current);
      current = '';
    }
    current += text;
  }
  if (current) chunks.push(current);

  return { chunks, skipped };
}

module.exports = { MAX_DIFF_CHARS, collectDiff, splitByFile, filterIgnored, chunkDiff };
