const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const llm = require('./llm');
const { toKebabCase } = require('./generator');

async function analyze(title, targetDir, referenceFile = null) {
  if (!title) throw new Error('Please provide the feature title. Usage: npx speckit-ai review "<Title>"');

  const featureSlug = toKebabCase(title);
  
  let specPath = path.join(targetDir, 'specs', 'features', featureSlug, 'spec.md');
  if (!fs.existsSync(specPath)) {
    specPath = path.join(targetDir, 'changes', featureSlug, 'delta-specs.md');
    if (!fs.existsSync(specPath)) {
       specPath = path.join(targetDir, 'changes', featureSlug, 'spec-draft.md');
       if (!fs.existsSync(specPath)) throw new Error(`Cannot find spec file for feature "${featureSlug}".`);
    }
  }

  const specContent = fs.readFileSync(specPath, 'utf-8');
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
