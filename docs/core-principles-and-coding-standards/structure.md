# Cấu Trúc Thư Mục

## Cấu trúc repo

```
Create-ai-doc-cli/
├── .agents/
│   ├── AGENTS.md                  ← Rule cốt lõi (bạn đang đọc file này)
│   └── skills/                    ← On-demand skills cho AI
├── CLAUDE.md                      ← Cross-tool wrapper (Claude Code)
├── .cursorrules                   ← Cross-tool wrapper (Cursor)
│
├── bin/
│   └── index.js                   ← Entry point, chỉ gọi src/cli.js
│
├── src/
│   ├── cli.js                     ← Parse args, điều phối các lệnh, help
│   ├── init.js                    ← Luồng scaffold mặc định (--mode)
│   ├── env.js                     ← Nạp .env (chỉ cho auto/review/handoff)
│   ├── config.js                  ← Đọc .speckitrc / speckit.config.json
│   ├── detector.js                ← Detect framework từ package.json, go.mod, ...
│   ├── scaffolder.js              ← Tạo thư mục và copy template files
│   ├── stealth.js                 ← Ghi vào .git/info/exclude
│   ├── hook.js                    ← Cài git hook pre-commit (chạy lint)
│   ├── features.js                ← Tìm việc active / feature / ý tưởng, metadata, sha256
│   ├── lifecycle.js               ← idea, start, status
│   ├── done.js                    ← done: cổng kiểm tra, đóng gói, cất vào .history
│   ├── generator.js               ← generate adr | contract | tests
│   ├── linter.js                  ← lint spec và ADR theo template
│   ├── handoff.js, reviewer.js    ← Lệnh handoff / review (dùng llm.js)
│   ├── llm.js                     ← Gọi Gemini / OpenAI / Claude
│   ├── server.js                  ← serve: xem docs trên web
│   └── ui.js                      ← In thông báo có màu
│
├── templates/
│   ├── _core/                     ← Template DÙNG CHUNG mọi framework
│   │   ├── AGENTS.md.tmpl, CLAUDE.md.tmpl, cursorrules.tmpl
│   │   ├── docs-README.md.tmpl, ai-agent-guidelines.md.tmpl, operation.md.tmpl
│   │   ├── specs-template.md.tmpl, specs-workflow.md.tmpl, idea.md.tmpl
│   │   ├── decisions/0000-template.md.tmpl
│   │   └── contracts/_template.md.tmpl
│   ├── _existing/                 ← Skeleton AI-PROMPT (mode=existing)
│   ├── _skills/                   ← Skills template DÙNG CHUNG
│   │   ├── spec-create/SKILL.md
│   │   ├── spec-plan/SKILL.md
│   │   └── spec-review/SKILL.md
│   ├── nestjs/ nextjs/ vue/ react/ node-express/   ← Template riêng từng framework JS
│   ├── python-django/ python-fastapi/ go-gin/ go-fiber/
│   └── generic/                   ← Fallback nếu không detect được
│
├── tests/                         ← Mỗi src/X.js có tests/X.test.js tương ứng
├── docs/                          ← Tài liệu AI của chính repo này
│   └── tutorials/                 ← Hướng dẫn cho người dùng
├── specs/                         ← SDD specs của chính repo này
├── package.json
└── README.md                      ← README cho người dùng npm
```

## Nguyên tắc đặt file

- **`bin/`**: Chỉ chứa entry point. Không có business logic ở đây.
- **`src/`**: Mỗi file là một module độc lập, có thể test riêng lẻ. Logic điều phối lệnh nằm ở `cli.js`.
- **`templates/`**: Chỉ chứa file `.md.tmpl` và `.md`. Không có JS ở đây.
- **`tests/`**: Mỗi file `src/X.js` phải có file `tests/X.test.js` tương ứng.

## Bố cục `specs/` trong project của người dùng

```
specs/
├── _template.md  _workflow.md
├── ideas/<slug>.md                ← Backlog
├── active/<tên>/                  ← Việc đang làm (proposal, plan, tasks, review, targets/, decisions/, contracts/)
├── features/<slug>/spec.md        ← Spec đã xong (+ decisions/, contracts/)
├── decisions/  contracts/         ← ADR / contract xuyên nhiều feature
└── .history/<ngày>-<tên>/         ← File làm việc đã cất; AI không đọc
```
