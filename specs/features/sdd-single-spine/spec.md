# Spec: SDD Single Spine — ideas → active → features

## Overview

Viết lại flow của speckit-ai thành một mô hình đơn giản, trạng thái suy ra từ **vị trí thư mục**, dùng cho một dev với một AI agent, mọi file `specs/` và `docs/` chỉ nằm ở máy local (không stage lên git):

- `specs/ideas/` — backlog, mỗi ý tưởng một file nhỏ.
- `specs/active/<tên>/` — việc đang làm (thường một, có thể nhiều khi có việc chen ngang): proposal, plan, tasks, review và bản nháp spec của mọi feature bị đụng tới (`targets/`). Một cơ chế cho feature mới, sửa feature cũ và sửa nhiều feature.
- `specs/features/<slug>/` — đã xong: chỉ còn `spec.md` (có `## Changelog`), `decisions/` và `contracts/`.
- `specs/.history/<ngày>-<tên>/` — nơi cất toàn bộ file làm việc của một việc đã `done` (proposal, plan, tasks, review...), ẩn khỏi agent, xóa bằng tay khi muốn.
- ADR và contract nằm cạnh feature bị ảnh hưởng (`decisions/`, `contracts/`); loại xuyên feature nằm ở `specs/decisions/`, `specs/contracts/`. `docs/` chỉ còn tổng quan project.

Bản viết lại phá vỡ tương thích (2.0.0); chủ repo là người dùng duy nhất.

## Feature Type

- [x] Feature có API / business logic — + test review
- [x] Large refactor — + performance review (không áp dụng: CLI cục bộ)

## User Stories

- Là dev, tôi muốn ghi ý tưởng sẽ làm sau vào một chỗ riêng, để `specs/` chỉ chứa thứ đã xong hoặc đang làm.
- Là dev, tôi muốn cổng kiểm tra chạy bằng CLI (`lint`, `done`), để luật SDD không phụ thuộc agent có đọc prompt hay không.
- Là dev, tôi muốn một cơ chế duy nhất để sửa một hay nhiều feature đã xong mà không mất cập nhật.
- Là dev, tôi muốn ADR nằm cùng feature bị ảnh hưởng.
- Là dev, tôi muốn sau khi xong chỉ còn spec gọn kèm một dòng lịch sử, còn chi tiết được cất ở chỗ ẩn để không mất và không làm agent đọc nhầm.

## Acceptance Criteria

### AC-1: lint chỉ chấm file spec
Given việc trong `specs/active/` có `proposal.md`, `plan.md`, `tasks.md`, `review.md`, `targets/*.md`
When chạy `speckit-ai lint`
Then chỉ `targets/*.md` và `specs/features/*/spec.md` được so với `specs/_template.md`; ADR trong mọi `decisions/` được so với template ADR; file khác không bị báo lỗi.

### AC-2: idea và status
Given các ý tưởng có dòng `> **Depends-on**:` và `> **Affects**:`
When chạy `speckit-ai idea "Refund đơn hàng"` rồi `speckit-ai status` (hoặc `--json`)
Then tạo `specs/ideas/refund-don-hang.md`; `status` in việc đang làm và ý tưởng theo thứ tự phụ thuộc, đánh dấu ý tưởng bị chặn, báo lỗi khi phụ thuộc vòng.

### AC-3: start một việc mới
Given chưa có việc nào trong `specs/active/`
When chạy `speckit-ai start refund-don-hang` (tên một ý tưởng) hoặc `start "Tên mới"`
Then tạo `specs/active/<slug>/` với `proposal.md` (lấy từ ý tưởng nếu có) và `targets/<slug>.md` từ template spec; file ý tưởng được chuyển đi.

### AC-4: start sửa feature đã có
Given feature `auth`, `order`, `payment` đã có trong `specs/features/`
When chạy `speckit-ai start "Đổi cấu trúc token" --affects=auth,order,payment`
Then `targets/` chứa bản sao ba spec, `work.json` ghi sha256 từng spec gốc; feature không tồn tại thì dừng exit 1 và không tạo gì.

### AC-5: có thể có nhiều việc đang làm
Given đã có một việc trong `specs/active/` (ví dụ đang làm feature dở thì có bug quan trọng cần fix riêng)
When chạy `start` với tên khác
Then tạo thêm một việc; `start` với tên đã tồn tại thì từ chối (exit 1); `status` liệt kê mọi việc đang làm. Nếu hai việc cùng nhắm một feature thì việc `done` sau bị chặn bởi kiểm tra hash (AC-8).

