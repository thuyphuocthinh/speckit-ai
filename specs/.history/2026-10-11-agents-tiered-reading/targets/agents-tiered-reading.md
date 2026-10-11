# Spec: Reading order theo tầng trong AGENTS.md

> **Decisions**:
> **Contracts**:

## Overview

`AGENTS.md` được scaffold hiện bắt agent đọc cả 6 file tài liệu theo thứ tự trước mọi task, kể cả khi task chỉ sửa một dòng logic. Việc này tốn context vào những tài liệu không liên quan tới task. Template được đổi thành hai tầng: vài file luôn đọc, các file còn lại chỉ đọc khi task cần, đúng như bảng "When needed" mà `docs/README.md` đã có.

## Feature Type

- [ ] Small bugfix (< 30 min) — commit message only, no spec needed
- [x] Simple UI / Logic feature — basic review
- [ ] Feature with API / business logic — + test review
- [ ] Sensitive feature (auth, payment, data export) — + security review
- [ ] Large refactor — + performance review

## User Stories

- Là dev dùng agent, tôi muốn agent chỉ đọc tài liệu liên quan tới task, để context không bị tốn vào thứ không cần.
- Là dev, tôi muốn `AGENTS.md` và `docs/README.md` nói cùng một luật đọc, để agent không gặp hai chỉ dẫn mâu thuẫn.

## Acceptance Criteria

### AC-1: AGENTS.md chia tầng luôn đọc và đọc khi cần
Given một project mới scaffold (bất kỳ framework nào, kể cả `generic`) hoặc `--mode=existing`
When mở `.agents/AGENTS.md`
Then có mục "Reading Order" với tầng "luôn đọc" gồm `docs/README.md`, `docs/project-overview.md`, `docs/technology.md`, và tầng "chỉ đọc khi cần" gồm `structure.md` (khi tạo, di chuyển, đổi tên file), `coding-conventions.md` (khi viết hoặc sửa logic), `coding-style.md` (khi format hoặc đụng lint) và thư mục `instructions-and-work-flows/` (khi làm task cụ thể), mỗi mục kèm điều kiện.

### AC-2: Không còn bắt đọc hết mọi file cho mọi task
Given `.agents/AGENTS.md` được scaffold
When đọc mục Reading Order
Then không còn câu "Read in this order before starting any task" và không còn danh sách đánh số 1 đến 6 gộp cả sáu file; các đường dẫn tới tài liệu vẫn nguyên vẹn để mọi tham chiếu khác còn đúng.

### AC-3: AGENTS.md và docs/README.md nhất quán
Given project được scaffold
When so mục Reading Order của `.agents/AGENTS.md` với bảng Required Reading Order của `docs/README.md`
Then hai nơi xếp cùng các file vào cùng tầng: `project-overview.md` và `technology.md` luôn đọc ở cả hai; `structure.md`, `coding-conventions.md`, `coding-style.md`, `instructions-and-work-flows/` đọc khi cần ở cả hai.

## Technical Constraints

- Chỉ sửa `templates/_core/AGENTS.md.tmpl`; mọi framework dùng chung template này nên không cần sửa riêng từng framework.
- Giữ nguyên các dòng khác của `AGENTS.md` (Operation Rules, Important Notes, Cross-tool); không đổi `docs/README.md` template vì nó đã có tầng "When needed".
- Có test trong `tests/scaffolder.test.js` (đổi template ảnh hưởng nội dung được scaffold).
- `.agents/AGENTS.md` do người dùng sở hữu: `speckit-ai upgrade` không sửa file này, nên project cũ giữ bản cũ cho tới khi tự cập nhật.

## Out of Scope

- Đổi nội dung các file docs, hay đổi `docs/README.md`.
- Tự động nạp tài liệu theo loại task (việc chọn vẫn do agent).
- Sửa `.agents/AGENTS.md` của chính repo này.

## Open Questions

Không còn câu hỏi mở.

## Changelog

<!-- Lines are appended by `speckit-ai done`. Do not edit by hand. -->
