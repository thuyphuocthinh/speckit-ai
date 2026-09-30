'use strict';

const { parseList } = require('./features');
const { loadEnv } = require('./env');
const { runInit, parseMode } = require('./init');
const hookManager = require('./hook');
const generator = require('./generator');
const linter = require('./linter');
const lifecycle = require('./lifecycle');
const done = require('./done');
const handoff = require('./handoff');
const reviewer = require('./reviewer');
const ui = require('./ui');

const HELP = `
speckit-ai — Scaffold spec-driven AI workspace docs and drive the SDD flow

Usage:
  npx speckit-ai [--mode=<mode>]
  npx speckit-ai --init-hook [--force]
  npx speckit-ai idea "<title>"
  npx speckit-ai start "<title or idea>" [--affects=<feature>,<feature>]
  npx speckit-ai done [<name>] [--force]
  npx speckit-ai status [--json]
  npx speckit-ai generate <adr|contract> "<title>" [--for=<feature>] [--work=<name>]
  npx speckit-ai generate tests [<name>]
  npx speckit-ai lint
  npx speckit-ai handoff [<name>]
  npx speckit-ai review [<name>] [--ref=<filepath>]
  npx speckit-ai serve

Options:
  --mode=new       (default) Generate Best Practices templates for your framework
  --mode=existing  Generate AI-PROMPT skeleton docs for an existing codebase
  --mode=auto      Auto-generate project docs based on your source code using LLM
  --init-hook      Install a native Git pre-commit hook that runs "lint" (--force overwrites another hook)
  --help           Show this help message

Commands (SDD flow: idea -> start -> done):
  idea "<Title>"                   Save an idea in specs/ideas/ (backlog)
  start "<Title|idea>"             Start a work in specs/active/ (a new feature, or --affects=<a,b> to change existing features)
  done [<name>] [--force]          Check gates, write specs to specs/features/, keep work files in specs/.history/
  status [--json]                  Show active works and ideas in dependency order
  generate adr "<Title>"           New decision record (next to the feature with --for, else the active work, else specs/decisions/)
  generate contract "<Title>"      New API/Data Contract (same placement rules as adr)
  generate tests [<name>]          Generate a test skeleton matching the ACs of the active work
  lint                             Lint spec files and decision records against templates
  handoff [<name>]                 Summarize uncommitted code and append to the active work's tasks.md
  review [<name>] [--ref=<path>]   Review code against the active work's specs and AGENTS.md
  serve                            Start local documentation web server

When several works are active, pass <name> (or --work=<name> for generate).
`;

/**
 * Tách tham số thành positional và flags (--key=value hoặc --key).
 */
function parseArgs(args) {
  const positional = [];
  const flags = {};
  for (const arg of args) {
    if (arg === '-h') {
      flags.help = true;
    } else if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq === -1) flags[arg.slice(2)] = true;
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

/**
 * Lấy giá trị của một cờ dạng --key=value; báo lỗi nếu cờ có mặt nhưng thiếu giá trị.
 */
function valueFlag(flags, name) {
  const value = flags[name];
  if (value === true || value === '') {
    throw new Error(`--${name} requires a value, e.g. --${name}=<value>`);
  }
  return value;
}

/**
 * Chạy một lệnh CLI.
 * @param {string[]} argv - tham số (không gồm node và script)
 * @param {string} targetDir - thư mục project
 * @returns {Promise<number|undefined>} exit code; undefined nghĩa là tiến trình cần chạy tiếp (serve)
 */
async function run(argv, targetDir) {
  try {
    return await dispatch(argv, targetDir);
  } catch (err) {
    console.error(`[speckit-ai] ❌ Error: ${err.message}`);
    return 1;
  }
}

async function dispatch(argv, targetDir) {
  const { positional, flags } = parseArgs(argv);

  if (flags.help) {
    console.log(HELP);
    return 0;
  }

  const [command, ...rest] = positional;
  const text = rest.join(' ');

  switch (command) {
    case undefined: {
      if (flags['init-hook']) {
        console.log('');
        console.log('[speckit-ai] 🚀 Installing Native Git Hook...');
        const installed = hookManager.installHook(targetDir, { force: Boolean(flags.force) });
        console.log('');
        return installed ? 0 : 1;
      }
      await runInit({ targetDir, mode: parseMode(flags.mode) });
      return 0;
    }

    case 'idea':
      lifecycle.createIdea(text, targetDir);
      return 0;

    case 'start':
      lifecycle.startWork(text, { affects: parseList(valueFlag(flags, 'affects')) }, targetDir);
      return 0;

    case 'done':
      done.finishWork(targetDir, { name: text || undefined, force: Boolean(flags.force) });
      return 0;

    case 'status':
      lifecycle.printStatus(targetDir, { json: Boolean(flags.json) });
      return 0;

    case 'generate':
    case 'g': {
      const [type, ...titleParts] = rest;
      if (!type) {
        throw new Error('Type is required. Example: speckit-ai generate adr "Use JWT"');
      }
      if (type === 'tests' || type === 't') {
        generator.generateTestsFromSpec(titleParts.join(' ') || undefined, targetDir);
        return 0;
      }
      generator.generate(
        type,
        titleParts.join(' '),
        { forFeature: valueFlag(flags, 'for'), work: valueFlag(flags, 'work') },
        targetDir
      );
      return 0;
    }

    case 'lint':
      console.log('[speckit-ai] 🔍 Linting specs...');
      return linter.lint(targetDir) ? 0 : 1;

    case 'serve':
      require('./server').serve(targetDir);
      return undefined;

    case 'handoff': {
      loadEnv(targetDir);
      ui.printInfo('Running speckit-ai handoff...');
      ui.printStep('Analyzing git diff and generating summary via AI...');
      const savedPath = await handoff.execute(targetDir, text || undefined);
      ui.printSuccess(`Handoff successful! Summary appended to: ${savedPath}`);
      return 0;
    }

    case 'review': {
      loadEnv(targetDir);
      const referenceFile = valueFlag(flags, 'ref') || null;
      ui.printInfo(`Running speckit-ai review${text ? ` for "${text}"` : ''}...`);
      ui.printStep('Sending Spec and Code Diff to AI for review...');
      const result = await reviewer.analyze(text || undefined, targetDir, referenceFile);
      if (result.success) {
        ui.printSuccess('REVIEW PASSED! Code matches specs and SOLID principles.');
        return 0;
      }
      ui.printError('REVIEW FAILED! Found the following issues:', result.errors);
      return 1;
    }

    default:
      console.error(`[speckit-ai] ❌ Unknown command: ${command}`);
      console.error('[speckit-ai] Run with --help to see usage.');
      return 1;
  }
}

module.exports = { run, parseArgs, HELP };
