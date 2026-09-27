'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { detect, detectFramework, detectPackageManager, readPackageJson, detectPython, detectGo, detectMonorepo } = require('../src/detector');

// Helper: tạo thư mục tạm để test
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'create-ai-docs-test-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- detectFramework ---
describe('detectFramework()', () => {
  test('detects nestjs khi có @nestjs/core', () => {
    expect(detectFramework({ '@nestjs/core': '^10.0.0' })).toBe('nestjs');
  });

  test('detects nextjs khi có next', () => {
    expect(detectFramework({ next: '^14.0.0' })).toBe('nextjs');
  });

  test('ưu tiên nextjs hơn react khi có cả hai', () => {
    expect(detectFramework({ next: '^14.0.0', react: '^18.0.0' })).toBe('nextjs');
  });

  test('detects vue khi có vue', () => {
    expect(detectFramework({ vue: '^3.0.0' })).toBe('vue');
  });

  test('detects react khi chỉ có react (không có next)', () => {
    expect(detectFramework({ react: '^18.0.0' })).toBe('react');
  });

  test('detects generic khi không có framework nào quen thuộc', () => {
    expect(detectFramework({ lodash: '^4.0.0' })).toBe('generic');
  });

  test('detects generic khi deps rỗng', () => {
    expect(detectFramework({})).toBe('generic');
  });
});

// --- detectPackageManager ---
describe('detectPackageManager()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('trả về yarn khi có yarn.lock', () => {
    fs.writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
    expect(detectPackageManager(tmpDir)).toBe('yarn');
  });

  test('trả về pnpm khi có pnpm-lock.yaml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(tmpDir)).toBe('pnpm');
  });

  test('trả về npm khi không có lock file nào', () => {
    expect(detectPackageManager(tmpDir)).toBe('npm');
  });
});

// --- readPackageJson ---
describe('readPackageJson()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('đọc đúng package.json hợp lệ', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test', dependencies: { next: '^14' } }));
    const result = readPackageJson(tmpDir);
    expect(result.name).toBe('test');
  });

  test('trả về {} khi không có package.json', () => {
    expect(readPackageJson(tmpDir)).toEqual({});
  });

  test('trả về {} khi package.json bị lỗi JSON', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), 'invalid json {{{');
    expect(readPackageJson(tmpDir)).toEqual({});
  });
});

// --- detect (integration) ---
describe('detect()', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = createTempDir(); });
  afterEach(() => { cleanupDir(tmpDir); });

  test('detect NestJS project đầy đủ', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { '@nestjs/core': '^10' }
    }));
    const result = detect(tmpDir);
    expect(result.framework).toBe('nestjs');
    expect(result.packageManager).toBe('npm');
  });

  test('detect Next.js project với yarn', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '^14', react: '^18' }
    }));
    fs.writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
    const result = detect(tmpDir);
    expect(result.framework).toBe('nextjs');
    expect(result.packageManager).toBe('yarn');
  });

  test('detect generic khi không có package.json', () => {
    const result = detect(tmpDir);
    expect(result.type).toBe('single');
    expect(result.framework).toBe('generic');
  });

  // --- Python Tests ---
  test('detects Python Django qua requirements.txt', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), 'Django==4.2.1\npsycopg2-binary==2.9.9');
    const result = detect(tmpDir);
    expect(result.type).toBe('single');
    expect(result.framework).toBe('python-django');
    expect(result.packageManager).toBe('pip');
  });

  test('detects Python FastAPI qua pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.poetry.dependencies]\nfastapi = "^0.103.1"\nuvicorn = "^0.23.2"');
    const result = detect(tmpDir);
    expect(result.type).toBe('single');
    expect(result.framework).toBe('python-fastapi');
    expect(result.packageManager).toBe('pip');
  });

  // --- Go Tests ---
  test('detects Go Gin qua go.mod', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module myapp\n\ngo 1.20\n\nrequire github.com/gin-gonic/gin v1.9.1');
    const result = detect(tmpDir);
    expect(result.type).toBe('single');
    expect(result.framework).toBe('go-gin');
    expect(result.packageManager).toBe('go-modules');
  });

  test('detects Go Fiber qua go.mod', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module myapp\n\ngo 1.20\n\nrequire github.com/gofiber/fiber/v2 v2.49.1');
    const result = detect(tmpDir);
    expect(result.type).toBe('single');
    expect(result.framework).toBe('go-fiber');
    expect(result.packageManager).toBe('go-modules');
  });

  // --- Monorepo Tests ---
  test('detects turborepo với 1 React app và 1 NestJS api', () => {
    fs.writeFileSync(path.join(tmpDir, 'turbo.json'), '{}');
    
    // apps/web (React)
    const appsDir = path.join(tmpDir, 'apps');
    fs.mkdirSync(appsDir);
    const webDir = path.join(appsDir, 'web');
    fs.mkdirSync(webDir);
    fs.writeFileSync(path.join(webDir, 'package.json'), JSON.stringify({ dependencies: { react: '^18' } }));

    // apps/api (NestJS)
    const apiDir = path.join(appsDir, 'api');
    fs.mkdirSync(apiDir);
    fs.writeFileSync(path.join(apiDir, 'package.json'), JSON.stringify({ dependencies: { '@nestjs/core': '^10' } }));

    const result = detect(tmpDir);
    expect(result.type).toBe('monorepo');
    expect(result.tool).toBe('turborepo');
    expect(result.subProjects).toHaveLength(2);
    
    // Sort to ensure stable assertions
    const projects = result.subProjects.sort((a, b) => a.name.localeCompare(b.name));
    
    expect(projects[0].name).toBe('api');
    expect(projects[0].framework).toBe('nestjs');
    expect(projects[0].path).toBe('apps/api');

    expect(projects[1].name).toBe('web');
    expect(projects[1].framework).toBe('react');
    expect(projects[1].path).toBe('apps/web');
  });
});
