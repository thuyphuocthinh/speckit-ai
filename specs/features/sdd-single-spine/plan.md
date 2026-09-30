# Implementation Plan: SDD Single Spine

> Based on: `spec.md`

## Goal

Một flow SDD đơn giản cho một dev + một AI agent, mọi thứ local: `ideas/ → active/ → features/`. `active/` có thể chứa **nhiều việc cùng lúc** (ví dụ đang làm feature dở thì có bug quan trọng chen vào). Lệnh mới `idea`, `start`, `done`, `status`. Cổng kiểm tra bằng CLI để agent nào cũng phải qua. Kèm dọn các điểm lỏng lẻo của CLI cũ (giữ `serve`, `review`, `handoff`). Phá vỡ tương thích, ra 2.0.0.

## Trạng thái implement

Đã implement trên nhánh `feat/sdd-single-spine` (chưa commit): 228 test pass (trước là 103); đã chạy thử toàn bộ flow bằng CLI thật trong thư mục tạm.

Lệch so với plan ban đầu (đã chấp nhận):
- Module thêm ngoài danh sách: `src/done.js` (tách khỏi `lifecycle.js` cho gọn), `src/cli.js` (điều phối lệnh, có test; `bin/index.js` chỉ gọi nó), `src/init.js` (luồng scaffold), `src/env.js` (nạp `.env` với `quiet: true`).
- `generate adr|contract` có thêm `--work=<tên>`; `--for` luôn được ưu tiên hơn việc active.
- CLI báo lỗi với lệnh không biết thay vì âm thầm scaffold; `--init-hook` dọn hook `commit-msg` cũ của speckit-ai.
- Sửa `toKebabCase` (mất chữ "đ"), linter bỏ qua heading ví dụ `### AC-n:` trong template, `llm.scanProject` bỏ qua thư mục ẩn (`.history`).
- Thêm sau khi rà soát: cờ không hợp lệ bị từ chối kèm gợi ý (AC-18), và `verify-commit` thành cầu nối tạm (cảnh báo, thoát 0) để hook `commit-msg` cũ không chặn commit.
- Thêm sau khi dùng thử trên project có code sẵn: `start --baseline` (AC-17), viết spec cho code đã tồn tại mà không cần tasks/review; và sửa lỗi `done --force` crash khi thiếu `review.md`.

Còn lại:
- Bước 19 (chuyển ecom-api): làm tay, nằm ngoài repo.
- 17 spec lịch sử (không khớp template mới) đã được `git mv` vào `specs/.history/legacy/`; `lint` của repo giờ xanh.
- Chưa kiểm chứng: `git commit` qua hook thật, `handoff`/`review`/`--mode=auto` với API key thật, chạy `serve`.

## Bố cục

```
specs/
├── _template.md           ← AC dạng ### AC-n:, có ## Changelog
├── _workflow.md
├── ideas/<slug>.md        ← > **Depends-on**:, > **Affects**:
├── active/<tên>/          ← thường một, có thể nhiều
│   ├── proposal.md  plan.md  tasks.md  review.md
│   ├── targets/<feature>.md   ← feature mới hoặc bản sao spec gốc
│   ├── decisions/  contracts/
│   └── work.json              ← sha256 spec gốc lúc start
├── features/<slug>/
│   ├── spec.md
│   └── decisions/  contracts/
├── decisions/             ← ADR xuyên feature (+ 0000-template.md)
├── contracts/             ← contract xuyên feature (+ _template.md)
└── .history/<ngày>-<tên>/ ← việc đã done, cất nguyên vẹn; ẩn khỏi agent, xóa bằng tay
docs/                      ← chỉ tổng quan project
```

## Flow

```
idea "X"  →  start X [--affects=a,b]  →  (agent: spec → plan → tasks → code → review)  →  done
```

