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
  echo "🚨 [speckit-ai] ERROR: Ban da thay doi source code nhung CHUA cap nhat tai lieu!"
  echo "👉 Vui long cap nhat Spec/Docs (thu muc specs/ hoac docs/)."
  echo "👉 Hoac bo qua kiem tra nay bang lenh: git commit --no-verify"
  echo ""
  exit 1
fi

exit 0
`;

/**
 * Cài đặt native git hook vào thư mục .git/hooks
 * @param {string} targetDir 
 * @returns {boolean} true nếu cài đặt thành công, false nếu không tìm thấy .git
 */
function installHook(targetDir) {
  const gitHooksDir = path.join(targetDir, '.git', 'hooks');
  
  if (!fs.existsSync(gitHooksDir)) {
    console.error(`[speckit-ai] ❌ Error: Khong tim thay thu muc .git/hooks tai ${targetDir}. Ban da chay git init chua?`);
    return false;
  }

  const hookPath = path.join(gitHooksDir, 'pre-commit');
  
  try {
    fs.writeFileSync(hookPath, HOOK_CONTENT, 'utf8');
    // Set quyền thực thi (chmod +x) cho file trên Unix systems
    try {
      fs.chmodSync(hookPath, '755');
    } catch (chmodErr) {
      // Bỏ qua lỗi chmod trên Windows vì không cần thiết
    }
    
    console.log(`[speckit-ai] ✅ Cai dat Native Git Hook thanh cong tai: .git/hooks/pre-commit`);
    return true;
  } catch (err) {
    console.error(`[speckit-ai] ❌ Error: Khong the ghi file hook. ${err.message}`);
    return false;
  }
}

module.exports = { installHook, HOOK_CONTENT };
