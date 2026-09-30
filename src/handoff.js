const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const llm = require('./llm');
const { resolveActive } = require('./features');

/**
 * Tóm tắt tiến độ (git diff) bằng LLM và ghi vào tasks.md của việc đang làm.
 * @param {string} targetDir
 * @param {string} [name] - tên việc active; bỏ trống nếu chỉ có một việc
 * @returns {Promise<string>} đường dẫn tương đối của tasks.md đã ghi
 */
async function execute(targetDir, name) {
  const { dir } = resolveActive(targetDir, name);

  const tasksPath = path.join(dir, 'tasks.md');
  if (!fs.existsSync(tasksPath)) {
    throw new Error(`No tasks.md found in ${path.relative(targetDir, dir)}`);
  }

  let diff = '';
  try {
    diff = execSync('git diff', { cwd: targetDir, encoding: 'utf-8' });
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: targetDir, encoding: 'utf-8' });
    if (untracked) diff += '\nUntracked files:\n' + untracked;
  } catch (err) {
    throw new Error('Not a git repository or git command failed.');
  }

  if (!diff.trim()) throw new Error('No uncommitted changes found. Nothing to handoff.');

  const summary = await llm.generateHandoffSummary(diff);

  const currentContent = fs.readFileSync(tasksPath, 'utf-8');
  const timestamp = new Date().toLocaleString();
  const appendContent = `\n\n## 🔄 Handoff Session (${timestamp})\n\n${summary}\n`;
  fs.writeFileSync(tasksPath, currentContent + appendContent);

  return path.relative(targetDir, tasksPath);
}

module.exports = { execute };
