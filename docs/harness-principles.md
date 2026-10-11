# Harness Engineering — 13 nguyên lý (tóm tắt tham khảo)

> Tài liệu tham khảo cho người làm repo này, không nằm trong "Required Reading Order" của AI.
> Nguồn: https://learnharness.org/nguyen-ly/harness-first (13 trang con, đọc ngày 2026-10-11). Đây là bản tóm tắt bằng lời của người viết, nội dung gốc có thể đã đổi.

## Công thức nền

**Agent = Model + Harness**

- **Model**: bộ não, chỉ có năng lực suy luận.
- **Harness**: mọi thứ bao quanh model (spec, context, tools, state, validation, observability, human review).

Luận điểm của cả bộ: agent làm sai thì thường nguyên nhân nằm ở Harness, nên tối ưu Harness trước khi đổi model.

Vòng đời một lần chạy và nguyên lý tương ứng:

```
Nhận task ─→ Chọn context (10) ─→ Hướng dẫn bằng spec/guide (05, 06)
   ─→ Agent nhỏ, tập trung chạy (09), luồng do app điều khiển (08)
   ─→ Output có cấu trúc (11) ─→ Sensor kiểm tra (05)
   ─→ Cần thì dừng chờ người (07) ─→ Ghi trace (12, 04)
   ─→ Lỗi thì đổi thành test/rule/spec mới (13)
```

---

## Nhóm A: Tư duy nền

### 01. Harness-first
Agent làm sai thì đừng vội đổi model hay viết prompt dài hơn. Hỏi trước: có đủ context chưa, có tool chưa, có test/validation chưa, có trace chưa, có review chưa.
Anti-pattern: *model shopping* (đổi model liên tục), *prompt obsession* (chỉ sửa prompt), *validation-free agent*, *tool neglect*.

### 02. Harnessability
Hệ thống phải được thiết kế để agent dễ hiểu và dễ bị kiểm tra. Agent càng phải đoán thì càng sai.
Hệ thống tốt có: ranh giới module rõ, contract rõ, convention ổn định, test được, quan sát được (trace), khôi phục được (retry/resume/rollback).
Anti-pattern: *god module*, *hidden knowledge* (luật nằm trong đầu dev), *inconsistent naming*, *architecture drift*.

---

## Nhóm B: Hướng dẫn agent trước khi chạy

### 05. Guide & Sensor
- **Guide** (feedforward): hướng dẫn trước khi làm. Ví dụ: spec, AGENTS.md, ví dụ đúng/sai, tool schema, workflow.
- **Sensor** (feedback): kiểm tra sau khi làm. Ví dụ: test, linter, type checker, schema validation, eval, human review.
- Chỉ có Guide: agent tự tin làm sai mà không ai biết. Chỉ có Sensor: agent làm sai lặp lại vì không ai chỉ hướng.
- Vòng cải tiến: Guide → Agent làm → Sensor kiểm → phát hiện lỗi → cập nhật guide/spec/test → lần sau tốt hơn.
- Anti-pattern: *prompt-only agent*, *human-as-the-only-sensor*, *AI without feedback*.

### 06. Spec-as-source
Spec là nguồn sự thật chính thức, không chỉ tài liệu để đọc. Kiến thức nằm trong Slack/email/cuộc họp thì agent không thấy.
Một spec tốt: có version, được review, test được, machine-readable, human-readable, và runtime ghi lại đã dùng spec version nào.
Từ spec có thể sinh: test case, prompt, checklist review, validation.
Anti-pattern: *tribal knowledge*, *Slack-driven development*, *outdated documentation*, *spec drift*.

