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
  npx speckit-ai start "<title or idea>" [--affects=<feature>,<feature>] [--baseline]
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
  start "<Title>" --baseline       Write the spec of code that already exists (no tasks/review needed at done)
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

/** Các cờ hợp lệ của từng lệnh (không tính --help). '' là lệnh mặc định (scaffold). */
const ALLOWED_FLAGS = {
  '': ['mode', 'init-hook', 'force'],
  idea: [],
  start: ['affects', 'baseline'],
  done: ['force'],
  status: ['json'],
  generate: ['for', 'work'],
  g: ['for', 'work'],
  lint: [],
  handoff: [],
  review: ['ref'],
  serve: [],
};

/** Khoảng cách chỉnh sửa Levenshtein, dùng để gợi ý khi gõ sai tên cờ. */
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Báo lỗi khi gặp cờ không thuộc lệnh (tránh gõ sai như --afects mà không ai biết).
 */
function checkFlags(command, flags) {
  const allowed = ALLOWED_FLAGS[command === undefined ? '' : command];
  if (!allowed) return; // lệnh không nhận diện được sẽ do nhánh default xử lý

  for (const name of Object.keys(flags)) {
    if (name === 'help' || allowed.includes(name)) continue;

    const closest = allowed
      .map((flag) => ({ flag, distance: editDistance(name, flag) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const suggestion = closest && closest.distance <= 2 ? ` Did you mean --${closest.flag}?` : '';
    const valid = allowed.length > 0
      ? ` Valid options: ${allowed.map((flag) => `--${flag}`).join(', ')}.`
      : ' This command takes no options.';
    const where = command === undefined ? 'the default command' : `"${command}"`;
    throw new Error(`Unknown option --${name} for ${where}.${suggestion}${valid}`);
  }
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

  checkFlags(command, flags);

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
      if (flags.baseline !== undefined && flags.baseline !== true) {
        throw new Error('--baseline does not take a value');
      }
      lifecycle.startWork(
        text,
        { affects: parseList(valueFlag(flags, 'affects')), baseline: flags.baseline === true },
        targetDir
      );
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

    case 'verify-commit':
      // Cầu nối tạm: hook commit-msg cũ của bản 1.x vẫn gọi lệnh này, không được chặn commit
      console.error('[speckit-ai] ⚠️  verify-commit was removed in 2.0. Run "npx speckit-ai --init-hook" to remove the old commit-msg hook.');
      return 0;

    default:
      console.error(`[speckit-ai] ❌ Unknown command: ${command}`);
      console.error('[speckit-ai] Run with --help to see usage.');
      return 1;
  }
}

module.exports = { run, parseArgs, HELP };
