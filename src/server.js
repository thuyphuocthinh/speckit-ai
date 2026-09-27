'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const open = require('open');

const HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Specs & Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css">
  <style>
    /* Custom styling for a better docs experience */
    :root {
      --theme-color: #42b983;
    }
    .sidebar { font-weight: 500; }
  </style>
</head>
<body>
  <div id="app">Loading...</div>
  <script>
    window.$docsify = {
      name: 'Project Specs',
      repo: '',
      loadSidebar: true,
      subMaxLevel: 2,
      search: 'auto',
      themeColor: '#42b983',
      auto2top: true
    }
  </script>
  <script src="//cdn.jsdelivr.net/npm/docsify@4"></script>
  <script src="//cdn.jsdelivr.net/npm/docsify/lib/plugins/search.min.js"></script>
  <!-- Syntax highlighting support -->
  <script src="//cdn.jsdelivr.net/npm/prismjs@1/components/prism-bash.min.js"></script>
  <script src="//cdn.jsdelivr.net/npm/prismjs@1/components/prism-json.min.js"></script>
  <script src="//cdn.jsdelivr.net/npm/prismjs@1/components/prism-javascript.min.js"></script>
  <script src="//cdn.jsdelivr.net/npm/prismjs@1/components/prism-typescript.min.js"></script>
</body>
</html>
`;

/**
 * Đệ quy tạo markdown list từ cấu trúc thư mục.
 */
function buildSidebar(dir, baseDir) {
  let sidebar = '';
  
  if (!fs.existsSync(dir)) return sidebar;

  const items = fs.readdirSync(dir).sort((a, b) => {
    // Ưu tiên hiển thị file trước, folder sau
    const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
    const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
    if (aIsDir && !bIsDir) return 1;
    if (!aIsDir && bIsDir) return -1;
    return a.localeCompare(b);
  });

  for (const item of items) {
    if (item.startsWith('.') || item === '_template.md' || item === '_workflow.md' || item === '_sidebar.md') continue;
    
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    // Tính toán indent dựa trên độ sâu tương đối so với baseDir
    const relPath = path.relative(baseDir, fullPath);
    const depth = relPath.split(path.sep).length - 1;
    const indent = '  '.repeat(depth);

    if (stat.isDirectory()) {
      // Viết hoa chữ cái đầu cho đẹp
      const displayName = item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, ' ');
      sidebar += `${indent}* **${displayName}**\n`;
      sidebar += buildSidebar(fullPath, baseDir);
    } else if (item.endsWith('.md')) {
      let displayName = item.replace('.md', '').replace(/-/g, ' ');
      // Tự động viết hoa chữ cái đầu tiên của file
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      
      // Chuyển đổi đường dẫn thành chuẩn URL (dùng gạch chéo / thay vì \ trên Windows)
      const urlPath = relPath.split(path.sep).join('/');
      sidebar += `${indent}* [${displayName}](/${urlPath})\n`;
    }
  }

  return sidebar;
}

/**
 * Tạo nội dung file _sidebar.md tổng hợp cho toàn dự án
 */
function generateSidebarContent(targetDir) {
  let content = '';

  const docsDir = path.join(targetDir, 'docs');
  if (fs.existsSync(docsDir)) {
    content += '* **Docs**\n';
    content += buildSidebar(docsDir, targetDir);
    content += '\n';
  }

  const specsDir = path.join(targetDir, 'specs');
  if (fs.existsSync(specsDir)) {
    content += '* **Specs**\n';
    content += buildSidebar(specsDir, targetDir);
  }

  return content;
}

/**
 * Khởi động server
 */
function serve(targetDir) {
  console.log('[speckit-ai] 🚀 Generating navigation tree...');
  const sidebarContent = generateSidebarContent(targetDir);

  const app = express();

  // Middleware để phục vụ index.html ảo tại root
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(HTML_CONTENT);
  });

  // Middleware để phục vụ _sidebar.md ảo
  app.get('/_sidebar.md', (req, res) => {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(sidebarContent);
  });

  // Phục vụ các file tĩnh trong thư mục dự án (chỉ cho phép truy cập docs và specs)
  app.use('/docs', express.static(path.join(targetDir, 'docs')));
  app.use('/specs', express.static(path.join(targetDir, 'specs')));

  // Redirect các truy cập markdown file trực tiếp về docsify hash router
  // Docsify mặc định gọi trực tiếp file md
  app.use((req, res, next) => {
    if (req.path.endsWith('.md')) {
      const filePath = path.join(targetDir, req.path);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(fs.readFileSync(filePath, 'utf8'));
      } else {
        res.status(404).send('File not found');
      }
    } else {
      next();
    }
  });

  // Tìm port rảnh và khởi động server
  let port = 3000;
  
  const server = app.listen(port, '127.0.0.1')
    .on('listening', () => {
      console.log(`[speckit-ai] 🌐 Starting documentation server...`);
      console.log(`[speckit-ai] ✅ Server running at http://localhost:${port}`);
      console.log(`[speckit-ai] 🌍 Opening browser...`);
      console.log(`[speckit-ai] (Press Ctrl+C to stop)`);
      open(`http://localhost:${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        port++;
        server.listen(port, '127.0.0.1');
      } else {
        console.error(`[speckit-ai] ❌ Server error: ${err.message}`);
      }
    });
}

module.exports = { serve, generateSidebarContent, buildSidebar };
