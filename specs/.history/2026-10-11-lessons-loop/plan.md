# Plan: lessons-loop

## Approach

`done` đã đọc `review.md` và biết danh sách target, nên chỉ cần thêm một bước "chuẩn bị rồi ghi": `extractLessons` lấy phần dưới heading "Lessons Learned" (cấp 2 đến 4) của `review.md`, `appendLessons` thêm một mục `## <ngày> · <tên việc>` vào `specs/features/<slug>/lessons.md` của từng target (tạo file kèm tiêu đề nếu chưa có, giữ kiểu xuống dòng của file có sẵn). Nội dung được chuẩn bị trước khi ghi nên nguyên tắc "kiểm xong mới ghi" vẫn đúng. `start --affects` chỉ in đường dẫn `lessons.md` của feature bị ảnh hưởng nếu file đó tồn tại, để agent biết đọc.

Bài học nằm theo feature, không phải một file chung, để agent chỉ đọc phần liên quan tới việc đang làm (không làm phình context). Quyết định đọc hay không vẫn do agent, nhưng được nhắc bằng đường dẫn cụ thể ở `start`, `_workflow.md`, các skill và `AGENTS.md`.

Phương án đã loại: một `specs/lessons.md` chung (lớn dần, mọi việc đều phải đọc); để bài học trong `.history/` và bỏ cấm đọc (agent sẽ đọc cả file làm việc cũ, đúng điều quy tắc muốn tránh); biến thiếu bài học thành cổng chặn `done` (thêm ma sát không cần thiết).

## New files

Không có (mã nguồn); `lessons.md` là file do `done` sinh ra trong project của người dùng.

## Modified files

- `src/done.js`: `extractLessons`, `appendLessons`, ghi `lessons.md`, in đường dẫn, trả `lessons` trong kết quả.
- `src/lifecycle.js`: `startWork` in nhắc nhở cho feature bị ảnh hưởng có `lessons.md`.
- `templates/_core/specs-workflow.md.tmpl` và `specs/_workflow.md` (giống hệt nhau): cây thư mục, bước 5e, Rules, bảng lệnh.
- `templates/_skills/spec-create|spec-plan|spec-review/SKILL.md` và bản trong `.agents/skills/` (giống hệt nhau).
- `templates/_core/AGENTS.md.tmpl`: một dòng nhắc đọc `lessons.md`.
- `docs/tutorials/01-GREENFIELD_WORKFLOW.md`, `docs/tutorials/05-CLI_REFERENCE.md`, `docs/core-principles-and-coding-standards/structure.md`, `README.md`.
- `tests/done.test.js`, `tests/lifecycle.test.js`, `tests/linter.test.js`, `tests/scaffolder.test.js`.

## Dependencies

Không có.

## Risks & Mitigations

- `review.md` cũ không có heading "Lessons Learned" thì `done` không ghi gì: hành vi cũ giữ nguyên, không lỗi.
- `lessons.md` dài dần theo thời gian: để ngoài phạm vi (ghi trong spec); người dùng có thể tự dọn vì đó là file thường.
- Heading "Lessons Learned" nằm trong code block có thể bị nhận nhầm hoặc làm cắt sớm: `extractLessons` bỏ qua dòng `#` bên trong code block khi tìm điểm kết thúc.
- Hai bản sao của repo (`specs/_workflow.md`, `.agents/skills/*`) phải giống template: kiểm bằng `diff -q`.
