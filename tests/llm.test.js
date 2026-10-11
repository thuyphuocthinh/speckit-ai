'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { scanProject, callAI, resolveProvider, generateDocs, reviewCode } = require('../src/llm');
const { MAX_DIFF_CHARS } = require('../src/gitdiff');

/** Phản hồi giả của fetch. */
function reply(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, statusText: `HTTP ${status}`, json: () => Promise.resolve(body) };
}
const geminiBody = (text) => ({ candidates: [{ content: { parts: [{ text }] } }] });
const openaiBody = (text) => ({ choices: [{ message: { content: text } }] });
const claudeBody = (text) => ({ content: [{ text }] });

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
    for (const name of ['SPECKIT_LLM_TIMEOUT_MS', 'SPECKIT_GEMINI_MODEL', 'SPECKIT_OPENAI_MODEL', 'SPECKIT_ANTHROPIC_MODEL']) {
      delete process.env[name];
    }
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
    global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody('```json\n{"technology": "# Tech Stack", "projectOverview": "# Overview"}\n```'))));

    const result = await generateDocs(tmpDir);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.technology).toBe('# Tech Stack');
    expect(result.projectOverview).toBe('# Overview');
  });

  describe('reviewCode()', () => {
    /** Mock fetch của Gemini trả về `text` làm phản hồi của model. */
    function mockModelReply(text) {
      process.env.GEMINI_API_KEY = 'fake-key';
      global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody(text))));
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

  describe('callAI(): timeout, retry và lỗi rõ ràng', () => {
    const sleep = jest.fn(() => Promise.resolve());
    const ask = (model = 'gemini', options = {}) => callAI('hello', model, 'key', { sleep, ...options });
    const timeoutError = () => Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });

    beforeEach(() => {
      sleep.mockClear();
    });

    test('AC-2: lỗi nhất thời được thử lại; thành công ở lần sau thì trả kết quả, chờ 1s rồi 2s', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(reply({}, 503))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce(reply(geminiBody('ok')));

      await expect(ask()).resolves.toBe('ok');

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(sleep.mock.calls.map((call) => call[0])).toEqual([1000, 2000]);
    });

    test.each([429, 500, 502, 503, 504])('AC-2: HTTP %i được thử lại', async (status) => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(reply({}, status))
        .mockResolvedValueOnce(reply(geminiBody('ok')));

      await expect(ask()).resolves.toBe('ok');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('AC-2: thử tối đa 3 lần rồi thất bại với lỗi của lần cuối, không có lần gọi thứ 4', async () => {
      global.fetch = jest.fn(() => Promise.resolve(reply({ error: { message: 'overloaded' } }, 503)));

      await expect(ask()).rejects.toThrow('Gemini API error (503): overloaded');

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(sleep).toHaveBeenCalledTimes(2);
    });

    test('AC-2: phản hồi lỗi không phải JSON vẫn được xử lý và báo theo mã HTTP', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 502, statusText: 'Bad Gateway', json: () => Promise.reject(new Error('not json')) }));

      await expect(ask()).rejects.toThrow('Gemini API error (502): Bad Gateway');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('AC-1: hết thời gian chờ ở lần cuối thì báo "did not answer within <n>s"', async () => {
      global.fetch = jest.fn(() => Promise.reject(timeoutError()));

      await expect(ask('openai')).rejects.toThrow('OpenAI did not answer within 60s');

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('AC-1: mỗi lần gọi có signal timeout; thời gian chờ đổi được bằng SPECKIT_LLM_TIMEOUT_MS', async () => {
      process.env.SPECKIT_LLM_TIMEOUT_MS = '5000';
      global.fetch = jest.fn(() => Promise.reject(timeoutError()));

      await expect(ask('claude')).rejects.toThrow('Claude did not answer within 5s');

      expect(global.fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    test.each(['abc', '0', '-5', '1.5', ''])('AC-1: SPECKIT_LLM_TIMEOUT_MS=%p không hợp lệ thì dùng mặc định 60s', async (value) => {
      process.env.SPECKIT_LLM_TIMEOUT_MS = value;
      global.fetch = jest.fn(() => Promise.reject(timeoutError()));

      await expect(ask()).rejects.toThrow('did not answer within 60s');
    });

    test('AC-1: lời gọi treo thật sự bị ngắt khi hết thời gian chờ (không treo vô hạn)', async () => {
      global.fetch = jest.fn((url, init) => new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(init.signal.reason));
      }));

      await expect(ask('gemini', { timeoutMs: 30 })).rejects.toThrow(/Gemini did not answer within \d+s/);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('AC-2: lỗi mạng khác được báo kèm nguyên nhân', async () => {
      global.fetch = jest.fn(() => Promise.reject(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } })));

      await expect(ask()).rejects.toThrow('Gemini request failed: fetch failed (ENOTFOUND)');
    });

    test.each([400, 401, 403, 404])('AC-3: HTTP %i không được thử lại, báo thông điệp của hãng', async (status) => {
      global.fetch = jest.fn(() => Promise.resolve(reply({ error: { message: 'API key not valid' } }, status)));

      await expect(ask('claude')).rejects.toThrow(`Claude API error (${status}): API key not valid`);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    });

    test('AC-3: HTTP 200 kèm trường error cũng dừng ngay sau một lần gọi', async () => {
      global.fetch = jest.fn(() => Promise.resolve(reply({ error: { message: 'quota exceeded' } })));

      await expect(ask('openai')).rejects.toThrow('OpenAI API error: quota exceeded');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test.each([
      ['gemini', {}, 'Gemini returned no answer (blocked or empty)'],
      ['gemini', { promptFeedback: { blockReason: 'SAFETY' } }, 'Gemini returned no answer (SAFETY)'],
      ['gemini', { candidates: [{ finishReason: 'MAX_TOKENS', content: {} }] }, 'Gemini returned no answer (MAX_TOKENS)'],
      ['openai', { choices: [] }, 'OpenAI returned no answer (blocked or empty)'],
      ['openai', { choices: [{ finish_reason: 'content_filter', message: { content: null } }] }, 'OpenAI returned no answer (content_filter)'],
      ['claude', { content: [] }, 'Claude returned no answer (blocked or empty)'],
      ['claude', { stop_reason: 'refusal', content: [] }, 'Claude returned no answer (refusal)'],
    ])('AC-4: %s trả phản hồi rỗng thì báo lý do, không phải TypeError, không thử lại', async (model, body, message) => {
      global.fetch = jest.fn(() => Promise.resolve(reply(body)));

      await expect(ask(model)).rejects.toThrow(message);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('model không hỗ trợ thì báo lỗi', async () => {
      await expect(ask('mistral')).rejects.toThrow('Unsupported model: mistral');
    });
  });

  describe('chọn hãng và khóa API', () => {
    test('AC-5: không có khóa nào thì báo lỗi API Key is missing', () => {
      expect(() => resolveProvider({})).toThrow('API Key is missing');
    });

    test.each([
      [{ GEMINI_API_KEY: 'g', ANTHROPIC_API_KEY: 'c', OPENAI_API_KEY: 'o' }, { model: 'gemini', apiKey: 'g' }],
      [{ ANTHROPIC_API_KEY: 'c', OPENAI_API_KEY: 'o' }, { model: 'claude', apiKey: 'c' }],
      [{ OPENAI_API_KEY: 'o' }, { model: 'openai', apiKey: 'o' }],
      [{ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' }, { model: 'gemini', apiKey: 'g' }],
    ])('AC-5: %j chọn đúng hãng kèm đúng khóa', (env, expected) => {
      expect(resolveProvider(env)).toEqual(expected);
    });

    test('AC-5: chỉ đặt khóa OpenAI và Claude thì khóa gửi tới Claude là khóa của Claude, không phải của OpenAI', async () => {
      process.env.OPENAI_API_KEY = 'openai-secret';
      process.env.ANTHROPIC_API_KEY = 'claude-secret';
      global.fetch = jest.fn(() => Promise.resolve(reply(claudeBody('{"success": true}'))));

      await reviewCode('spec', 'rules', 'diff', '');

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(init.headers['x-api-key']).toBe('claude-secret');
      expect(JSON.stringify(init)).not.toContain('openai-secret');
    });

    test('AC-5: khóa Gemini nằm trong header x-goog-api-key, không nằm trong URL', async () => {
      process.env.GEMINI_API_KEY = 'gemini-secret';
      global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody('{"success": true}'))));

      await reviewCode('spec', 'rules', 'diff', '');

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).not.toContain('gemini-secret');
      expect(url).not.toContain('key=');
      expect(init.headers['x-goog-api-key']).toBe('gemini-secret');
    });

    test('AC-5: khóa API không xuất hiện trong thông báo lỗi', async () => {
      process.env.GEMINI_API_KEY = 'gemini-secret';
      global.fetch = jest.fn(() => Promise.resolve(reply({ error: { message: 'API key not valid' } }, 400)));

      await expect(reviewCode('spec', 'rules', 'diff', '')).rejects.not.toThrow(/gemini-secret/);
    });
  });

  describe('model cấu hình được', () => {
    const bodyOf = () => JSON.parse(global.fetch.mock.calls[0][1].body);

    test('AC-6: mặc định', async () => {
      global.fetch = jest.fn(() => Promise.resolve(reply(claudeBody('x'))));
      await callAI('p', 'claude', 'k');
      expect(bodyOf().model).toBe('claude-sonnet-5-5');

      global.fetch = jest.fn(() => Promise.resolve(reply(openaiBody('x'))));
      await callAI('p', 'openai', 'k');
      expect(bodyOf().model).toBe('gpt-4o-mini');

      global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody('x'))));
      await callAI('p', 'gemini', 'k');
      expect(global.fetch.mock.calls[0][0]).toContain('/models/gemini-1.5-flash:generateContent');
    });

    test('AC-6: biến môi trường đổi model của từng hãng', async () => {
      process.env.SPECKIT_ANTHROPIC_MODEL = 'claude-custom';
      process.env.SPECKIT_OPENAI_MODEL = 'gpt-custom';
      process.env.SPECKIT_GEMINI_MODEL = 'gemini-custom';

      global.fetch = jest.fn(() => Promise.resolve(reply(claudeBody('x'))));
      await callAI('p', 'claude', 'k');
      expect(bodyOf().model).toBe('claude-custom');

      global.fetch = jest.fn(() => Promise.resolve(reply(openaiBody('x'))));
      await callAI('p', 'openai', 'k');
      expect(bodyOf().model).toBe('gpt-custom');

      global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody('x'))));
      await callAI('p', 'gemini', 'k');
      expect(global.fetch.mock.calls[0][0]).toContain('/models/gemini-custom:generateContent');
    });

    test('prompt gửi cho Claude có xuống dòng thật, không phải chuỗi \\n', async () => {
      global.fetch = jest.fn(() => Promise.resolve(reply(claudeBody('x'))));

      await callAI('p', 'claude', 'k');

      expect(bodyOf().messages[0].content).toBe('p\n\nPlease return ONLY valid JSON.');
    });
  });

  describe('generateDocs(): kiểm schema (--mode=auto)', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'fake-key';
    });

    test.each([
      ['không phải object', '[1, 2]'],
      ['thiếu technology', '{"projectOverview": "# O"}'],
      ['technology không phải chuỗi', '{"technology": {"a": 1}, "projectOverview": "# O"}'],
      ['projectOverview rỗng', '{"technology": "# T", "projectOverview": "   "}'],
    ])('AC-7: %s thì ném lỗi malformed và không trả kết quả', async (_label, text) => {
      global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody(text))));

      await expect(generateDocs(tmpDir)).rejects.toThrow('AI Generation failed: Generated docs are malformed');
    });

    test('AC-7: kết quả hợp lệ chỉ giữ hai trường cần dùng', async () => {
      global.fetch = jest.fn(() => Promise.resolve(reply(geminiBody('{"technology": "# T", "projectOverview": "# O", "extra": 1}'))));

      await expect(generateDocs(tmpDir)).resolves.toEqual({ technology: '# T', projectOverview: '# O' });
    });
  });
});
