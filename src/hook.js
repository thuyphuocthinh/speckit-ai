'use strict';

const fs = require('fs');
const path = require('path');

const HOOK_CONTENT = `#!/bin/sh
# speckit-ai pre-commit hook

CHANGED_FILES=$(git diff --cached --name-only)
HAS_SOURCE_CHANGE=0
HAS_DOC_CHANGE=0

for FILE in $CHANGED_FILES; do
  if echo "$FILE" | grep -Eq '(\\.js|\\.ts|\\.go|\\.py|\\.java|\\.php|\\.cs|\\.rb|\\.rs|\\.c|\\.cpp|\\.h)$'; then
    HAS_SOURCE_CHANGE=1
  fi
  if echo "$FILE" | grep -Eq '^(specs/|docs/)'; then
    HAS_DOC_CHANGE=1
  fi
done

if [ $HAS_SOURCE_CHANGE -eq 1 ] && [ $HAS_DOC_CHANGE -eq 0 ]; then
  echo ""
  echo "🚨 [speckit-ai] ERROR: You modified source code but DID NOT update the specs/docs!"
  echo "👉 Please update the documentation in 'specs/' or 'docs/' folder before committing."
  echo "👉 Or bypass this check by using: git commit --no-verify"
  echo ""
  exit 1
fi

echo "🔍 [speckit-ai] Linting specs..."
if ! npx speckit-ai lint; then
  echo ""
  echo "🚨 [speckit-ai] ERROR: Spec linting failed. Please add the missing sections to your specs."
  echo ""
  exit 1
fi

exit 0
`;

const COMMIT_MSG_HOOK_CONTENT = `#!/bin/sh
# speckit-ai commit-msg hook

# Call speckit-ai to verify commit message
npx speckit-ai verify-commit "$1"
`;

/**
 * Cài đặt native git hook vào thư mục .git/hooks
 * @param {string} targetDir 
 * @returns {boolean} true nếu cài đặt thành công, false nếu không tìm thấy .git
 */
function installHook(targetDir) {
  const gitHooksDir = path.join(targetDir, '.git', 'hooks');
  
  if (!fs.existsSync(gitHooksDir)) {
    console.error(`[speckit-ai] ❌ Error: Could not find .git/hooks directory at ${targetDir}. Did you run 'git init'?`);
    return false;
  }

  const hookPath = path.join(gitHooksDir, 'pre-commit');
  const commitMsgHookPath = path.join(gitHooksDir, 'commit-msg');
  
  try {
    fs.writeFileSync(hookPath, HOOK_CONTENT, 'utf8');
    fs.writeFileSync(commitMsgHookPath, COMMIT_MSG_HOOK_CONTENT, 'utf8');
    // Set quyền thực thi (chmod +x) cho file trên Unix systems
    try {
      fs.chmodSync(hookPath, '755');
      fs.chmodSync(commitMsgHookPath, '755');
    } catch (chmodErr) {
      // Bỏ qua lỗi chmod trên Windows vì không cần thiết
    }
    
    console.log(`[speckit-ai] ✅ Native Git Hooks successfully installed at: .git/hooks/pre-commit and .git/hooks/commit-msg`);
    return true;
  } catch (err) {
    console.error(`[speckit-ai] ❌ Error: Could not write hook files. ${err.message}`);
    return false;
  }
}

module.exports = { installHook, HOOK_CONTENT, COMMIT_MSG_HOOK_CONTENT };