### 10. Context ownership
Context window đắt, nhiều hơn không có nghĩa tốt hơn. Harness phải chủ động quyết định model được thấy gì: cung cấp, loại bỏ, cập nhật, cấu trúc.
Ví dụ sửa lỗi backend: đưa mô tả lỗi, API/service/test liên quan, quy tắc kiến trúc; bỏ cả repo, lịch sử commit, wiki cũ.
Context builder nên làm: lấy đúng nguồn, xếp hạng, lọc nhiễu, nén, giữ nguồn gốc, đánh dấu độ mới, phát hiện mâu thuẫn, đóng gói thành context package có cấu trúc.
Anti-pattern: *repository dumping*, *context as storage*, *agent-led discovery*, *static context*.

---

## Nhóm C: Kiểm soát khi agent đang chạy

### 03. Event/channel agnostic
Agent có thể được gọi từ nhiều kênh (chat, API, webhook, cron, nút bấm) nhưng mọi luồng phải đi qua **cùng một Harness**. Xem giải thích kỹ ở mục "Giải thích sâu" bên dưới.

### 07. Human as control point
Con người là điểm kiểm soát chính thức trong workflow, tham gia đúng lúc, không phải mọi lúc.
Dừng và hỏi người khi: confidence thấp, thiếu dữ liệu, tín hiệu mâu thuẫn, output ảnh hưởng lớn, side effect khó rollback, rule mơ hồ, lỗi lặp lại, người dùng yêu cầu.
Mức review chia theo rủi ro: không review → xem nhanh → bắt buộc duyệt → chuyên gia → hội đồng.
Anti-pattern: *full automation*, *human everywhere*, *invisible escalation*, *undefined ownership*.

### 08. Application-owned control flow
LLM đề xuất, application quyết định. Xem giải thích kỹ ở mục "Giải thích sâu" bên dưới.

### 09. Small focused agents
Chia agent/module nhỏ, mỗi cái một trách nhiệm: Research, Planning, Coding, Review. Mỗi module có input/output schema, context boundary, tool boundary, validation, trace, test riêng.
Không phải module nào cũng là LLM: chỗ nào code/rule kiểm chắc chắn được thì dùng code, chỉ dùng LLM nơi cần suy luận.
Anti-pattern: *super agent*, *context explosion*, *mixed responsibilities*, *monolithic agent*.

### 11. Structured-output-first
Agent trả kết quả có cấu trúc (JSON có schema) trước, giải thích bằng lời sau.
Thay vì "Khách hàng có vẻ quan tâm CNTT" thì trả `{"interest":"Information Technology","confidence":0.91}`.
Output có schema là một cổng: schema hợp lệ → logic nghiệp vụ hợp lệ → an toàn → mới execute hoặc reject.
Anti-pattern: *regex parsing*, *free-form output*, *schema drift*, *hidden format rules* (format chỉ nằm trong prompt).

---

## Nhóm D: Sau khi chạy: quan sát, khôi phục, học

### 12. Traceable state
Mỗi lần chạy để lại dấu vết đủ để biết chuyện gì đã xảy ra: input, context, tool call, output, validation, lỗi, kết quả nghiệp vụ, kèm `run_id`, spec/model/schema version. Khác log rời rạc: trace ghi cả đường đi của một lần chạy, nên replay và audit được.
Anti-pattern: *stateless agent*, *missing context history*, *lost execution data*, *no audit trail*.

### 04. Production controllability
Agent sẽ luôn mắc lỗi, nên hệ thống phải: **trace** (xem), **replay** (tái hiện), **retry** (thử lại có kiểm soát), **resume** (tiếp tục từ chỗ lỗi), **rollback** (hoàn tác). Thêm: giới hạn quyền agent, truy nguyên nguyên nhân lỗi (spec mơ hồ, context thiếu, tool lỗi...), ghi lại mọi lần người can thiệp.
Anti-pattern: *black box agent*, *no replay*, *no state persistence*, *no rollback*.

### 13. Error as feedback
Mỗi lỗi là tín hiệu Harness còn thiếu gì đó. Lỗi lặp lại phải thành test, rule, sensor hoặc spec mới.

