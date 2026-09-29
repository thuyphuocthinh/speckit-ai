const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const llm = require('./llm');

async function execute(targetDir) {
  let diff = '';
  try {
    diff = execSync('git diff', { cwd: targetDir, encoding: 'utf-8' });
    const untracked = execSync('git ls-files --others --exclude-standard', { cwd: targetDir, encoding: 'utf-8' });
    if (untracked) diff += '\nUntracked files:\n' + untracked;
  } catch (err) {
    throw new Error('Not a git repository or git command failed.');
  }

  if (!diff.trim()) throw new Error('No uncommitted changes found. Nothing to handoff.');

  const changesDir = path.join(targetDir, 'changes');
  if (!fs.existsSync(changesDir)) throw new Error('No changes/ directory found.');
  
  const activeFeatures = fs.readdirSync(changesDir).filter(f => fs.statSync(path.join(changesDir, f)).isDirectory());
  if (activeFeatures.length === 0) throw new Error('No active features found in changes/ directory.');
  
  let latestTaskFile = null;
  let latestTime = 0;
  
  for (const feature of activeFeatures) {
    const taskPath = path.join(changesDir, feature, 'tasks.md');
    if (fs.existsSync(taskPath)) {
      const stats = fs.statSync(taskPath);
      if (stats.mtimeMs > latestTime) {
        latestTime = stats.mtimeMs;
        latestTaskFile = taskPath;
      }
    }
  }

  if (!latestTaskFile) throw new Error('No tasks.md found in any active feature in changes/');

  const summary = await llm.generateHandoffSummary(diff);
  
  const currentContent = fs.readFileSync(latestTaskFile, 'utf-8');
  const timestamp = new Date().toLocaleString();
  const appendContent = `\n\n## 🔄 Handoff Session (${timestamp})\n\n${summary}\n`;
  fs.writeFileSync(latestTaskFile, currentContent + appendContent);
  
  return path.relative(targetDir, latestTaskFile);
}

module.exports = { execute };
