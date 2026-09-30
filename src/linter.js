'use strict';

const fs = require('fs');
const path = require('path');
const { getPaths, listDirs, listActive } = require('./features');

/**
 * Lấy danh sách các thẻ heading (vd: '## Security', '### API') từ nội dung Markdown.
 * Hàm này chuẩn hóa chuỗi: chuyển sang lowercase, loại bỏ các số thứ tự ở đầu (vd '1. ', '2.1 ').
 */
function extractHeaders(content) {
  const headers = [];
  // Regex bắt các dòng bắt đầu bằng # (ít nhất 2 dấu # cho các sub-sections)
  const regex = /^(#{2,})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let rawText = match[2].trim();
    // Bỏ qua các số thứ tự ở đầu, vd "1. Overview", "2.1. Security", "IV. Conclusion"
    let cleanText = rawText.replace(/^([\d\.]+\s+)/, '').toLowerCase();
    headers.push({ level: match[1].length, text: cleanText, raw: rawText });
  }
  return headers;
}

/**
 * Liệt kê các file .md nằm trực tiếp trong một thư mục (không đệ quy).
 */
function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

/**
 * Gom các file cần lint theo bố cục ideas → active → features.
 * - specFiles: specs/features/<slug>/spec.md và specs/active/<tên>/targets/*.md
 * - adrFiles: mọi thư mục decisions/ (chung, theo feature, theo việc đang làm)
 * Chỉ quét các đường dẫn cố định nên plan/tasks/review, .history/ không bao giờ bị chấm.
 */
function collectFiles(targetDir) {
  const paths = getPaths(targetDir);
  const specFiles = [];
  const adrFiles = [];

  for (const slug of listDirs(paths.features)) {
    const specPath = path.join(paths.features, slug, 'spec.md');
    if (fs.existsSync(specPath)) specFiles.push(specPath);
    adrFiles.push(...listMarkdown(path.join(paths.features, slug, 'decisions')));
  }

  for (const name of listActive(targetDir)) {
    specFiles.push(...listMarkdown(path.join(paths.active, name, 'targets')));
    adrFiles.push(...listMarkdown(path.join(paths.active, name, 'decisions')));
  }

  adrFiles.push(...listMarkdown(paths.decisions));

  const isTemplate = (file) => /^(_template|0000-template)\.md$/.test(path.basename(file));
  return {
    specFiles: specFiles.filter((f) => !isTemplate(f)),
    adrFiles: adrFiles.filter((f) => !isTemplate(f)),
  };
}

/**
 * So các file với template: mỗi heading của template phải có mặt trong file.
 */
function lintFiles(files, templatePath, label) {
  const errors = [];

  if (files.length === 0) return { warnings: [], errors };

  if (!fs.existsSync(templatePath)) {
    return { warnings: [`⚠️ Template not found at ${templatePath}, skipping ${label}`], errors };
  }

  // Heading dạng "AC-1: ..." trong template chỉ là ví dụ của từng tiêu chí, không phải section bắt buộc
  const requiredHeaders = extractHeaders(fs.readFileSync(templatePath, 'utf8'))
    .filter((h) => !/^ac-\d+\b/.test(h.text));

  if (requiredHeaders.length === 0) {
    return { warnings: [`⚠️ No headers found in template ${templatePath}, skipping ${label}`], errors };
  }

  for (const file of files) {
    const fileHeaders = extractHeaders(fs.readFileSync(file, 'utf8'));
    const missingHeaders = [];

    for (const req of requiredHeaders) {
      // Tìm xem header yêu cầu có nằm trong file đang check không
      const found = fileHeaders.some(h => h.text === req.text && h.level === req.level);
      if (!found) {
        missingHeaders.push(req.raw);
      }
    }

    if (missingHeaders.length > 0) {
      errors.push({ file, missing: missingHeaders });
    }
  }

  return { warnings: [], errors };
}

/**
 * Quét toàn bộ dự án.
 */
function lint(targetDir) {
  const paths = getPaths(targetDir);
  const { specFiles, adrFiles } = collectFiles(targetDir);

  const results = [
    lintFiles(specFiles, path.join(paths.specs, '_template.md'), 'specs'),
    lintFiles(adrFiles, path.join(paths.decisions, '0000-template.md'), 'decisions'),
  ];

  const totalWarnings = results.flatMap((r) => r.warnings);
  const totalErrors = results.flatMap((r) => r.errors);

  // Báo cáo
  for (const warning of totalWarnings) {
    console.warn(`[speckit-ai] ${warning}`);
  }

  if (totalErrors.length > 0) {
    for (const err of totalErrors) {
      const relFile = path.relative(targetDir, err.file);
      console.error(`[speckit-ai] ❌ Error in ${relFile}`);
      for (const m of err.missing) {
        console.error(`             - Missing required section: "${m}"`);
      }
    }
    console.error(`\n[speckit-ai] 💥 Lint failed. ${totalErrors.length} file(s) are missing required sections.`);
    return false;
  }

  console.log('[speckit-ai] ✅ All specs are well-formatted. Excellent!');
  return true;
}

module.exports = { lint, extractHeaders, collectFiles };
