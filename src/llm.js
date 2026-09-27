'use strict';

const fs = require('fs');
const path = require('path');

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
          const children = fs.readdirSync(itemPath).slice(0, 10); // Giới hạn 10 file đầu tiên để tránh quá lớn
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

/**
 * Hàm gọi API chung cho các AI Model.
 */
async function callAI(prompt, model, apiKey) {
  if (model === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  } 
  
  if (model === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  }

  if (model === 'claude') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt + "\\n\\nPlease return ONLY valid JSON." }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.content[0].text;
  }

  throw new Error(`Unsupported model: ${model}`);
}

/**
 * Sinh tài liệu tự động dựa trên project context
 */
async function generateDocs(targetDir) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('API Key is missing. Vui long set GEMINI_API_KEY, OPENAI_API_KEY, hoac ANTHROPIC_API_KEY');
  }

  let model = 'gemini';
  if (process.env.OPENAI_API_KEY) model = 'openai';
  if (process.env.ANTHROPIC_API_KEY) model = 'claude';
  if (process.env.GEMINI_API_KEY) model = 'gemini'; // Ưu tiên Gemini nếu có nhiều key

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
    
    // Clean up potential markdown codeblocks in LLM response
    const cleanJsonStr = rawResult.replace(/^```(?:json)?/im, '').replace(/```$/im, '').trim();
    
    const parsed = JSON.parse(cleanJsonStr);
    return parsed;
  } catch (err) {
    throw new Error(`AI Generation failed: ${err.message}`);
  }
}

module.exports = { scanProject, callAI, generateDocs };
