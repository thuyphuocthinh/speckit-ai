# Review: agents-tiered-reading

Feature Type: Simple UI / Logic feature (code review).

## 5a. Code Review

- Chỉ đổi một template (`templates/_core/AGENTS.md.tmpl`); mọi framework và cả `--mode=existing` dùng chung template này nên không cần sửa riêng.
- Các dòng khác của AGENTS.md (Operation Rules, Important Notes, Cross-tool) giữ nguyên. Không đổi `docs/README.md` template vì nó đã có tầng "When needed".
- Điều kiện của mỗi file được viết theo việc cụ thể (tạo/di chuyển/đổi tên file, viết hoặc sửa logic, format hoặc đụng lint, task lặp lại) và khớp với bảng của `docs/README.md`, được test đối chiếu.
- Không đổi mã nguồn trong `src/`; không có `eslint-disable`, không cast kiểu, không thêm dependency.
- Điểm cần theo dõi (không chặn): project đã scaffold trước đó giữ `AGENTS.md` bản cũ vì đó là file của người dùng và `upgrade` không sửa nó (đã ghi trong spec). `.agents/AGENTS.md` của chính repo này cũng chưa đổi (Out of Scope).

## 5e. Summary

- AC-1 (AGENTS.md chia tầng luôn đọc và đọc khi cần): Pass. `scaffolder.test.js` kiểm nestjs, generic, python-django (mode new) và vue (mode existing): ba file luôn đọc, bốn mục đọc khi cần kèm điều kiện, và không lẫn tầng.
- AC-2 (không còn bắt đọc hết mọi file cho mọi task): Pass. Test kiểm câu cũ "Read in this order before starting any task" đã biến mất và không còn danh sách đánh số 4 đến 6 ở tầng luôn đọc.
- AC-3 (AGENTS.md và docs/README.md nhất quán): Pass. Test so từng file giữa hai nơi: luôn đọc ở cả hai, hoặc đọc khi cần ở cả hai.

`npm test`: 19 suite, đều pass.

### Lessons Learned

- Khi hai file cùng nói về một luật (reading order ở AGENTS.md và docs/README.md), thêm một test đối chiếu giữa chúng để không lệch nhau về sau.
