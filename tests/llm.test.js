'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { scanProject, generateDocs, reviewCode } = require('../src/llm');
const { MAX_DIFF_CHARS } = require('../src/gitdiff');

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

  test('AC-9: scanProject() bỏ qua thư mục ẩn như specs/.history', () => {
    fs.mkdirSync(path.join(tmpDir, 'specs', '.history', '2026-10-01-old-work'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'specs', 'features'), { recursive: true });

    const context = scanProject(tmpDir);

    const specsFolder = context.structure.find(s => s.dir === 'specs');
    expect(specsFolder.children).toEqual(['features']);
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

  describe('reviewCode()', () => {
    /** Mock fetch của Gemini trả về `text` làm phản hồi của model. */
    function mockModelReply(text) {
      process.env.GEMINI_API_KEY = 'fake-key';
      global.fetch = jest.fn(() =>
        Promise.resolve({ json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text }] } }] }) })
      );
    }

    const review = () => reviewCode('spec', 'rules', 'diff', '');

    test('kết quả hợp lệ được trả về nguyên dạng', async () => {
      mockModelReply('{"success": true, "errors": []}');
      await expect(review()).resolves.toEqual({ success: true, errors: [] });

      mockModelReply('{"success": false, "errors": ["Violates AC-2"]}');
      await expect(review()).resolves.toEqual({ success: false, errors: ['Violates AC-2'] });
    });

    test('AC-1: success không phải boolean (chuỗi "false") bị từ chối', async () => {
      mockModelReply('{"success": "false", "errors": []}');

      await expect(review()).rejects.toThrow('AI Review failed: Review response is malformed: "success" must be true or false.');
    });

    test('AC-1: thiếu success, kết quả không phải object, errors sai kiểu đều bị từ chối', async () => {
      for (const reply of ['{"errors": []}', '[true]', '"passed"', '{"success": true, "errors": "none"}', '{"success": false, "errors": [1, 2]}']) {
        mockModelReply(reply);
        await expect(review()).rejects.toThrow('Review response is malformed');
      }
    });

    test('AC-2: success true kèm errors thì không passed', async () => {
      mockModelReply('{"success": true, "errors": ["Missing validation"]}');

      await expect(review()).resolves.toEqual({ success: false, errors: ['Missing validation'] });
    });

    test('AC-2: success false không có errors thì có lỗi mặc định', async () => {
      mockModelReply('{"success": false}');

      const result = await review();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['The reviewer rejected the change without giving a reason.']);
    });

    test('success true không có errors thì passed', async () => {
      mockModelReply('{"success": true}');

      await expect(review()).resolves.toEqual({ success: true, errors: [] });
    });

    test('AC-4: từ chối diff dài hơn giới hạn thay vì cắt, và không gọi API', async () => {
      mockModelReply('{"success": true}');

      await expect(reviewCode('spec', 'rules', 'x'.repeat(MAX_DIFF_CHARS + 1), '')).rejects.toThrow(/never truncates/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('diff đúng bằng giới hạn được gửi đủ, không bị cắt', async () => {
      mockModelReply('{"success": true}');
      const diff = 'y'.repeat(MAX_DIFF_CHARS);

      await reviewCode('spec', 'rules', diff, '');

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.contents[0].parts[0].text).toContain(diff);
    });
  });
});
