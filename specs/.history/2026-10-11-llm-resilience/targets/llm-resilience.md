# Spec: Gọi LLM bền vững

> **Decisions**:
> **Contracts**:

## Overview

Mọi lời gọi tới LLM (Gemini, OpenAI, Claude) trong `--mode=auto`, `handoff` và `review` đi qua một lớp chung: có timeout, thử lại có giới hạn khi gặp lỗi nhất thời, báo lỗi rõ ràng, luôn dùng đúng khóa của hãng được chọn, cho phép đổi model bằng biến môi trường, và `--mode=auto` kiểm schema kết quả trước khi ghi file.

## Feature Type

- [ ] Small bugfix (< 30 min) — commit message only, no spec needed
- [ ] Simple UI / Logic feature — basic review
- [x] Feature with API / business logic — + test review
- [ ] Sensitive feature (auth, payment, data export) — + security review
- [ ] Large refactor — + performance review

## User Stories

- Là dev, tôi muốn lệnh gọi LLM không treo vô hạn, để biết khi nào mạng hoặc hãng đang có vấn đề.
- Là dev, tôi muốn một lỗi mạng hay giới hạn tốc độ nhất thời được tự thử lại, để `review` nhiều phần không thất bại giữa chừng.
- Là dev, tôi muốn thông báo lỗi nói rõ nguyên nhân (hết thời gian, sai khóa, phản hồi bị chặn) thay vì `TypeError`.
- Là dev, tôi muốn khóa API của hãng này không bao giờ bị gửi tới hãng khác.
- Là dev, tôi muốn đổi model bằng biến môi trường khi hãng gỡ model cũ.

## Acceptance Criteria

### AC-1: Timeout
Given một lời gọi LLM mà hãng không phản hồi trong thời gian chờ (mặc định 60000 ms; đổi bằng `SPECKIT_LLM_TIMEOUT_MS` là số nguyên dương, giá trị sai thì dùng mặc định)
When lời gọi hết thời gian chờ ở lần thử cuối
Then lệnh thất bại với thông báo `<Hãng> did not answer within <n>s` (n là số giây), không treo.

### AC-2: Retry có giới hạn cho lỗi nhất thời
Given lời gọi gặp lỗi mạng, hết thời gian chờ, hoặc HTTP 429, 500, 502, 503, 504
When chạy lệnh
Then lời gọi được thử lại tối đa 3 lần tổng cộng, chờ 1 giây rồi 2 giây giữa các lần (gấp đôi mỗi lần); thành công ở một lần thử sau thì trả kết quả bình thường; vẫn lỗi ở lần thứ 3 thì thất bại với lỗi của lần cuối và không có lần gọi thứ 4.

### AC-3: Lỗi không nhất thời không được thử lại
Given hãng trả HTTP khác thành công và không thuộc danh sách ở AC-2 (ví dụ 400, 401, 403, 404), hoặc trả 200 kèm trường `error`
When chạy lệnh
Then thất bại ngay sau một lần gọi với thông báo `<Hãng> API error (<mã>): <thông điệp của hãng, hoặc mô tả mã HTTP>`.

### AC-4: Phản hồi rỗng hoặc bị chặn có thông báo rõ
Given hãng trả thành công nhưng không có nội dung trả lời (Gemini không có `candidates`, OpenAI không có `choices`, Claude không có `content`)
When chạy lệnh
Then thất bại với thông báo `<Hãng> returned no answer (<lý do>)`, lý do lấy từ `blockReason` hoặc `finishReason` nếu có, không phải `TypeError`, và không thử lại.

### AC-5: Hãng và khóa luôn khớp nhau
Given một hoặc nhiều biến `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` được đặt
When `--mode=auto`, `handoff` hoặc `review` chọn hãng
Then hãng được chọn theo thứ tự ưu tiên Gemini, Claude, OpenAI trong số các hãng có khóa, và khóa gửi đi luôn là khóa của đúng hãng đó (không bao giờ khóa của hãng khác); không có khóa nào thì báo lỗi `API Key is missing`. Khóa Gemini được gửi qua header `x-goog-api-key`, không nằm trong URL.

### AC-6: Model cấu hình được
Given `SPECKIT_GEMINI_MODEL`, `SPECKIT_ANTHROPIC_MODEL` hoặc `SPECKIT_OPENAI_MODEL` được đặt
When gọi hãng tương ứng
Then model đó được dùng thay cho mặc định; không đặt thì dùng mặc định `gemini-1.5-flash`, `claude-sonnet-5-5`, `gpt-4o-mini`.

### AC-7: --mode=auto kiểm schema trước khi ghi
Given model trả kết quả cho `--mode=auto`
When kết quả không phải object, hoặc `technology` hay `projectOverview` không phải chuỗi không rỗng
Then ném lỗi bắt đầu bằng `AI Generation failed: Generated docs are malformed`, scaffold dừng, không có file nào được ghi; thông báo dừng của `init` không còn khẳng định nguyên nhân là thiếu khóa API.

## Technical Constraints

- Không thêm dependency: dùng `fetch` và `AbortSignal.timeout` có sẵn từ Node 18.
- Thời gian chờ giữa các lần thử và hàm `sleep` có thể thay được qua tham số của `callAI` để test không phải chờ thật.
- Không ghi khóa API vào thông báo lỗi hay log.
- Giữ nguyên tên hàm xuất của `src/llm.js` (`scanProject`, `callAI`, `generateDocs`, `generateHandoffSummary`, `reviewCode`).

## Out of Scope

- Streaming, hủy lời gọi từ phía người dùng, hạn mức chi phí.
- Đọc cấu hình model từ `.speckitrc`.
- Đổi `max_tokens` của Claude hay đổi prompt.
- Xác minh model mặc định còn được hãng hỗ trợ.

## Open Questions

Không còn câu hỏi mở.

## Changelog

<!-- Lines are appended by `speckit-ai done`. Do not edit by hand. -->
