'use strict';

const fs = require('fs');
const path = require('path');
const { MAX_DIFF_CHARS } = require('./gitdiff');

/**
 * Quét cấu trúc dự án (chỉ thư mục root và cấp 1, đọc các file cấu hình).
 */
function scanProject(targetDir) {
  const context = {
    structure: [],
    configs: {}
  };

  try {
    const rootItems = fs.readdirSync(targetDir);
    
    for (const item of rootItems) {
      // Bỏ qua các thư mục ẩn, build, node_modules
      if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') continue;
      
      const itemPath = path.join(targetDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        try {
          const children = fs.readdirSync(itemPath)
            .filter((name) => !name.startsWith('.')) // Bỏ thư mục ẩn như specs/.history
            .slice(0, 10); // Giới hạn 10 file đầu tiên để tránh quá lớn
          context.structure.push({ dir: item, children: children });
        } catch {
          context.structure.push({ dir: item });
        }
      } else {
        context.structure.push({ file: item });
        
        // Đọc nội dung các file cấu hình để AI biết rõ framework/thư viện
        if (['package.json', 'go.mod', 'requirements.txt', 'pyproject.toml'].includes(item)) {
          context.configs[item] = fs.readFileSync(itemPath, 'utf8').substring(0, 1000); // Giới hạn 1000 ký tự
        }
      }
    }
  } catch (err) {
    console.warn(`[speckit-ai] ⚠️ Failed to scan project: ${err.message}`);
  }

  return context;
}

const DEFAULT_TIMEOUT_MS = 60000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
/** Lỗi nhất thời: đáng thử lại (giới hạn tốc độ, lỗi phía server). */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/** Các hãng LLM, theo thứ tự ưu tiên khi có nhiều khóa API. */
const PROVIDERS = {
  gemini: { label: 'Gemini', keyEnv: 'GEMINI_API_KEY', modelEnv: 'SPECKIT_GEMINI_MODEL', defaultModel: 'gemini-1.5-flash' },
  claude: { label: 'Claude', keyEnv: 'ANTHROPIC_API_KEY', modelEnv: 'SPECKIT_ANTHROPIC_MODEL', defaultModel: 'claude-sonnet-5-5' },
  openai: { label: 'OpenAI', keyEnv: 'OPENAI_API_KEY', modelEnv: 'SPECKIT_OPENAI_MODEL', defaultModel: 'gpt-4o-mini' },
};

/**
 * Chọn hãng trước (theo thứ tự ưu tiên trong PROVIDERS) rồi lấy đúng khóa của hãng đó,
 * để khóa của hãng này không bao giờ bị gửi tới hãng khác.
 * @returns {{ model: string, apiKey: string }}
 */
function resolveProvider(env = process.env) {
  for (const [model, provider] of Object.entries(PROVIDERS)) {
    if (env[provider.keyEnv]) return { model, apiKey: env[provider.keyEnv] };
  }
  throw new Error('API Key is missing. Please set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY');
}

/** Thời gian chờ mỗi lần gọi (ms): SPECKIT_LLM_TIMEOUT_MS nếu là số nguyên dương, ngược lại mặc định. */
function resolveTimeoutMs(env = process.env) {
  const value = Number(env.SPECKIT_LLM_TIMEOUT_MS);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function networkError(label, err, timeoutMs) {
  if (err && err.name === 'TimeoutError') {
    return new Error(`${label} did not answer within ${Math.round(timeoutMs / 1000)}s`);
  }
  const cause = err && err.cause ? ` (${err.cause.code || err.cause.message})` : '';
  return new Error(`${label} request failed: ${err && err.message}${cause}`);
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Gọi API một hãng, có timeout; thử lại tối đa MAX_ATTEMPTS lần cho lỗi nhất thời (mạng, hết giờ, 429/5xx),
 * chờ 1s rồi 2s giữa các lần. Lỗi khác (400, 401, ...) dừng ngay.
 * @returns {Promise<object>} JSON phản hồi
 */
async function requestWithRetry(label, url, init, { timeoutMs = resolveTimeoutMs(), sleep = defaultSleep } = {}) {
  for (let attempt = 1; ; attempt++) {
    let failure;
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      const data = await readJson(response);
      const apiError = data && data.error ? (data.error.message || String(data.error)) : null;
      if (response.ok && !apiError) return data;

      const message = apiError || response.statusText || 'request failed';
      failure = {
        error: new Error(`${label} API error${response.ok ? '' : ` (${response.status})`}: ${message}`),
        retryable: !response.ok && RETRYABLE_STATUS.has(response.status),
      };
    } catch (err) {
      failure = { error: networkError(label, err, timeoutMs), retryable: true };
    }

    if (!failure.retryable || attempt >= MAX_ATTEMPTS) throw failure.error;
    await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
  }
}

function answerOrThrow(label, text, reason) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error(`${label} returned no answer (${reason || 'blocked or empty'})`);
  }
  return text;
}

/**
 * Hàm gọi API chung cho các AI Model.
 * @param {string} prompt
 * @param {'gemini'|'openai'|'claude'} model - hãng
 * @param {string} apiKey - khóa của đúng hãng đó
 * @param {{ timeoutMs?: number, sleep?: Function }} [options] - thay được trong test
 */
