# Cấu Trúc Thư Mục

## Cấu trúc repo

```
create-ai-doc-cli/
├── .agents/
│   ├── AGENTS.md                  ← Rule cốt lõi (bạn đang đọc file này)
│   └── skills/                    ← On-demand skills cho AI
├── CLAUDE.md                      ← Cross-tool wrapper (Claude Code)
├── .cursorrules                   ← Cross-tool wrapper (Cursor)
│
├── bin/
│   └── index.js                   ← Entry point CLI, chỉ parse args và gọi src/
│
├── src/
│   ├── detector.js                ← Detect framework từ package.json
│   ├── scaffolder.js              ← Tạo thư mục và copy template files
│   ├── stealth.js                 ← Ghi vào .git/info/exclude
│   └── promptFiller.js            ← Inject AI-PROMPT markers (mode=existing)
│
├── templates/
│   ├── _core/                     ← Template DÙNG CHUNG mọi framework
│   │   ├── AGENTS.md.tmpl
│   │   ├── docs-README.md.tmpl
│   │   ├── ai-agent-guidelines.md.tmpl
│   │   ├── operation.md.tmpl
│   │   └── specs/
│   │       ├── _template.md.tmpl
│   │       └── _workflow.md.tmpl
│   ├── _skills/                   ← Skills template DÙNG CHUNG
│   │   ├── spec-create/SKILL.md
│   │   ├── spec-plan/SKILL.md
│   │   └── spec-review/SKILL.md
│   ├── nestjs/                    ← Template riêng NestJS
│   ├── nextjs/                    ← Template riêng Next.js
│   ├── vue/                       ← Template riêng Vue 3
│   ├── react/                     ← Template riêng React/Vite
│   ├── node-express/              ← Template riêng Express
│   └── generic/                   ← Fallback nếu không detect được
│
├── tests/
│   ├── detector.test.js
│   ├── scaffolder.test.js
│   └── stealth.test.js
│
├── docs/                          ← Tài liệu AI của chính repo này
├── specs/                         ← SDD specs của chính repo này
├── package.json
└── README.md                      ← README cho người dùng npm
```

## Nguyên tắc đặt file

- **`bin/`**: Chỉ chứa entry point. Không có business logic ở đây.
- **`src/`**: Mỗi file là một module độc lập, có thể test riêng lẻ.
- **`templates/`**: Chỉ chứa file `.md.tmpl` và `.md`. Không có JS ở đây.
- **`tests/`**: Mỗi file `src/X.js` phải có file `tests/X.test.js` tương ứng.