- `start`: mở được nhiều việc, trùng tên thì từ chối. Với `--affects`, copy spec gốc vào `targets/` và ghi hash.
- Lệnh không đối số (`review`, `handoff`, `generate tests`, `done`): một việc active thì dùng nó, nhiều việc thì phải nêu tên, không có thì báo lỗi.
- `lint` (hook, mỗi commit): chỉ kiểm cấu trúc.
- `done`: kiểm chặt (Open Questions hết, AC đúng dạng, không placeholder, tasks tick + có phase Tests, có `review.md`, tham chiếu tồn tại, hash gốc khớp) → ghi `features/<slug>/spec.md` + dòng Changelog (có tên thư mục `.history`) → đổi tên `active/<tên>/` thành `.history/<ngày>-<tên>/`. Kiểm xong mới ghi; sai bất kỳ điều gì thì không đổi gì. Không có lệnh dọn `.history/`.
- ADR và contract dùng chung một quy tắc: đang làm thì vào `active/<tên>/decisions/` hoặc `contracts/`, `done` chuyển vào feature (một target) hoặc thư mục chung `specs/decisions/`, `specs/contracts/` (nhiều target).
- Hotfix: không có lệnh, chỉ quy tắc trong `_workflow.md` (AC-15).

## Files sẽ TẠO MỚI

| File                                                | Mục đích                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/features.js`                                   | Tìm việc active / feature / ý tưởng, đọc-ghi metadata, sha256, thứ tự phụ thuộc |
| `src/lifecycle.js`                                  | `idea`, `start`, `done`, `status`                                               |
| `templates/_core/idea.md.tmpl`                      | Template ý tưởng                                                                |
| `templates/_core/decisions/0000-template.md.tmpl`   | Chuyển từ `_core/adrs/`                                                         |
| `tests/features.test.js`, `tests/lifecycle.test.js` | Test cho hai module mới                                                         |

## Files sẽ SỬA / XÓA

| File                                                                                                                 | Thay đổi                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/generator.js`                                                                                                   | Xóa `generate feature`, `generateChangeProposal`, `archiveChange`; `generate adr\|contract\|tests` theo bố cục mới, `--for` |
| `src/linter.js`                                                                                                      | Chỉ chấm file spec + ADR; quét bố cục mới                                                                                   |
| `src/handoff.js`, `src/reviewer.js`                                                                                  | Dùng việc active; bỏ đoán theo mtime và ba đường dẫn                                                                        |
| `src/hook.js`                                                                                                        | Bỏ kiểm "phải stage file specs/docs", bỏ hook `commit-msg`; chỉ cài `pre-commit` chạy `lint`; không ghi đè hook lạ          |
| `src/stealth.js`                                                                                                     | Thêm `.speckitrc`, `speckit.config.json` vào danh sách exclude; đổi tiền tố log                                             |
| `src/scaffolder.js`                                                                                                  | Tạo `ideas/ active/ features/ decisions/ contracts/`; bỏ `docs/adrs/`                                                       |
| `bin/index.js`                                                                                                       | Lệnh/cờ mới; xóa `propose`, `archive`, `--target`, `verify-commit`; `--help`; chỉ parse args; nạp `dotenv` (`quiet: true`) chỉ khi cần |
| `src/scaffolder.js` (log), `.agents/AGENTS.md`, `docs/.../coding-conventions.md`                                    | Đổi `[create-ai-docs]` thành `[speckit-ai]`; sửa tên cũ                                                                     |
| `templates/_core/specs-template.md.tmpl`                                                                             | `### AC-n:`, `## Changelog`, dòng `Decisions`/`Contracts`                                                                   |
| `templates/_core/specs-workflow.md.tmpl`, `AGENTS.md.tmpl`, `workflow-adding-feature.md.tmpl`, `docs-README.md.tmpl` | Flow mới + hotfix + dặn agent không đọc `specs/.history/` (đọc lại trước khi sửa)                                                                                   |
| `templates/_skills/spec-create`, `spec-plan`, `spec-review`                                                          | Dùng `idea`/`start`/`done`, ghi vào `targets/`, ADR đúng chỗ                                                                |
| `docs/tutorials/01–04`, `README.md`                                                                                  | Viết lại theo flow mới                                                                                                      |
| `docs/.../structure.md`, `docs/README.md`, `docs/project-overview.md`                                                | Module và bố cục mới                                                                                                        |
| `templates/_core/adrs/`, `archive/`, `changes/` còn sót, `specs/features/add-2fa`                                    | Xóa                                                                                                                         |
| `tests/` liên quan                                                                                                   | Viết lại; xóa test của `propose`/`archive`                                                                                  |

