# Delta Specs: Create Comprehensive Tutorials

## 1. Cấu trúc thư mục mới
Tạo thư mục `docs/tutorials/` chứa các file:
- `docs/tutorials/01-GREENFIELD_WORKFLOW.md`: Hướng dẫn tạo tính năng mới tinh (generate, propose, archive).
- `docs/tutorials/02-BROWNFIELD_WORKFLOW.md`: Hướng dẫn sửa tính năng cũ (dùng `propose --target`, sửa `spec-draft.md`, rồi `archive`).
- `docs/tutorials/03-STRICT_TRACEABILITY.md`: Hướng dẫn set cờ `--init-hook` và config `.speckit-ai.json` để block commit nếu không có UC-ID.

## 2. Cập nhật README.md
- Rút gọn các phần giải thích dài dòng về Workflow.
- Thêm một mục "📚 Tutorials & Use Cases" trỏ link tới 3 file trên.
