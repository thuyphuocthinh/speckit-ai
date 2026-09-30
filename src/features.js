'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Chuyển tiêu đề thành slug kebab-case (bỏ dấu tiếng Việt, ký tự đặc biệt).
 */
function toKebabCase(str) {
  return str
    .replace(/đ/g, 'd')              // "đ" không tách dấu được bằng NFD
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Lược bỏ dấu tiếng Việt
    .replace(/[^a-zA-Z0-9\s-]/g, '')  // Loại bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-')             // Thay khoảng trắng bằng dấu gạch ngang
    .toLowerCase();
}

/**
 * Các đường dẫn chuẩn của bố cục specs/ (ideas → active → features).
 */
function getPaths(targetDir) {
  const specs = path.join(targetDir, 'specs');
  return {
    specs,
    ideas: path.join(specs, 'ideas'),
    active: path.join(specs, 'active'),
    features: path.join(specs, 'features'),
    decisions: path.join(specs, 'decisions'),
    contracts: path.join(specs, 'contracts'),
    history: path.join(specs, '.history'),
  };
}

/**
 * Đọc các dòng metadata dạng `> **Key**: value` ở phần đầu file (trước heading `##` đầu tiên).
 * Key được chuẩn hóa: lowercase, khoảng trắng thành gạch ngang (vd "Depends-on" → "depends-on").
 */
function parseMeta(content) {
  const meta = {};
  for (const line of content.split(/\r?\n/)) {
    if (/^##\s/.test(line)) break;
    const match = line.match(/^>\s*\*\*([^*]+)\*\*:\s*(.*)$/);
    if (match) {
      meta[match[1].trim().toLowerCase().replace(/\s+/g, '-')] = match[2].trim();
    }
  }
  return meta;
}

/**
 * Đặt (hoặc thêm) một dòng metadata `> **Key**: value` ở phần đầu file.
 * - Đã có dòng cùng key (không phân biệt hoa thường) thì thay giá trị.
 * - Chưa có thì thêm sau dòng metadata cuối cùng, hoặc ngay sau heading H1 nếu chưa có metadata.
 * Giữ nguyên kiểu xuống dòng (LF/CRLF) của nội dung.
 */
function setMeta(content, key, value) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const newLine = `> **${key}**: ${value}`.trimEnd();
  const wanted = key.trim().toLowerCase().replace(/\s+/g, '-');

  let lastMeta = -1;
  let h1 = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    if (h1 === -1 && /^#\s/.test(lines[i])) h1 = i;
    const match = lines[i].match(/^>\s*\*\*([^*]+)\*\*:/);
    if (match) {
      lastMeta = i;
      if (match[1].trim().toLowerCase().replace(/\s+/g, '-') === wanted) {
        lines[i] = newLine;
        return lines.join(eol);
      }
    }
  }

  if (lastMeta >= 0) {
    lines.splice(lastMeta + 1, 0, newLine);
  } else if (h1 >= 0) {
    lines.splice(h1 + 1, 0, '', newLine);
  } else {
    lines.unshift(newLine, '');
  }
  return lines.join(eol);
}

/**
 * Tách giá trị dạng danh sách "a, b, c" thành mảng slug kebab-case.
 * Giá trị rỗng hoặc placeholder kiểu "<...>" / "-" cho ra mảng rỗng.
 */
function parseList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item !== '-' && !/^<.*>$/.test(item))
    .map(toKebabCase)
    .filter(Boolean);
}

/**
 * sha256 (hex) của nội dung file.
 */
function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Danh sách tên các việc đang làm trong specs/active/.
 */
function listActive(targetDir) {
  return listDirs(getPaths(targetDir).active);
}

/**
 * Tìm việc đang làm.
 * - Có `name`: dùng đúng việc đó, lỗi nếu không tồn tại.
 * - Không có `name`: dùng việc duy nhất; lỗi nếu không có việc nào hoặc có nhiều việc.
 * @returns {{ name: string, dir: string }}
 */
function resolveActive(targetDir, name) {
  const { active } = getPaths(targetDir);
  const names = listActive(targetDir);

  if (name) {
    const slug = toKebabCase(name);
    if (!names.includes(slug)) {
      const hint = names.length > 0 ? ` Active: ${names.join(', ')}.` : '';
      throw new Error(`No active work named "${slug}" in specs/active/.${hint}`);
    }
    return { name: slug, dir: path.join(active, slug) };
  }

  if (names.length === 0) {
    throw new Error('No active work found in specs/active/. Run: npx speckit-ai start "<title>"');
  }
  if (names.length > 1) {
    throw new Error(`Multiple active works found (${names.join(', ')}). Please specify a name.`);
  }
  return { name: names[0], dir: path.join(active, names[0]) };
}

/**
 * Danh sách slug các feature đã hoàn tất (có specs/features/<slug>/spec.md).
 */
function listFeatures(targetDir) {
  const { features } = getPaths(targetDir);
  return listDirs(features).filter((slug) => fs.existsSync(path.join(features, slug, 'spec.md')));
}

/**
 * Danh sách ý tưởng trong specs/ideas/ (mỗi ý tưởng là một file .md).
 * @returns {Array<{ slug: string, file: string, title: string, dependsOn: string[], affects: string[] }>}
 */
function listIdeas(targetDir) {
  const { ideas } = getPaths(targetDir);
  if (!fs.existsSync(ideas)) return [];

  return fs.readdirSync(ideas, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
    .map((entry) => {
      const file = path.join(ideas, entry.name);
      const content = fs.readFileSync(file, 'utf8');
      const meta = parseMeta(content);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const slug = entry.name.replace(/\.md$/, '');
      return {
        slug,
        file,
        title: titleMatch ? titleMatch[1].trim() : slug,
        dependsOn: parseList(meta['depends-on']),
        affects: parseList(meta.affects),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Sắp xếp ý tưởng theo thứ tự phụ thuộc (phụ thuộc làm trước).
 * Một phụ thuộc được coi là thỏa khi nó là feature đã hoàn tất.
 * @param {Array} ideas - kết quả của listIdeas
 * @param {string[]} doneSlugs - kết quả của listFeatures
 * @returns {{ ordered: Array<{ idea: object, blockedBy: string[] }>, cycle: string[]|null }}
 */
function orderIdeas(ideas, doneSlugs) {
  const bySlug = new Map(ideas.map((idea) => [idea.slug, idea]));
  const done = new Set(doneSlugs);
  const state = new Map(); // 1 = đang duyệt, 2 = đã xong
  const ordered = [];
  let cycle = null;

  function visit(idea, stack) {
    if (cycle) return;
    if (state.get(idea.slug) === 2) return;
    if (state.get(idea.slug) === 1) {
      cycle = [...stack.slice(stack.indexOf(idea.slug)), idea.slug];
      return;
    }
    state.set(idea.slug, 1);
    for (const dep of idea.dependsOn) {
      if (bySlug.has(dep)) visit(bySlug.get(dep), [...stack, idea.slug]);
    }
    state.set(idea.slug, 2);
    ordered.push({
      idea,
      blockedBy: idea.dependsOn.filter((dep) => !done.has(dep)),
    });
  }

  for (const idea of ideas) visit(idea, []);
  return { ordered, cycle };
}

module.exports = {
  toKebabCase,
  getPaths,
  parseMeta,
  setMeta,
  parseList,
  sha256,
  listDirs,
  listActive,
  resolveActive,
  listFeatures,
  listIdeas,
  orderIdeas,
};
