'use strict';

const colors = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', reset: '\x1b[0m' };

function printInfo(msg) {
  console.log(`${colors.yellow}🔄 ${msg}${colors.reset}`);
}

function printStep(msg) {
  console.log(`[speckit-ai] 🧠 ${msg}`);
}

function printSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function printError(msg, errors = []) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
  if (errors && errors.length > 0) {
    errors.forEach((err, i) => console.log(`${colors.red}  ${i + 1}. ${err}${colors.reset}`));
  }
}

function printWarning(msg) {
  console.warn(`${colors.yellow}⚠️ ${msg}${colors.reset}`);
}

module.exports = { printInfo, printStep, printSuccess, printError, printWarning };
