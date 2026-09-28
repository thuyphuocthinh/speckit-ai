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

function generateChangeProposal(title, targetDir = process.cwd()) {
  if (!title) {
    throw new Error('Title is required. Example: npx speckit-ai propose "Add 2FA"');
  }

  const slug = toKebabCase(title);
  const changeDir = path.join(targetDir, 'changes', slug);

  if (fs.existsSync(changeDir)) {
    throw new Error(`Change "${slug}" already exists.`);
  }

  fs.mkdirSync(changeDir, { recursive: true });

  const proposalContent = `# Proposal: ${title}\n\n## Context & Problem\n<Why are we making this change?>\n\n## Proposed Solution\n<What is the high-level approach?>\n\n## Impact\n<Which systems/modules are affected?>\n`;
  const deltaSpecsContent = `# Delta Specs: ${title}\n\n## ADDED\n- <New spec logic>\n\n## MODIFIED\n- <Changed spec logic>\n\n## REMOVED\n- <Removed spec logic>\n`;
  const tasksContent = `# Tasks: ${title}\n\n- [ ] Update entity models (if any)\n- [ ] Implement code changes\n- [ ] Update/Add tests mapping to AC\n- [ ] Pass characterization tests (if legacy)\n- [ ] Review by PO/BA\n`;

  fs.writeFileSync(path.join(changeDir, 'proposal.md'), proposalContent, 'utf8');
  fs.writeFileSync(path.join(changeDir, 'delta-specs.md'), deltaSpecsContent, 'utf8');
  fs.writeFileSync(path.join(changeDir, 'tasks.md'), tasksContent, 'utf8');

  console.log(`[speckit-ai] 💡 Change proposal created at: changes/${slug}/`);
  console.log(`[speckit-ai] 👉 Open changes/${slug}/proposal.md to explain the "why".`);
}

function archiveChange(title, targetDir = process.cwd()) {
  if (!title) {
    throw new Error('Title is required. Example: npx speckit-ai archive "Add 2FA"');
  }

  const slug = toKebabCase(title);
  const changeDir = path.join(targetDir, 'changes', slug);

  if (!fs.existsSync(changeDir)) {
    throw new Error(`Change "${slug}" not found in changes/`);
  }

  const deltaSpecsPath = path.join(changeDir, 'delta-specs.md');
  const targetSpecDir = path.join(targetDir, 'specs', 'features', slug);
  const targetSpecPath = path.join(targetSpecDir, 'spec.md');

  // Copy delta specs to baseline specs
  if (fs.existsSync(deltaSpecsPath)) {
    fs.mkdirSync(targetSpecDir, { recursive: true });
    // In a real scenario, this might append to an existing spec or create a new one
    // For MVP, we copy it over
    fs.copyFileSync(deltaSpecsPath, targetSpecPath);
    console.log(`[speckit-ai] ✅ Baseline specs updated at specs/features/${slug}/spec.md`);
  }

  // Move change folder to archive
  const archiveDir = path.join(targetDir, 'archive', slug);
  fs.mkdirSync(path.dirname(archiveDir), { recursive: true });
  fs.renameSync(changeDir, archiveDir);
  console.log(`[speckit-ai] ✅ Change moved to archive/${slug}/`);
}

function findFileRecursively(dir, keyword) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const found = findFileRecursively(fullPath, keyword);
      if (found) return found;
    } else if (file.toLowerCase().includes(keyword.toLowerCase()) || fullPath.toLowerCase().includes(keyword.toLowerCase())) {
      return fullPath;
    }
  }
  return null;
}

function generateTestsFromSpec(keyword, targetDir = process.cwd()) {
  if (!keyword) {
    throw new Error('Spec keyword is required. Example: npx speckit-ai generate tests "UC-042" or "add-2fa"');
  }

  const specsDir = path.join(targetDir, 'specs');
  const specPath = findFileRecursively(specsDir, keyword);

  if (!specPath) {
    throw new Error(`Could not find any spec file matching "${keyword}" in specs/ directory.`);
  }

  const content = fs.readFileSync(specPath, 'utf8');
  
  // Extract Title
  let title = path.basename(specPath, '.md');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  // Extract ACs
  // Matches ### AC-1: Something or ### AC-1 Something
  const acRegex = /^###\s+(AC-\d+)[^\w]*(.+)$/gm;
  const acs = [];
  let match;
  while ((match = acRegex.exec(content)) !== null) {
    acs.push({ id: match[1], desc: match[2].trim() });
  }

  if (acs.length === 0) {
    console.log(`[speckit-ai] ⚠️ No Acceptance Criteria (AC) found in ${path.relative(targetDir, specPath)}.`);
    console.log(`[speckit-ai] 👉 Please add "### AC-1: <Description>" to your spec file.`);
    return;
  }

  const slug = toKebabCase(title);
  const testDir = path.join(targetDir, 'tests', 'specs');
  fs.mkdirSync(testDir, { recursive: true });
  
  const ext = fs.existsSync(path.join(targetDir, 'tsconfig.json')) ? 'ts' : 'js';
  const testFile = path.join(testDir, `${slug}.test.${ext}`);

  if (fs.existsSync(testFile)) {
    throw new Error(`Test file already exists: ${path.relative(targetDir, testFile)}`);
  }

  let testCode = `describe('${title.replace(/'/g, "\\'")}', () => {\n`;
  for (const ac of acs) {
    testCode += `  describe('${ac.id}: ${ac.desc.replace(/'/g, "\\'")}', () => {\n`;
    testCode += `    test('should satisfy acceptance criteria', () => {\n`;
    testCode += `      // TODO: Implement test for ${ac.id}\n`;
    testCode += `    });\n`;
    testCode += `  });\n\n`;
  }
  testCode += `});\n`;

  fs.writeFileSync(testFile, testCode, 'utf8');

  console.log(`[speckit-ai] ✅ Found ${acs.length} Acceptance Criteria in ${path.relative(targetDir, specPath)}`);
  console.log(`[speckit-ai] ✅ Generated test skeleton: ${path.relative(targetDir, testFile)}`);
  return testFile;
}

module.exports = { toKebabCase, getNextAdrNumber, generate, generateChangeProposal, archiveChange, generateTestsFromSpec };
