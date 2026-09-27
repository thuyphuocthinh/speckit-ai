'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Đọc file cấu hình tại targetDir (ưu tiên .speckitrc, sau đó là speckit.config.json)
 * Trả về object config chứa templatesDir (là một đường dẫn tuyệt đối), hoặc {} nếu không có/không hợp lệ.
 * @param {string} targetDir
 * @returns {{ templatesDir?: string }}
 */
function loadConfig(targetDir) {
  const configFiles = ['.speckitrc', 'speckit.config.json'];
  
  for (const fileName of configFiles) {
    const configPath = path.join(targetDir, fileName);
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        if (parsed.templatesDir && typeof parsed.templatesDir === 'string') {
          const absolutePath = path.resolve(targetDir, parsed.templatesDir);
          
          if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
            return { templatesDir: absolutePath };
          } else {
            console.warn(`[speckit-ai] ⚠️  Warning: Custom templates directory "${parsed.templatesDir}" does not exist. Falling back to default templates.`);
          }
        }
      } catch (err) {
        console.warn(`[speckit-ai] ⚠️  Warning: Failed to parse ${fileName}. Ensure it contains valid JSON. Error: ${err.message}`);
      }
      
      // Nếu đã tìm thấy file config đầu tiên (kể cả lỗi) thì dừng lại, không thử file tiếp theo
      break;
    }
  }

  return {};
}

module.exports = { loadConfig };
