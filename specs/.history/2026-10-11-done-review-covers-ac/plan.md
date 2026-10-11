# Plan: done-review-covers-ac

## Approach

Thêm một kiểm tra vào `checkWork` trong `src/done.js`: với mỗi target, rút các khối `### AC-n:` (`extractAcBlocks`) và xác định AC cần review: mọi AC nếu là feature mới; nếu sửa feature có sẵn thì chỉ AC mới hoặc có nội dung khác với `specs/features/<slug>/spec.md` hiện tại (so sau khi chuẩn hóa CRLF và khoảng trắng đầu/cuối). Nếu việc không phải baseline và `review.md` có nội dung, mỗi AC cần review phải xuất hiện trong `review.md` bằng regex có ranh giới từ (`AC-n`, không phân biệt hoa thường, nên `AC-1` không khớp `AC-10`). Thiếu thì thêm lỗi `review-ac` (bỏ qua được bằng `--force`) liệt kê các `AC-n` còn thiếu.

Lý do chỉ bắt AC mới hoặc đã đổi: việc `--affects` copy cả spec cũ vào `targets/`; bắt nhắc mọi AC sẽ buộc người review liệt kê cả những tiêu chí không đụng tới.

Phương án đã loại: bắt `review.md` có dòng Pass/Fail theo từng AC (quá cứng, khó kiểm deterministic); chỉ ghi vào skill mà không có cổng (agent có thể bỏ qua, đúng vấn đề cần sửa); bắt nhắc mọi AC của target (nhiễu, xem trên).

## New files

Không có.

## Modified files

- `src/done.js`: gom AC id, thêm cổng `review-ac`.
- `tests/done.test.js`: cập nhật `VALID_REVIEW` và các fixture review.md cho đủ AC-1; thêm test cổng mới.
- `tests/cli.test.js`: hai fixture `review.md` nhắc `AC-1`.
- `templates/_core/specs-workflow.md.tmpl` và `specs/_workflow.md` (giống hệt nhau): mục Gates.
- `templates/_skills/spec-review/SKILL.md` và `.agents/skills/spec-review/SKILL.md` (giống hệt nhau): bước 5e dặn nhắc từng `AC-n`.
- `docs/tutorials/01-GREENFIELD_WORKFLOW.md`, `docs/tutorials/05-CLI_REFERENCE.md`: bảng cổng của `done`.
- `tests/scaffolder.test.js`: kiểm template workflow và skill được scaffold nói về yêu cầu này.

## Dependencies

Không có.

## Risks & Mitigations

- Dự án đang dùng `review.md` cũ không nhắc `AC-n` sẽ bị chặn khi `done`: thông báo nói rõ cần thêm gì, và `--force` vẫn dùng được (ghi vào Changelog).
- Cổng chỉ chứng minh AC được nhắc tới, không chứng minh được đánh giá đúng: chấp nhận được, mục tiêu là chặn bỏ sót; ghi rõ trong spec.
- Hai repo copy (`specs/_workflow.md`, `.agents/skills/spec-review/SKILL.md`) phải giống template: kiểm bằng `diff` sau khi sửa.
