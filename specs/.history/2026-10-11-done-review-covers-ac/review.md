# Review: done-review-covers-ac

Feature Type: Feature with API / business logic (code review + test review). Work này sửa spec `sdd-single-spine` (AC-7) và thêm AC-20; các AC khác của spec đó không đổi.

## 5a. Code Review

- Logic mới gói trong `checkWork` và hàm thuần `extractAcBlocks`; không đụng tới `finishWork` ngoài việc lỗi mới đi qua đường `forceable` sẵn có (`--force` ghi `forced: review-ac` vào Changelog mà không cần code thêm).
- Không có `eslint-disable`, không cast kiểu, không thêm dependency.
- Regex `\bAC-n\b` được dựng từ số nguyên đã `Number()`, nên không có đầu vào tùy ý đi vào `RegExp`.
- Đã quyết định thiết kế khác với bản nháp đầu: chỉ bắt AC mới hoặc đã đổi (so với spec hiện có). Lý do: work `--affects` copy cả spec cũ, bắt nhắc mọi AC là nhiễu. Spec, plan, tài liệu và test đã cập nhật theo.
- Hai bản sao của repo (`specs/_workflow.md`, `.agents/skills/spec-review/SKILL.md`) được `diff -q` với template và giống hệt.
- Điểm cần theo dõi (không chặn): cổng chỉ chứng minh AC được nhắc tới, một review chỉ ghi "AC-1" vẫn qua; chủ ý (xem spec) vì Pass/Fail không kiểm deterministic được.

## 5b. Test Review

- `done.test.js`: thiếu AC (đúng danh sách, đúng thứ tự số), đủ AC, `AC-1` không thỏa bởi `AC-10` và không phân biệt hoa thường, nhiều target, review thiếu/rỗng (không báo trùng), không có AC (không báo trùng), baseline không bị kiểm, `--force` ghi `forced: review-ac`, không `--force` thì không ghi gì, sửa feature có sẵn (chỉ AC mới/đổi bị bắt, AC không đổi thì không), đổi mô tả mà không đổi AC, khác biệt CRLF không bị coi là đổi.
- `cli.test.js`: hai fixture review.md nhắc `AC-1`. `scaffolder.test.js`: template workflow và skill được scaffold có yêu cầu mới.
- `npm test`: 19 suite, 313 test đều pass.

## 5e. Summary

- AC-7 (done kiểm tra chặt trước khi ghi, nay gồm cả cổng review.md nhắc tới các AC): Pass. Các cổng cũ vẫn được `done.test.js` kiểm; cổng mới được kiểm ở phần AC-20.
- AC-20 (review.md đối chiếu các AC mới hoặc đã đổi): Pass. Toàn bộ test nêu ở 5b.

### Lessons Learned

- Khi một cổng kiểm tra chạy trên bản copy toàn bộ spec (`--affects`), phải tính tới việc phần không đổi sẽ gây nhiễu; so với bản gốc để chỉ bắt phần thay đổi.
- Edit nhiều dòng trên file CRLF (spec copy từ `specs/features/`) không khớp với công cụ sửa file; dùng một script nhỏ giữ nguyên kiểu xuống dòng.
