const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const llm = require('./llm');
const { resolveActive } = require('./features');

/**
 * Review code (git diff) so với các spec trong targets/ của việc đang làm và AGENTS.md.
 * @param {string} [name] - tên việc active; bỏ trống nếu chỉ có một việc
 * @param {string} targetDir
 * @param {string|null} [referenceFile] - file code mẫu để so sánh (đường dẫn từ root project)
 */
async function analyze(name, targetDir, referenceFile = null) {
  const { dir } = resolveActive(targetDir, name);

  const targetsDir = path.join(dir, 'targets');
  const targetFiles = fs.existsSync(targetsDir)
    ? fs.readdirSync(targetsDir).filter((f) => f.endsWith('.md')).sort()
    : [];
  if (targetFiles.length === 0) {
    throw new Error(`No target specs found in ${path.relative(targetDir, targetsDir)}.`);
  }

  const specContent = targetFiles
    .map((f) => `<!-- ${f} -->\n${fs.readFileSync(path.join(targetsDir, f), 'utf-8')}`)
    .join('\n\n');

  const agentsPath = path.join(targetDir, '.agents', 'AGENTS.md');
  const agentsContent = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, 'utf-8') : '';

  let refContent = '';
  if (referenceFile) {
    const fullRefPath = path.join(targetDir, referenceFile);
    if (fs.existsSync(fullRefPath)) refContent = fs.readFileSync(fullRefPath, 'utf-8');
  }

  let diff = '';
  try { diff = execSync('git diff HEAD', { cwd: targetDir, encoding: 'utf-8' }); }
  catch (err) { diff = execSync('git diff', { cwd: targetDir, encoding: 'utf-8' }); }

  if (!diff.trim()) throw new Error('No code changes to review.');

  return await llm.reviewCode(specContent, agentsContent, diff, refContent);
}

module.exports = { analyze };
