'use strict';

const fs = require('fs');
const path = require('path');

/** Dòng đánh dấu hook do speckit-ai tạo, dùng để nhận biết khi cài lại. */
const HOOK_MARKER = '# speckit-ai pre-commit hook';

const HOOK_CONTENT = `#!/bin/sh
${HOOK_MARKER}

echo "🔍 [speckit-ai] Linting specs..."
if ! npx speckit-ai lint; then
  echo ""
  echo "🚨 [speckit-ai] ERROR: Spec linting failed. Please fix the specs above."
  echo "👉 Or bypass this check by using: git commit --no-verify"
  echo ""
  exit 1
fi

exit 0
`;

/**
 * Cài đặt native git hook pre-commit vào .git/hooks.
 * - Không ghi đè hook pre-commit không phải của speckit-ai, trừ khi có force.
 * - Dọn hook commit-msg cũ của speckit-ai (gọi verify-commit, lệnh đã bị xóa).
 * @param {string} targetDir
 * @param {{ force?: boolean }} [options]
 * @returns {boolean} true nếu cài đặt thành công, false nếu không cài được
 */
function installHook(targetDir, { force = false } = {}) {
  const gitHooksDir = path.join(targetDir, '.git', 'hooks');

  if (!fs.existsSync(gitHooksDir)) {
    console.error(`[speckit-ai] ❌ Error: Could not find .git/hooks directory at ${targetDir}. Did you run 'git init'?`);
    return false;
  }

  const hookPath = path.join(gitHooksDir, 'pre-commit');

  if (fs.existsSync(hookPath) && !force) {
    const existing = fs.readFileSync(hookPath, 'utf8');
    if (!existing.includes(HOOK_MARKER)) {
      console.error('[speckit-ai] ❌ Error: A pre-commit hook that was not created by speckit-ai already exists.');
      console.error('[speckit-ai] 👉 Re-run with --force to overwrite it.');
      return false;
    }
  }

  try {
    fs.writeFileSync(hookPath, HOOK_CONTENT, 'utf8');
    // Set quyền thực thi (chmod +x) cho file trên Unix systems
    try {
      fs.chmodSync(hookPath, '755');
    } catch (chmodErr) {
      // Bỏ qua lỗi chmod trên Windows vì không cần thiết
    }

    removeLegacyCommitMsgHook(gitHooksDir);

    console.log(`[speckit-ai] ✅ Native Git Hook successfully installed at: .git/hooks/pre-commit`);
    return true;
  } catch (err) {
    console.error(`[speckit-ai] ❌ Error: Could not write hook file. ${err.message}`);
    return false;
  }
}

/**
 * Xóa hook commit-msg do bản speckit-ai cũ cài (nếu có); không đụng vào hook của người khác.
 */
function removeLegacyCommitMsgHook(gitHooksDir) {
  const commitMsgPath = path.join(gitHooksDir, 'commit-msg');
  if (!fs.existsSync(commitMsgPath)) return;

  const content = fs.readFileSync(commitMsgPath, 'utf8');
  if (content.includes('speckit-ai verify-commit')) {
    fs.unlinkSync(commitMsgPath);
    console.log('[speckit-ai] 🧹 Removed legacy commit-msg hook (verify-commit no longer exists).');
  }
}

module.exports = { installHook, HOOK_CONTENT, HOOK_MARKER };
