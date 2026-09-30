'use strict';

const path = require('path');

/**
 * Nạp file .env của project vào process.env (không ghi đè biến đã có, không in log).
 * Chỉ gọi cho các lệnh cần API key (--mode=auto, review, handoff).
 * @param {string} targetDir
 */
function loadEnv(targetDir) {
  require('dotenv').config({ path: path.join(targetDir, '.env'), quiet: true });
}

module.exports = { loadEnv };
