# Review: llm-resilience

Feature Type: Feature with API / business logic (code review + test review).

## 5a. Code Review

- Toàn bộ logic gọi API nằm trong `src/llm.js`: `PROVIDERS` + `resolveProvider` (chọn hãng, lấy đúng khóa), `requestWithRetry` (timeout, retry, phân loại lỗi), `callAI` (3 hãng), `normalizeGeneratedDocs`. Tên các hàm xuất cũ giữ nguyên; thêm `resolveProvider` để test.
- Lỗi cũ được sửa: logic chọn khóa và logic chọn hãng trước đây độc lập nên chỉ đặt khóa OpenAI và Claude thì khóa OpenAI bị gửi tới Claude. Nay hãng được chọn trước rồi mới lấy khóa của hãng đó, ở một chỗ duy nhất (3 nơi dùng chung).
- Retry có giới hạn cứng (3 lần, 1s rồi 2s), chỉ cho lỗi nhất thời; lỗi khác dừng ngay. Không có vòng lặp vô hạn: vòng `for` luôn thoát bằng `return` hoặc `throw` ở lần thứ 3.
- Khóa Gemini chuyển từ query string sang header `x-goog-api-key`, nên không xuất hiện trong URL; test kiểm khóa không có trong thông báo lỗi.
- Không thêm dependency; chỉ dùng `fetch` và `AbortSignal.timeout` (Node 18+). Không có `eslint-disable`, không cast kiểu.
- Điểm cần theo dõi (không chặn): model mặc định của Gemini (`gemini-1.5-flash`) và OpenAI (`gpt-4o-mini`) không kiểm chứng được với API thật vì không có khóa trong môi trường phát triển; đã ghi rõ trong spec và tài liệu, và có biến môi trường để đổi. Model mặc định của Claude đổi sang `claude-sonnet-5-5` vì ID cũ có nguy cơ đã bị gỡ.

## 5b. Test Review

- Mock `fetch` có `ok` và `status`, kiểm: thử lại thành công ở lần sau (1s rồi 2s), từng mã 429/500/502/503/504, tối đa 3 lần rồi lỗi và không có lần thứ 4, phản hồi lỗi không phải JSON, lỗi mạng kèm nguyên nhân.
- Timeout: ánh xạ `TimeoutError` sang thông báo "did not answer within Ns", biến `SPECKIT_LLM_TIMEOUT_MS` hợp lệ và 5 giá trị không hợp lệ, và một test lời gọi treo thật bị ngắt bởi `AbortSignal.timeout` (không dùng mock hóa kết quả).
- Lỗi không nhất thời (400, 401, 403, 404, và 200 kèm `error`) dừng sau một lần gọi; phản hồi rỗng hoặc bị chặn của cả 3 hãng (7 trường hợp) báo lý do và không thử lại.
- Chọn hãng: 4 tổ hợp khóa, trường hợp lỗi cũ (OpenAI + Claude), khóa Gemini trong header, khóa không lọt vào thông báo lỗi. Model: mặc định và đổi bằng biến môi trường cho 3 hãng. Schema `--mode=auto`: 4 kiểu sai và trường hợp hợp lệ. `cli.test.js`: `--mode=auto` thất bại thì không ghi file nào và thông báo mới.
- `npm test`: 19 suite, 395 test đều pass.
- Chưa có: gọi API thật của cả 3 hãng (cần khóa).

## 5e. Summary

- AC-1 (timeout): Pass. Ánh xạ lỗi, cấu hình bằng biến môi trường, và lời gọi treo thật bị ngắt.
- AC-2 (retry có giới hạn cho lỗi nhất thời): Pass. Từng mã, thứ tự chờ 1s rồi 2s, giới hạn 3 lần.
- AC-3 (lỗi không nhất thời không thử lại): Pass.
- AC-4 (phản hồi rỗng hoặc bị chặn có thông báo rõ): Pass. Cả 3 hãng.
- AC-5 (hãng và khóa luôn khớp nhau): Pass. Gồm ca lỗi cũ và khóa Gemini qua header.
- AC-6 (model cấu hình được): Pass.
- AC-7 (`--mode=auto` kiểm schema trước khi ghi): Pass. `llm.test.js` và `cli.test.js`.

### Lessons Learned

- Hai đoạn code cùng quyết định một việc (chọn khóa và chọn hãng) sẽ lệch nhau theo thời gian; gom thành một hàm trả về cả hai giá trị cùng nhau.
- Khi nhận dữ liệu từ dịch vụ ngoài, tách rõ lỗi nhất thời (thử lại có giới hạn) khỏi lỗi vĩnh viễn (dừng ngay), và đặt hàm chờ có thể thay trong test để test không phải chờ thật.
- Heredoc dài chứa ký tự đặc biệt có thể làm shell không parse được; dùng công cụ ghi file cho các file dài.