### AC-6: lệnh không đối số tìm việc đang làm
Given `review`, `handoff`, `generate tests`, `done` chạy không nêu tên
When có đúng một việc active thì dùng nó; có nhiều việc thì báo lỗi kèm danh sách và yêu cầu nêu tên; không có thì báo lỗi rõ
Then `handoff` ghi vào `tasks.md` của việc được chọn; `generate tests` sinh từ `targets/*.md` của việc đó.

### AC-7: done kiểm tra chặt trước khi ghi
Given một việc active
When chạy `done` mà còn `- [ ]` dưới Open Questions, AC không theo dạng `### AC-n:`, còn placeholder `<...>`, tasks chưa tick, thiếu `review.md`, tasks thiếu phase Tests, hoặc `Decisions`/`Contracts` tham chiếu file không tồn tại
Then dừng exit 1, liệt kê mọi lý do, không ghi/xóa gì; `--force` bỏ qua và ghi vào Changelog rằng đã bỏ qua. `--force` không bỏ qua được: `work.json` hoặc file target bị thiếu, feature mới mà `specs/features/<slug>/spec.md` đã tồn tại, và contract trùng tên file ở nơi đến.

### AC-8: done đóng gói an toàn
Given việc active qua mọi kiểm tra
When chạy `done`
Then với mỗi target có spec gốc: chỉ thay khi sha256 hiện tại bằng giá trị trong `work.json` (lệch thì dừng toàn bộ, không ghi gì, yêu cầu merge tay rồi `--force`); target là feature mới thì ghi `specs/features/<slug>/spec.md`; thêm một dòng vào `## Changelog` của mỗi spec bị đụng tới theo dạng `- <ngày> · <tên việc> · <dòng đầu của proposal> · review: <loại review> · chi tiết: .history/<ngày>-<tên việc>`. Dòng này phải tự đủ nghĩa khi `.history/` bị xóa. Mọi kiểm tra xong trước khi ghi.

### AC-9: done cất việc vào .history thay vì xóa
Given đóng gói xong
When `done` kết thúc
Then `decisions/` và `contracts/` của việc được chuyển đi trước (xem AC-10), rồi thư mục `specs/active/<tên>/` được **đổi tên** thành `specs/.history/<ngày>-<tên>/` (giữ nguyên proposal, plan, tasks, review, targets, work.json); không có lệnh hay cơ chế tự dọn `.history/`, bạn xóa bằng tay khi muốn. `proposal.md` ghi rõ `Affects` để từ `.history/` truy được về các feature. `lint`, `serve`, `status` và quét dự án của LLM đều bỏ qua `.history/`; `_workflow.md` dặn agent không đọc nó.

### AC-10: ADR và contract nằm đúng chỗ
Given `generate adr "..."` hoặc `generate contract "..."`
When đang có việc active thì ghi vào `specs/active/<tên>/decisions/` (hoặc `contracts/`), lúc `done` chuyển vào `specs/features/<slug>/decisions/` (hoặc `contracts/`) nếu việc có một target, hoặc vào `specs/decisions/` (hoặc `specs/contracts/`) nếu nhiều target; `--for=<feature>` (bất kể có việc active hay không) ghi vào feature đó và được ưu tiên hơn việc active; có nhiều việc active thì phải chọn bằng `--work=<tên>`; không có việc active và không có `--for` thì ghi vào thư mục chung
Then ADR được đánh số tăng đúng trong thư mục đích; `docs/adrs/` không còn được scaffold; template nằm ở `specs/decisions/0000-template.md` và `specs/contracts/_template.md`.

### AC-11: bỏ tính năng commit prefix
Given các lệnh và hook
When xem `--help`, `--init-hook` và mã nguồn
Then không còn hook `commit-msg`, `requireCommitPrefix` và regex `UC-`/`BR-`; `--init-hook` chỉ cài `pre-commit` và xóa hook `commit-msg` cũ của speckit-ai; tutorial 3 chỉ còn phần hook. Riêng `verify-commit` chỉ còn là cầu nối tạm: in cảnh báo và thoát 0, để hook `commit-msg` cũ chưa được dọn không chặn commit.

### AC-12: hook pre-commit an toàn với project local-only
Given `specs/` và `docs/` bị `.git/info/exclude`
When commit thay đổi source
Then hook chỉ chạy `lint` và không chặn vì "thiếu thay đổi trong specs/docs"; `--init-hook` không ghi đè hook `pre-commit` không phải của speckit-ai (dừng và báo, `--force` mới ghi đè).

