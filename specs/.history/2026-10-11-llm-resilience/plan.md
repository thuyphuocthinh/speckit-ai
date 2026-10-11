# Plan: llm-resilience

## Approach

Trong `src/llm.js`: (1) bảng `PROVIDERS` mô tả từng hãng (nhãn, tên biến khóa, tên biến model, model mặc định) và `resolveProvider()` chọn hãng rồi lấy đúng khóa, dùng chung cho `generateDocs`, `generateHandoffSummary`, `reviewCode`; (2) `requestWithRetry()` bọc `fetch` với `AbortSignal.timeout`, phân loại lỗi thành nhất thời (thử lại) hoặc không (dừng ngay), và đọc JSON an toàn; (3) `callAI` dùng hai hàm trên rồi trích câu trả lời bằng `?.` và báo lỗi rõ khi rỗng; (4) `normalizeGeneratedDocs()` kiểm schema kết quả của `--mode=auto`. `init.js` chỉ sửa câu thông báo khi dừng.

Phương án đã loại: thư viện retry bên ngoài (thêm dependency chỉ cho vài chục dòng); retry vô hạn hoặc theo `Retry-After` không giới hạn (đúng anti-pattern); đọc model từ `.speckitrc` (thêm bề mặt cấu hình, để sau).

## New files

Không có.

## Modified files

- `src/llm.js`: lớp gọi API chung, chọn hãng, model cấu hình, kiểm schema `generateDocs`.
- `src/init.js`: thông báo khi `--mode=auto` thất bại.
- `tests/llm.test.js`: test cho AC-1 đến AC-7; cập nhật mock `fetch` có `ok` và `status`.
- `docs/tutorials/05-CLI_REFERENCE.md`: biến môi trường, hành vi retry và timeout.

## Dependencies

Không có.

## Risks & Mitigations

- Đổi model mặc định của Claude từ `claude-3-5-sonnet-20240620` sang `claude-sonnet-5-5`: model cũ có thể đã bị gỡ; có biến `SPECKIT_ANTHROPIC_MODEL` để đổi lại. Model mặc định của Gemini và OpenAI giữ nguyên vì không kiểm chứng được với API thật (không có khóa trong môi trường phát triển); người dùng đổi bằng biến môi trường nếu cần.
- Thời gian chờ tối đa tăng (3 lần thử x 60 giây): chấp nhận được, đổi bằng `SPECKIT_LLM_TIMEOUT_MS`.
- Mock `fetch` cũ trong test không có `ok`: cập nhật mock thay vì nới lỏng code.
