'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadEnv } = require('../src/env');

describe('env.js - loadEnv()', () => {
  let tmpDir;
  const KEY = 'SPECKIT_TEST_ENV_KEY';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-env-test-'));
    delete process.env[KEY];
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env[KEY];
    jest.restoreAllMocks();
  });

  test('nạp biến từ .env của project', () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), `${KEY}=from-file\n`, 'utf8');

    loadEnv(tmpDir);

    expect(process.env[KEY]).toBe('from-file');
  });

  test('không in log ra console', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    fs.writeFileSync(path.join(tmpDir, '.env'), `${KEY}=x\n`, 'utf8');

    loadEnv(tmpDir);

    expect(logSpy).not.toHaveBeenCalled();
  });

  test('không ghi đè biến môi trường đã có', () => {
    process.env[KEY] = 'from-shell';
    fs.writeFileSync(path.join(tmpDir, '.env'), `${KEY}=from-file\n`, 'utf8');

    loadEnv(tmpDir);

    expect(process.env[KEY]).toBe('from-shell');
  });

  test('không lỗi khi project không có .env', () => {
    expect(() => loadEnv(tmpDir)).not.toThrow();
  });
});