### AC-13: scaffold theo bố cục mới
Given project mới
When chạy `npx speckit-ai`
Then tạo `specs/ideas/ active/ features/ decisions/` (kèm `decisions/0000-template.md`), không tạo `docs/adrs/`, `changes/`, `archive/`; template spec có `## Changelog` và AC dạng `### AC-n:`.

### AC-14: bỏ luồng cũ, tài liệu khớp hành vi
Given các lệnh mới
When chạy `--help` và đọc README + tutorials
Then không còn `propose`, `archive`, `--target`, `generate feature`; mọi lệnh và cờ mới đều được nêu.

### AC-15: hotfix có hướng dẫn, không cần lệnh mới
Given `_workflow.md` và các skill
When agent gặp lỗi cần sửa
Then có quy tắc: vặt (chỉ commit); code sai so với spec (sửa + test hồi quy nhắm AC); spec sai/thiếu và gấp (sửa thẳng `features/<slug>/spec.md`, thêm dòng Changelog, kèm test); fix lớn (đi qua `start`).

### AC-16: dọn các điểm lỏng lẻo (giữ nguyên `serve`, `review`, `handoff`)
Given CLI hiện tại
When chạy bất kỳ lệnh nào
Then (a) không in dòng nhiễu của dotenv và chỉ nạp `.env` cho `--mode=auto`, `review`, `handoff` (dùng `quiet: true`); (b) mọi log dùng tiền tố `[speckit-ai]`, và `AGENTS.md`, `coding-conventions.md`, `structure.md` không còn tên `create-ai-docs` hoặc `promptFiller.js`; (c) `--mode=auto` thất bại thì thông báo đúng hành vi (thoát, không "fallback"); (d) stealth cũng exclude `.speckitrc` và `speckit.config.json`; (e) `bin/index.js` chỉ parse args và gọi module trong `src/`.

### AC-17: baseline cho code đã có, không cần tasks và review
Given code đã tồn tại nhưng chưa có spec
When chạy `speckit-ai start "<Title>" --baseline`, viết `targets/<slug>.md` mô tả hành vi hiện tại, rồi `done`
Then `start` không tạo `tasks.md` và ghi `baseline: true` trong `work.json`; `done` bỏ qua cổng tasks và review nhưng vẫn kiểm mọi cổng của chính spec (open questions, `### AC-n:`, placeholder, tham chiếu); Changelog ghi `baseline (từ code hiện có)` thay cho phần review; `--baseline` không kết hợp được với `--affects` (kể cả `Affects` của ý tưởng) và không nhận giá trị; work có `baseline` mà liệt kê feature đã tồn tại bị chặn và không cho `--force`. Ngoài ra `done --force` khi thiếu `review.md` không được crash (Changelog ghi `review: none`).

### AC-18: cờ không hợp lệ bị từ chối
Given mỗi lệnh có danh sách cờ hợp lệ riêng
When gõ một cờ không thuộc lệnh đó, ví dụ `start "X" --afects=auth`
Then lệnh dừng với exit 1 trước khi tạo hay sửa gì, báo `Unknown option --afects for "start"`, gợi ý cờ gần nhất (`Did you mean --affects?`) khi khoảng cách chỉnh sửa tối đa 2, và liệt kê cờ hợp lệ (hoặc nói lệnh không có cờ nào); `--help` luôn được chấp nhận.

## Technical Constraints

- Không thêm dependency mới; metadata dùng dòng `> **Key**: value` (quy ước của contract template), không YAML front-matter.
- Không phụ thuộc git (specs là local, không có bản sao lưu): `done` chỉ đổi tên thư mục, không xóa đệ quy. `handoff`/`review` vẫn dùng `git diff` cho code như hiện nay.
- Mọi thay đổi logic có unit test; mỗi `src/X.js` mới có `tests/X.test.js`.
- Không `eslint-disable`, không `@ts-ignore`/`as any`. Không tự `npm publish`.
- Được sửa `templates/` (chủ repo xác nhận rule trong AGENTS.md viết sai).

## Out of Scope

- Nhiều agent chạy đồng thời trên cùng project.
- Merge theo requirement; lint ngữ nghĩa hoặc LLM làm cổng.
- Tham chiếu chéo spec giữa ecom-api và ecom-ui.
- Sửa hành vi của `serve`, `review`, `handoff` ngoài việc chúng dùng cơ chế tìm việc active mới; refactor `src/llm.js` (khóa API riêng, model ID cứng).
- Công cụ tự chuyển project cũ (làm tay).

## Open Questions

Không còn câu hỏi mở.

## Changelog

<!-- Lines are appended by `speckit-ai done`. -->