| Lỗi | Cải tiến Harness |
|---|---|
| Hiểu sai nhiệm vụ | cập nhật prompt/spec |
| Context thiếu / nhiễu | cải tiến context builder / ranking |
| Output sai format | thêm schema validation |
| Tool call sai | siết tool permission |
| Lỗi lặp lại | tạo regression test |
| Case rủi ro bị tự xử lý | thêm human review gate |
| Workflow sai nhánh | sửa control flow |

8 nhóm lỗi: input, context, instruction, reasoning, tool, output, control flow, governance.
Anti-pattern: *fix-and-forget*, *manual recovery only*, *blame-the-model*, *no learning loop*.

---

## Giải thích sâu

### 08. Application-owned control flow

**Ý chính:** LLM chỉ làm phần cần hiểu ngôn ngữ và suy luận. Mọi quyết định về luồng chạy (bước nào tiếp theo, có thử lại không, có dừng không, có được ghi/gửi/xóa không) nằm trong **code của bạn**, không nằm trong prompt.

**Ví dụ: agent xử lý yêu cầu hoàn tiền.**

Cách sai (*prompt-as-workflow*): đưa cho model một prompt dài và các tool.
> "Nếu khách đòi hoàn tiền, hãy kiểm tra đơn hàng. Nếu hợp lệ thì gọi `refund_api`. Nếu lỗi thì thử lại cho tới khi được. Nếu số tiền lớn thì hỏi quản lý."

Model tự quyết thứ tự các bước. Hậu quả có thể gặp: bỏ qua bước kiểm tra, gọi `refund_api` hai lần, retry vô hạn khi API lỗi, "quên" hỏi quản lý. Luật "số tiền lớn là bao nhiêu" nằm trong prompt nên khó test, khó version, khó review.

Cách đúng: code giữ luồng, model chỉ được gọi ở một bước.

```js
const proposal = await llm.analyze(ticket);        // LLM: đọc thư khách, trả {intent, orderId, reason}
const check = validateSchema(proposal);            // Harness: kiểm schema
if (!check.ok) return reject(check.errors);

const order = await db.getOrder(proposal.orderId); // code: lấy dữ liệu thật
if (!isRefundable(order)) return reject('not refundable');      // code: luật nghiệp vụ
if (order.amount > LIMIT) return openHumanGate(order, proposal); // code: cổng người

await withRetry(() => refundApi.refund(order.id), { max: 3 });   // code: retry có giới hạn
```

Phân vai:

| Ai | Làm gì |
|---|---|
| LLM | Hiểu nội dung, **đề xuất** |
| Harness | Kiểm output của LLM có hợp lệ không |
| Application | **Quyết định** (đồng ý, từ chối, chuyển người) |
| System | **Thực thi** (gọi API, ghi DB) |

Lợi ích: cùng input thì đi cùng luồng, luật nằm trong code nên test và version được, mỗi quyết định có thể log, và agent không thể tự ý làm việc nguy hiểm.

Anti-pattern: *Agent-Decides-All*, *Prompt-As-Workflow*, *Hidden Business Logic* (luật nằm trong prompt), *Unbounded Retry* (không có điều kiện dừng).

**Ví dụ có sẵn trong repo này:** `specs/_workflow.md` ghi `speckit-ai` chạy phần deterministic (`start`, `done`, `lint`, `status`), AI chỉ viết nội dung. "Xong chưa" do lệnh `done` kiểm các cổng quyết định, không để AI tự tuyên bố xong. Nếu chỉ ghi "chỉ báo xong khi mọi AC đạt" trong AGENTS.md thì đó là để agent tự quyết.

### 03. Event/channel agnostic

**Ý chính:** agent có thể được kích hoạt từ nhiều nơi. Kênh chỉ là nơi phát sinh yêu cầu. Logic kiểm soát phải nằm ở **một chỗ chung**, không nằm trong từng kênh.

