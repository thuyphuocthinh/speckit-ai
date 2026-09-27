'use strict';

const fs = require('fs');
const path = require('path');

function toKebabCase(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Lược bỏ dấu tiếng Việt
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Loại bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-')             // Thay khoảng trắng bằng dấu gạch ngang
    .toLowerCase();
}

function getNextAdrNumber(adrsDir) {
  if (!fs.existsSync(adrsDir)) return '0001';
  const files = fs.readdirSync(adrsDir);
  let max = 0;
  for (const file of files) {
    const match = file.match(/^(\d{4})-/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return String(max + 1).padStart(4, '0');
}

function generate(type, title, targetDir = process.cwd()) {
  if (!title) {
    throw new Error('Title is required. Example: speckit-ai generate feature "Payment Gateway"');
  }

  const slug = toKebabCase(title);
  let tmplPath = '';
  let destPath = '';
  let replacedTitle = '';

  if (type === 'feature' || type === 'f') {
    tmplPath = path.join(targetDir, 'specs', '_template.md');
    destPath = path.join(targetDir, 'specs', 'features', slug, 'spec.md');
    replacedTitle = `# Spec: ${title}`;
  } else if (type === 'adr' || type === 'a') {
    tmplPath = path.join(targetDir, 'docs', 'adrs', '0000-template.md');
    const adrsDir = path.join(targetDir, 'docs', 'adrs');
    const nextNum = getNextAdrNumber(adrsDir);
    destPath = path.join(adrsDir, `${nextNum}-${slug}.md`);
    replacedTitle = `# ${title}`;
  } else if (type === 'contract' || type === 'c') {
    tmplPath = path.join(targetDir, 'specs', 'contracts', '_template.md');
    destPath = path.join(targetDir, 'specs', 'contracts', `${slug}.md`);
    replacedTitle = `# Contract: ${title}`;
  } else {
    throw new Error(`Unknown type: ${type}. Supported types: feature (f), adr (a), contract (c).`);
  }

  if (!fs.existsSync(tmplPath)) {
    throw new Error(`Template not found at ${path.relative(targetDir, tmplPath)}. Did you run 'npx speckit-ai' to initialize the project first?`);
  }

  if (fs.existsSync(destPath)) {
    throw new Error(`File already exists: ${path.relative(targetDir, destPath)}`);
  }

  const tmplContent = fs.readFileSync(tmplPath, 'utf8');
  
  // Replace the first H1 tag
  const newContent = tmplContent.replace(/^#\s+.+/m, replacedTitle);

  // Replace Date if present (ADR has Date: {{YEAR}}-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const finalContent = newContent.replace(/Date: .+/g, `Date: ${today}`);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, finalContent, 'utf8');

  console.log(`[speckit-ai] ✅ Generated ${type}: ${path.relative(targetDir, destPath)}`);
  return destPath;
}

module.exports = { toKebabCase, getNextAdrNumber, generate };
