'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Đọc và parse package.json tại targetDir.
 * Return {} nếu không tồn tại hoặc parse lỗi.
 */
function readPackageJson(targetDir) {
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Phân tích package.json và trả về framework (JS ecosystem)
 */
function detectFramework(deps) {
  if (deps['@nestjs/core']) return 'nestjs';
  if (deps['next']) return 'nextjs';           // ưu tiên hơn react
  if (deps['vue']) return 'vue';
  if (deps['react']) return 'react';
  if (deps['express'] || deps['fastify']) return 'node-express';
  return 'generic';
}

/**
 * Phân tích Python
 */
function detectPython(targetDir) {
  const files = ['requirements.txt', 'Pipfile', 'pyproject.toml'];
  for (const file of files) {
    const p = path.join(targetDir, file);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8').toLowerCase();
      if (content.includes('django')) return 'python-django';
      if (content.includes('fastapi')) return 'python-fastapi';
      return 'python-generic';
    }
  }
  return null;
}

/**
 * Phân tích Go
 */
function detectGo(targetDir) {
  const p = path.join(targetDir, 'go.mod');
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8').toLowerCase();
    if (content.includes('gin-gonic/gin')) return 'go-gin';
    if (content.includes('gofiber/fiber')) return 'go-fiber';
    return 'go-generic';
  }
  return null;
}

/**
 * Detect package manager dựa vào lock file.
 */
function detectPackageManager(targetDir) {
  if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
}

/**
 * Phân tích 1 project đơn lẻ.
 */
function detectSingleProject(targetDir) {
  const py = detectPython(targetDir);
  if (py) return { type: 'single', framework: py, packageManager: 'pip' };

  const go = detectGo(targetDir);
  if (go) return { type: 'single', framework: go, packageManager: 'go-modules' };

  const pkg = readPackageJson(targetDir);
  if (Object.keys(pkg).length === 0) return null; // Không phải js, python, hay go

  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  const framework = detectFramework(deps);
  const packageManager = detectPackageManager(targetDir);
  
  return { type: 'single', framework, packageManager };
}

/**
 * Phân tích cấu trúc Monorepo
 */
function detectMonorepo(targetDir) {
  let tool = null;
  if (fs.existsSync(path.join(targetDir, 'turbo.json'))) tool = 'turborepo';
  else if (fs.existsSync(path.join(targetDir, 'nx.json'))) tool = 'nx';
  else if (fs.existsSync(path.join(targetDir, 'lerna.json'))) tool = 'lerna';
  else if (fs.existsSync(path.join(targetDir, 'pnpm-workspace.yaml'))) tool = 'pnpm-workspace';
  
  if (!tool) return null;

  const subProjects = [];
  const workspaces = ['apps', 'packages']; // Thư mục con phổ biến trong monorepo
  
  for (const ws of workspaces) {
    const wsPath = path.join(targetDir, ws);
    if (fs.existsSync(wsPath) && fs.statSync(wsPath).isDirectory()) {
      const children = fs.readdirSync(wsPath);
      for (const child of children) {
        const childPath = path.join(wsPath, child);
        if (fs.statSync(childPath).isDirectory()) {
          const single = detectSingleProject(childPath);
          if (single) {
            subProjects.push({
              name: child,
              path: path.join(ws, child).replace(/\\/g, '/'),
              framework: single.framework,
              packageManager: single.packageManager === 'npm' ? detectPackageManager(targetDir) : single.packageManager // fallback về root pkg manager
            });
          }
        }
      }
    }
  }

  return { type: 'monorepo', tool, subProjects };
}

/**
 * Entry point: phân tích targetDir và trả về object cấu hình của project.
 */
function detect(targetDir) {
  const mono = detectMonorepo(targetDir);
  if (mono && mono.subProjects.length > 0) return mono;

  const single = detectSingleProject(targetDir);
  if (single) return single;

  return { type: 'single', framework: 'generic', packageManager: 'npm' };
}

module.exports = { detect, detectFramework, detectPackageManager, readPackageJson, detectPython, detectGo, detectMonorepo, detectSingleProject };
