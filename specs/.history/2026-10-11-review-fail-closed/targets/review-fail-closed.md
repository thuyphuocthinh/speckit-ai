# Spec: Review fail-closed

> **Decisions**:
> **Contracts**:

## Overview

`speckit-ai review` chỉ được báo passed khi toàn bộ thay đổi đã được kiểm tra và kết quả của model hợp lệ. Mọi trường hợp còn lại (diff quá lớn để xem đủ, kết quả sai dạng, kết quả tự mâu thuẫn) đều thất bại với exit 1. `review` và `handoff` cùng dùng một cách thu thập diff, gồm cả file mới chưa track.

## Feature Type

- [ ] Small bugfix (< 30 min) — commit message only, no spec needed
- [ ] Simple UI / Logic feature — basic review
- [x] Feature with API / business logic — + test review
- [ ] Sensitive feature (auth, payment, data export) — + security review
- [ ] Large refactor — + performance review

## User Stories

- Là dev, tôi muốn `review` không bao giờ báo passed khi nó mới xem một phần thay đổi, để cổng review có giá trị.
- Là dev, tôi muốn code mới thêm (file chưa `git add`) cũng được review, vì đó thường là phần quan trọng nhất.
- Là dev, tôi muốn kết quả sai dạng của model bị từ chối rõ ràng, thay vì bị hiểu nhầm thành passed.
- Là dev, tôi muốn `handoff` và `review` nhìn thấy cùng một bộ thay đổi.

## Acceptance Criteria

### AC-1: Kết quả review sai dạng bị từ chối
Given model trả JSON không phải object, hoặc `success` không phải boolean (ví dụ chuỗi `"false"`), hoặc `errors` có mặt nhưng không phải mảng chuỗi
When `reviewCode` xử lý kết quả
Then ném lỗi bắt đầu bằng `AI Review failed: Review response is malformed`, và `speckit-ai review` thoát exit 1 mà không in "REVIEW PASSED".

### AC-2: Kết quả tự mâu thuẫn không được tính là passed
Given model trả `success: true` nhưng `errors` không rỗng
When `reviewCode` xử lý kết quả
Then kết quả trả về có `success: false` và giữ nguyên `errors`. Nếu model trả `success: false` mà không có `errors` thì kết quả có một lỗi mặc định giải thích rằng model từ chối mà không nêu lý do.

### AC-3: Diff dài được chia theo file, không bị cắt
Given diff vượt 15000 ký tự nhưng từng file đều nhỏ hơn giới hạn
When chạy `review`
Then diff được chia thành nhiều phần theo ranh giới file, mỗi phần không quá 15000 ký tự, mỗi phần được gửi cho model một lần; kết quả chung là passed khi và chỉ khi mọi phần passed, và `errors` là phần gộp của mọi phần.

### AC-4: Không bao giờ duyệt trên dữ liệu bị cắt
Given diff của một file đơn lẻ vượt 15000 ký tự
When chạy `review`
Then lệnh dừng exit 1 với thông báo nêu tên file và kích thước, không gọi model cho phần đó. `reviewCode` cũng từ chối (ném lỗi) khi nhận diff dài hơn giới hạn thay vì cắt bớt.

### AC-5: File mới chưa track được review
Given có file mới chưa `git add` (nằm ngoài `.gitignore` và `.git/info/exclude`)
When `review` hoặc `handoff` thu thập diff
Then diff gồm nội dung file đó dạng thêm mới (`diff --git` kèm các dòng `+`), cùng với thay đổi đã stage và chưa stage so với `HEAD`; file nhị phân chỉ xuất hiện một dòng thông báo, không có nội dung.

### AC-6: Lock file không được gửi, và được báo
Given diff có `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `go.sum`, `poetry.lock`, `Pipfile.lock`, `composer.lock`, `Cargo.lock` hoặc `Gemfile.lock`
When chạy `review`
Then các file đó không được gửi cho model và được liệt kê trong cảnh báo "not reviewed"; nếu chỉ có các file đó thay đổi thì báo `No code changes to review` kèm danh sách và exit 1.

### AC-7: handoff dùng cùng nguồn diff và báo khi bị cắt
Given `handoff` chạy khi diff dài hơn 15000 ký tự
When tóm tắt được ghi vào `tasks.md`
Then diff lấy bằng cùng hàm thu thập như `review` (lock file bị bỏ qua), và khối `Handoff Session` có thêm dòng cảnh báo cho biết chỉ 15000 trên tổng số ký tự được tóm tắt.

## Technical Constraints

- Không thêm dependency; dùng `child_process.execSync` như code hiện tại.
- Logic thu thập và chia diff nằm trong một module mới `src/gitdiff.js` (có `tests/gitdiff.test.js`); `reviewer.js` và `handoff.js` chỉ điều phối.
- Hằng số giới hạn 15000 ký tự dùng chung (`MAX_DIFF_CHARS`), không còn con số nằm rải rác.
- Việc kiểm kết quả nằm ở ranh giới nhận dữ liệu của model (`llm.js`), code gọi `reviewCode` chỉ thấy kết quả đã hợp lệ.
- Review tuần tự từng phần (không gọi song song) để tránh vượt giới hạn tốc độ của API.

## Out of Scope

- Chia nhỏ một file đơn lẻ theo hunk.
- Thay đổi prompt của `review` hoặc model/endpoint đang dùng.
- Retry, timeout cho lời gọi API.
- Ghi lại lịch sử các lần review.

## Open Questions

Không còn câu hỏi mở.

## Changelog

<!-- Lines are appended by `speckit-ai done`. Do not edit by hand. -->