async function callAI(prompt, model, apiKey, options = {}) {
  const provider = PROVIDERS[model];
  if (!provider) throw new Error(`Unsupported model: ${model}`);
  const modelName = process.env[provider.modelEnv] || provider.defaultModel;

  if (model === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;
    const data = await requestWithRetry(provider.label, url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    }, options);
    const candidate = data.candidates && data.candidates[0];
    const reason = (data.promptFeedback && data.promptFeedback.blockReason) || (candidate && candidate.finishReason);
    return answerOrThrow(provider.label, candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text, reason);
  }

  if (model === 'openai') {
    const data = await requestWithRetry(provider.label, 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    }, options);
    const choice = data.choices && data.choices[0];
    return answerOrThrow(provider.label, choice && choice.message && choice.message.content, choice && choice.finish_reason);
  }

  const data = await requestWithRetry(provider.label, 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 2000,
      messages: [{ role: 'user', content: `${prompt}\n\nPlease return ONLY valid JSON.` }],
    }),
  }, options);
  return answerOrThrow(provider.label, data.content && data.content[0] && data.content[0].text, data.stop_reason);
}


function safeParseJson(raw) {
  try {
    const cleanStr = raw.replace(/^```(?:json)?/im, '').replace(/```$/im, '').trim();
    return JSON.parse(cleanStr);
  } catch (err) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e) {}
    }
    throw new Error('Failed to parse AI response into valid JSON.');
  }
}

/**
 * Sinh tài liệu tự động dựa trên project context
 */
async function generateDocs(targetDir) {
  const { apiKey, model } = resolveProvider();

  const context = scanProject(targetDir);
  
  const prompt = `You are an expert technical writer. I will give you a project structure and configuration.
Please analyze it and write the content for two markdown files: 'technology.md' and 'project-overview.md'.
Focus on accurate detection of libraries, frameworks, languages, and architecture based on the configs and folder structure.
Do not use placeholders like [Insert Name], infer as much as possible or use general terms.

Return the result STRICTLY as a JSON object with this format (do not include markdown codeblocks around the JSON):
{
  "technology": "# Technology Stack\\n\\n...",
  "projectOverview": "# Project Overview\\n\\n..."
}

Project Data:
${JSON.stringify(context, null, 2)}`;

  try {
    const rawResult = await callAI(prompt, model, apiKey);
    return normalizeGeneratedDocs(safeParseJson(rawResult));
  } catch (err) {
    throw new Error(`AI Generation failed: ${err.message}`);
  }
}

/**
 * Kiểm kết quả của --mode=auto: phải có hai chuỗi không rỗng, để scaffold không ghi nội dung sai kiểu.
 * @returns {{ technology: string, projectOverview: string }}
 */
function normalizeGeneratedDocs(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('Generated docs are malformed: expected a JSON object.');
  }
  for (const field of ['technology', 'projectOverview']) {
    if (typeof result[field] !== 'string' || result[field].trim() === '') {
      throw new Error(`Generated docs are malformed: "${field}" must be a non-empty string.`);
    }
  }
  return { technology: result.technology, projectOverview: result.projectOverview };
}

async function getApiKeyAndModel() {
  return resolveProvider();
}

async function generateHandoffSummary(diff) {
  const { apiKey, model } = await getApiKeyAndModel();
  const prompt = `You are a developer doing a handoff. Summarize the current progress based on the git diff below.
Focus on: What is done? What is broken or incomplete? What should the next developer (or AI) do?
Return ONLY a markdown string, DO NOT wrap in JSON format for this request.

Diff:
${diff.substring(0, MAX_DIFF_CHARS)}`;

  try {
    // If using gemini/openai with JSON mode forced, we might get JSON back.
    // For simplicity, we just ask for text and handle it.
    let result = await callAI(prompt, model, apiKey);
    try {
        const parsed = JSON.parse(result);
        if (parsed.text) result = parsed.text;
    } catch(e) {}
    return result;
  } catch (err) {
    throw new Error(`AI Handoff failed: ${err.message}`);
  }
}

function malformedReview(reason) {
  return new Error(`Review response is malformed: ${reason}`);
}

/**
 * Kiểm kết quả review của model và đưa về dạng chuẩn { success: boolean, errors: string[] }.
 * Sai dạng thì ném lỗi; kết quả tự mâu thuẫn thì coi là không passed (fail-closed).
 */
function normalizeReview(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw malformedReview('expected a JSON object.');
  }
  if (typeof result.success !== 'boolean') {
    throw malformedReview('"success" must be true or false.');
  }
  const errors = result.errors === undefined ? [] : result.errors;
  if (!Array.isArray(errors) || errors.some((item) => typeof item !== 'string')) {
    throw malformedReview('"errors" must be an array of strings.');
  }

  if (result.success && errors.length > 0) return { success: false, errors };
  if (!result.success && errors.length === 0) {
    return { success: false, errors: ['The reviewer rejected the change without giving a reason.'] };
  }
  return { success: result.success, errors };
}

async function reviewCode(specContent, agentsContent, diff, refContent) {
  if (diff.length > MAX_DIFF_CHARS) {
    throw new Error(`AI Review failed: the diff is ${diff.length} characters, over the ${MAX_DIFF_CHARS} limit. A review never truncates; split the diff first.`);
  }
  const { apiKey, model } = await getApiKeyAndModel();
  const prompt = `You are a strict Senior Architect. Review the following code changes (Diff).
You MUST check if it fulfills the Spec, follows the AGENTS Rules, and matches the Reference Code (if provided).
Reject violations of SOLID principles or Business Logic leaking into controllers.

Return the result STRICTLY as a JSON object:
{
  "success": boolean,
  "errors": ["list of strings explaining the issues"]
}

Spec:
${specContent}

Rules:
${agentsContent}

Reference Code:
${refContent}

Diff:
${diff}`;

  try {
    const rawResult = await callAI(prompt, model, apiKey);
    return normalizeReview(safeParseJson(rawResult));
  } catch (err) {
    throw new Error(`AI Review failed: ${err.message}`);
  }
}

module.exports = { scanProject, callAI, resolveProvider, generateDocs, generateHandoffSummary, reviewCode };