**Ví dụ: agent hỗ trợ khách hàng, được gọi từ chat, webhook của email, và cron mỗi đêm.**

Cách sai: mỗi kênh tự viết logic riêng.
- Chat có đoạn kiểm "không hoàn tiền quá 1 triệu".
- Webhook email có bản sao chép gần giống, đã lệch một chút.
- Cron không kiểm gì vì "chạy nội bộ".

Hậu quả: cùng một ca, kênh chat từ chối, kênh email lại duyệt. Khi đổi luật phải sửa 3 nơi và dễ sót một. Thêm kênh Slack phải copy lại toàn bộ. Log mỗi kênh một kiểu nên khó điều tra.

Cách đúng: mỗi kênh có một **adapter** mỏng đổi tín hiệu thành một **event chuẩn**, rồi mọi event đi vào cùng một Harness.

```
Chat    ─┐
Webhook ─┤→ adapter → Event chuẩn → Harness chung → Agent
Cron    ─┤              {id, type, source_channel,   (context, quyền,
Nút bấm ─┘               actor, payload, ...}         validation, trace)
```

Adapter **nên làm**: nhận dữ liệu, đổi về format chuẩn, gắn metadata, kiểm input tối thiểu, gửi event vào Harness.
Adapter **không nên chứa**: business logic, prompt chính, policy, validation chính, quyết định, kiểm soát tool.

Lợi ích: agent cư xử giống nhau ở mọi kênh, đổi luật một nơi, thêm kênh mới chỉ viết một adapter, trace thống nhất và replay được độc lập với kênh gốc.

Anti-pattern: *channel-specific logic*, *duplicate validation*, *inconsistent behavior*, *multiple control layers*.

**Ví dụ có sẵn trong repo này:** `CLAUDE.md` và `.cursorrules` chỉ trỏ về `.agents/AGENTS.md` (adapter mỏng, luật nằm ở một file). Pre-commit hook gọi chính lệnh `speckit-ai lint`, không có bản kiểm tra riêng.

---

## Đối chiếu với speckit-ai (tại 2026-10-11)

| # | Nguyên lý | Mức | Ghi chú |
|---|---|---|---|
| 01 | Harness-first | ✅ | Chính là luận điểm của sản phẩm |
| 02 | Harnessability | ✅ | Template structure / conventions / technology theo framework |
| 03 | Event/channel agnostic | ✅ | CLAUDE.md, .cursorrules → AGENTS.md |
| 04 | Production controllability | ◐ | `done` ghi tất cả hoặc không gì, `--force` ghi vào Changelog. Không cần thêm replay/rollback |
| 05 | Guide & Sensor | ✅ | Guide: AGENTS.md, docs, skills. Sensor: lint, done, hook, review |
| 06 | Spec-as-source | ✅ | `specs/features/*/spec.md`, Changelog, hash check |
| 07 | Human as control point | ✅ | Open Questions chặn implement. Bảng Feature Type là các mức review |
| 08 | Application-owned control flow | ✅ | CLI giữ phần deterministic, AI viết nội dung |
| 09 | Small focused agents | ✅ | 3 skill: spec-create / spec-plan / spec-review |
| 10 | Context ownership | ◐ | Có thứ tự đọc. `llm.js` cắt diff 15000 ký tự lặng lẽ |
| 11 | Structured-output-first | ◐ | `reviewCode` trả JSON nhưng `llm.js` chỉ parse, chưa kiểm schema |
| 12 | Traceable state | ◐ | `work.json`, `.history/` cho specs. Các lần gọi LLM không để lại dấu vết |
| 13 | Error as feedback | ◐ | Hotfix cần regression test. "Lessons Learned" bị chuyển vào `.history/` mà AI không được đọc |

Các nguyên lý 03, 04, 08 ở mức nâng cao (event schema, execution record, state machine) dành cho agent chạy production, nằm ngoài scope của `speckit-ai` (xem `docs/project-overview.md`).
