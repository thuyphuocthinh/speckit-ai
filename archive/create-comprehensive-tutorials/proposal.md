# Proposal: Create Comprehensive Tutorials

## 1. Vấn đề
Hiện tại file `README.md` đang làm nhiệm vụ "ôm đồm" quá nhiều: vừa giới thiệu tính năng, vừa hướng dẫn cài đặt, vừa giải thích các Workflow phức tạp như OpenSpec, Brownfield, Git Hooks. Điều này làm README quá dài và khó đọc, user mới dễ bị ngợp.

## 2. Giải pháp
Chuyển toàn bộ các hướng dẫn chi tiết (Use Cases) ra thành các file tài liệu độc lập nằm trong thư mục `docs/tutorials/`. 
File `README.md` sẽ chỉ giữ lại tính năng cốt lõi và gắn link (tham chiếu) tới các bài tutorial này.
Điều này giúp source code giống hệt chuẩn tài liệu trên Github (có thể setup Github Pages sau này).
