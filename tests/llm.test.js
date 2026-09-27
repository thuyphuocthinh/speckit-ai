'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { scanProject, generateDocs } = require('../src/llm');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'speckit-llm-test-'));
}
function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('llm.js', () => {
  let tmpDir;
  
  beforeEach(() => {
    tmpDir = createTempDir();
  });
  
  afterEach(() => {
    cleanupDir(tmpDir);
    jest.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  test('scanProject() quét đúng cấu trúc và nội dung file config', () => {
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'src', 'index.js'), 'console.log("test")');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name": "test"}');
    
    // Tạo folder rác
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    
    const context = scanProject(tmpDir);
    
    // Không chứa node_modules
    expect(context.structure.some(s => s.dir === 'node_modules')).toBe(false);
    
    // Có package.json và đọc được content
    expect(context.structure.some(s => s.file === 'package.json')).toBe(true);
    expect(context.configs['package.json']).toBe('{"name": "test"}');
    
    // Đọc được thư mục con của src
    const srcFolder = context.structure.find(s => s.dir === 'src');
    expect(srcFolder.children).toContain('index.js');
  });

  test('generateDocs() báo lỗi nếu không có API key', async () => {
    await expect(generateDocs(tmpDir)).rejects.toThrow('API Key is missing');
  });

  test('generateDocs() gọi API và trả về JSON hợp lệ (Mock Fetch)', async () => {
    process.env.GEMINI_API_KEY = 'fake-key';

    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '```json\n{"technology": "# Tech Stack", "projectOverview": "# Overview"}\n```'
              }]
            }
          }]
        })
      })
    );

    const result = await generateDocs(tmpDir);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.technology).toBe('# Tech Stack');
    expect(result.projectOverview).toBe('# Overview');
  });
});
