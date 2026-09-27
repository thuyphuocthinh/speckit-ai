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
 * Nhận object dependencies (đã merge deps + devDeps),
 * trả về frameworkId theo thứ tự ưu tiên.
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
 * Detect package manager dựa vào lock file.
 */
function detectPackageManager(targetDir) {
  if (fs.existsSync(path.join(targetDir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'npm';
}

/**
 * Entry point: phân tích targetDir và trả về { framework, packageManager }.
 */
function detect(targetDir) {
  const pkg = readPackageJson(targetDir);
  const deps = {
    ...( pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  const framework = detectFramework(deps);
  const packageManager = detectPackageManager(targetDir);
  return { framework, packageManager };
}

module.exports = { detect, detectFramework, detectPackageManager, readPackageJson };
