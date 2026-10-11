const fs = require('fs');
const path = require('path');
const llm = require('./llm');
const { collectDiff, chunkDiff } = require('./gitdiff');
const { resolveActive } = require('./features');

/**
 * Review code (git diff) so với các spec trong targets/ của việc đang làm và AGENTS.md.
 * Diff dài được chia theo file và review từng phần; chỉ passed khi mọi phần passed.
 * @param {string} [name] - tên việc active; bỏ trống nếu chỉ có một việc
 * @param {string} targetDir
 * @param {string|null} [referenceFile] - file code mẫu để so sánh (đường dẫn từ root project)
 * @returns {Promise<{ success: boolean, errors: string[], skipped: string[] }>} skipped: file không được review (lock file)
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

  const diff = collectDiff(targetDir);
  if (!diff.trim()) throw new Error('No code changes to review.');

  const { chunks, skipped } = chunkDiff(diff);
  if (chunks.length === 0) {
    throw new Error(`No code changes to review (not reviewed: ${skipped.join(', ')}).`);
  }

  const results = [];
  for (const chunk of chunks) {
    results.push(await llm.reviewCode(specContent, agentsContent, chunk, refContent));
  }

  return {
    success: results.every((result) => result.success),
    errors: results.flatMap((result) => result.errors || []),
    skipped,
  };
}

module.exports = { analyze };