## Rủi ro / chưa kiểm chứng

| Điều                                                        | Ghi chú                                                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `.history/` lớn dần                                         | Chấp nhận: file markdown nhỏ, bạn xóa bằng tay. Nếu sau vài tháng không ai mở, đổi bước "đổi tên" thành "xóa" (một dòng) |
| Dòng Changelog trỏ vào `.history/` đã bị xóa                | Dòng vẫn tự đủ nghĩa; chỉ phần "chi tiết" trỏ vào chỗ trống |
| ecom-api (ngoài repo)                                       | Chưa kiểm; chuyển bằng tay ở bước cuối                                                             |
| `handoff`/`review` cần API key thật, `llm.js` cứng model cũ | Ngoài phạm vi, chưa kiểm được                                                                      |

## Checklist (thứ tự cho `implement`)

1. Chạy `node bin/index.js lint` và `npx jest`, ghi số liệu nền (54 file lỗi, 103 test pass).
2. `src/features.js` + test: tìm active/feature/idea, metadata, sha256, thứ tự phụ thuộc, phát hiện vòng.
3. Xóa tính năng commit prefix: `verify-commit`, hook `commit-msg`, `requireCommitPrefix` + test (AC-11). Lý do: code chết (config không trả giá trị này) và đòi ID `UC-`/`BR-` không còn tồn tại.
4. `src/linter.js` chỉ chấm file spec + ADR, quét bố cục mới + test (AC-1). Lý do: hiện lint chấm cả plan/tasks/review nên báo lỗi sai.
5. `src/hook.js` bỏ kiểm stage specs/docs, không ghi đè hook lạ + test (AC-12). Lý do: specs local nên không stage được, hook hiện chặn mọi commit source.
6. Dọn lỏng lẻo + test (AC-16): `dotenv` `quiet: true` và chỉ nạp khi cần; tiền tố `[speckit-ai]` và tên cũ trong docs; thông báo `--mode=auto`; stealth exclude file config; đưa logic còn sót trong `bin/index.js` sang `src/`.
7. Template (spec, idea, ADR chuyển `decisions/`) + `scaffolder.js` + test (AC-13).
8. `idea` + `status` + test (AC-2).
9. `start` (mới, `--affects`, từ chối trùng tên, cho phép nhiều việc) + test (AC-3, 4, 5).
10. Tìm việc active (một / nhiều / không có) dùng trong `review`, `handoff`, `generate tests`, `done` + test (AC-6).
11. `done`: kiểm chặt, không ghi gì khi chặn + test (AC-7).
12. `done`: đóng gói, hash, Changelog (kèm tên thư mục `.history`), đổi tên `active/<tên>/` sang `.history/` + test (AC-8, 9). Kiểm tra `lint`, `serve`, `status` và `llm.scanProject` bỏ qua `.history/`.
13. `generate adr|contract --for`, ADR/contract trong active và chuyển lúc `done` + test (AC-10).
14. `bin/index.js`: lệnh/cờ mới, xóa lệnh cũ, `--help`; xóa code và test cũ + test (AC-14).
15. `_workflow`, `AGENTS.md.tmpl`, `workflow-adding-feature`, `docs-README.md.tmpl`, skill: đọc lại từng file rồi sửa (AC-14, 15).
16. Viết lại tutorial 01–04, README; cập nhật `structure.md`, `docs/README.md`, `project-overview.md`.
17. Dogfood trên repo này: đưa `specs/features/done/*` về `features/<slug>/spec.md`, xóa `archive/`, `add-2fa`; chạy `lint`, `npx jest`.
18. Chạy thử trong thư mục tạm: `idea` → `start` → `done`, và `start --affects=a,b,c`.
19. Chuyển ecom-api bằng tay; bump 2.0.0; **không** tự `npm publish`.
