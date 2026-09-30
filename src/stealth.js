'use strict';

const fs = require('fs');
const path = require('path');

/** Các entry cần thêm vào .git/info/exclude */
const STEALTH_ENTRIES = [
  '.agents/',
  'CLAUDE.md',
  '.cursorrules',
  'docs/',
  'specs/',
  '.speckitrc',
  'speckit.config.json',
];

/**
 * Tìm thư mục .git/ tại targetDir.
 * Trả về path tới .git/ hoặc null nếu không có.
 */
function findGitDir(targetDir) {
  const gitDir = path.join(targetDir, '.git');
  return fs.existsSync(gitDir) ? gitDir : null;
}

/**
 * Đọc nội dung file .git/info/exclude.
 * Trả về chuỗi rỗng nếu file chưa tồn tại.
 */
function readExcludeFile(gitDir) {
  const excludePath = path.join(gitDir, 'info', 'exclude');
  if (!fs.existsSync(excludePath)) return '';
  return fs.readFileSync(excludePath, 'utf8');
}

/**
 * Chỉ append những entry chưa có trong currentContent.
 * Trả về nội dung mới (không duplicate).
 */
function appendEntries(currentContent, entries) {
  const lines = currentContent.split('\n');
  let result = currentContent;

  for (const entry of entries) {
    const alreadyExists = lines.some(
      (line) => line.trim() === entry.trim()
    );
    if (!alreadyExists) {
      // Đảm bảo có newline trước khi append
      if (result.length > 0 && !result.endsWith('\n')) {
        result += '\n';
      }
      result += entry + '\n';
    }
  }

  return result;
}

/**
 * Áp dụng stealth mode: ghi STEALTH_ENTRIES vào .git/info/exclude.
 * Bỏ qua (không crash) nếu targetDir không phải git repo.
 */
function apply(targetDir) {
  const gitDir = findGitDir(targetDir);

  if (!gitDir) {
    console.log('[speckit-ai] ⚠️  Không tìm thấy .git/ — bỏ qua stealth mode');
    return;
  }

  // Đảm bảo thư mục .git/info/ tồn tại
  const infoDir = path.join(gitDir, 'info');
  if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
  }

  const excludePath = path.join(infoDir, 'exclude');
  const currentContent = readExcludeFile(gitDir);
  const newContent = appendEntries(currentContent, STEALTH_ENTRIES);

  fs.writeFileSync(excludePath, newContent, 'utf8');
  console.log('[speckit-ai] 🙈 Stealth mode: đã cập nhật .git/info/exclude');
}

module.exports = { apply, findGitDir, readExcludeFile, appendEntries, STEALTH_ENTRIES };
