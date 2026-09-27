#!/usr/bin/env node

'use strict';

const path = require('path');
const detector = require('../src/detector');
const scaffolder = require('../src/scaffolder');
const stealth = require('../src/stealth');

const VALID_MODES = ['new', 'existing'];

/**
 * Parse --mode=<value> from process.argv.
 * Returns { mode } or prints error + exits if invalid.
 */
function parseArgs(argv) {
  const modeArg = argv.find(arg => arg.startsWith('--mode='));
  const helpArg = argv.includes('--help') || argv.includes('-h');

  if (helpArg) {
    console.log(`
speckit-ai — Scaffold spec-driven AI workspace docs

Usage:
  npx speckit-ai [--mode=<mode>]

Options:
  --mode=new       (default) Generate Best Practices templates for your framework
  --mode=existing  Generate AI-PROMPT skeleton docs for an existing codebase
  --help           Show this help message
`);
    process.exit(0);
  }

  if (!modeArg) return { mode: 'new' };

  const mode = modeArg.split('=')[1];
  if (!VALID_MODES.includes(mode)) {
    console.error(`[speckit-ai] ❌ Invalid --mode="${mode}". Valid values: ${VALID_MODES.join(', ')}`);
    console.error('[speckit-ai] Run with --help to see usage.');
    process.exit(1);
  }

  return { mode };
}

async function main() {
  const { mode } = parseArgs(process.argv.slice(2));
  const targetDir = process.cwd();

  console.log('');
  console.log('[speckit-ai] 🚀 Setting up AI-first workspace...');
  console.log(`[speckit-ai] 📁 Directory: ${targetDir}`);
  console.log(`[speckit-ai] ⚙️  Mode: ${mode === 'existing' ? 'existing (AI-PROMPT skeletons)' : 'new (Best Practices templates)'}`);
  console.log('');

  // Step 1: Detect framework
  const { framework, packageManager } = detector.detect(targetDir);
  console.log(`[speckit-ai] 🔍 Detected: ${framework} / ${packageManager}`);
  console.log('');

  // Step 2: Scaffold
  console.log('[speckit-ai] 📝 Creating documentation structure...');
  const { created, skipped } = scaffolder.scaffold({ targetDir, framework, packageManager, mode });
  console.log('');
  console.log(`[speckit-ai] ✅ ${created} file(s) created, ${skipped} file(s) skipped (already exist)`);
  console.log('');

  // Step 3: Stealth mode
  stealth.apply(targetDir);
  console.log('');

  // Done
  console.log('[speckit-ai] 🎉 Done!');
  if (mode === 'existing') {
    console.log('[speckit-ai] 👉 Next: ask your AI agent to read docs/ and fill in the AI-PROMPT sections based on the actual codebase.');
  } else {
    console.log('[speckit-ai] 👉 Next: open .agents/AGENTS.md and adjust it for your project.');
  }
  console.log('');
}

main().catch((err) => {
  console.error('[speckit-ai] ❌ Error:', err.message);
  process.exit(1);
});
