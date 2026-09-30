#!/usr/bin/env node

'use strict';

const { run } = require('../src/cli');

run(process.argv.slice(2), process.cwd())
  .then((code) => {
    // undefined: lệnh chạy dài (serve), không thoát
    if (typeof code === 'number') process.exit(code);
  })
  .catch((err) => {
    console.error('[speckit-ai] ❌ Error:', err.message);
    process.exit(1);
  });
