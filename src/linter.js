'use strict';

const fs = require('fs');
const path = require('path');

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
 * Đọc tất cả các file trong một thư mục (đệ quy).
 */
function getMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getMarkdownFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Thực hiện Lint cho một thư mục cụ thể dựa trên template.
 */
function lintDirectory(targetDir, templatePath, scanDir) {
  const errors = [];
  
  if (!fs.existsSync(templatePath)) {
    return { warnings: [`⚠️ Template not found at ${templatePath}, skipping ${scanDir}`], errors };
  }

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const requiredHeaders = extractHeaders(templateContent);

  if (requiredHeaders.length === 0) {
    return { warnings: [`⚠️ No headers found in template ${templatePath}, skipping ${scanDir}`], errors };
  }

  const filesToLint = getMarkdownFiles(scanDir);
  // Loại trừ file template khỏi danh sách lint nếu nó nằm chung thư mục
  const filteredFiles = filesToLint.filter(f => path.basename(f) !== path.basename(templatePath) && path.basename(f) !== '_workflow.md');

  for (const file of filteredFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileHeaders = extractHeaders(content);
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
  let totalErrors = [];
  let totalWarnings = [];

  // Lint thư mục specs/features
  const featureTemplatePath = path.join(targetDir, 'specs', '_template.md');
  const featureScanDir = path.join(targetDir, 'specs', 'features');
  if (fs.existsSync(featureScanDir)) {
    const result = lintDirectory(targetDir, featureTemplatePath, featureScanDir);
    totalErrors = totalErrors.concat(result.errors);
    totalWarnings = totalWarnings.concat(result.warnings);
  }

  // Lint thư mục docs/adrs
  const adrTemplatePath = path.join(targetDir, 'docs', 'adrs', '0000-template.md');
  const adrScanDir = path.join(targetDir, 'docs', 'adrs');
  if (fs.existsSync(adrScanDir)) {
    const result = lintDirectory(targetDir, adrTemplatePath, adrScanDir);
    totalErrors = totalErrors.concat(result.errors);
    totalWarnings = totalWarnings.concat(result.warnings);
  }

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

module.exports = { lint, extractHeaders };
