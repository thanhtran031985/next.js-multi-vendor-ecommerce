Tạo dashboard tiến độ task cho dự án. KHÔNG sửa code ứng dụng.

## Nguyên tắc
- Nguồn dữ liệu DUY NHẤT: docs/tasks/README.md (danh sách task, trạng thái,
  phụ thuộc, nhánh) và docs/tasks/NN-slug/progress.md (bảng các bước).
- Dashboard là file SINH RA từ các file trên, không nhập tay dữ liệu vào HTML.
- Không cài thêm package. Dùng Node thuần.

## 1. Script sinh dashboard
- Tạo scripts/tasks-dashboard.mjs:
  - Đọc bảng trong docs/tasks/README.md.
  - Với mỗi thư mục docs/tasks/NN-slug/ (bỏ qua _template), đọc bảng trong
    progress.md và dòng "Trạng thái chung".
  - Ghi ra docs/tasks/dashboard.html.
- Thêm vào package.json: "tasks:dashboard": "node scripts/tasks-dashboard.mjs".
- Chịu lỗi tốt: thiếu progress.md → hiện "chưa có tiến độ"; bảng sai định dạng
  → cảnh báo trên trang + console, KHÔNG dừng script.
- Nhận các trạng thái: ⬜ chưa làm · 🔄 đang làm · ❓ có code chưa rà soát ·
  ⚠️ khác task.md · ❌ thiếu · ✅ xong. Ký hiệu lạ → màu xám.

## 2. Giao diện dashboard.html
- Đọc .claude/skills/architecture-diagram/SKILL.md và resources/template.html,
  dùng đúng phong cách đó: nền tối, JetBrains Mono, bảng màu, nút Copy/PNG/PDF.
- File tự chứa, mở trực tiếp bằng trình duyệt (file://) vẫn chạy. Dữ liệu nhúng
  sẵn trong HTML, không dùng fetch.
- Nội dung:
  a. Header: tên dự án (Covet), thời điểm sinh file, số liệu tổng: tổng số task,
     số ✅/🔄/⬜, % bước đã xong trên toàn dự án.
  b. Sơ đồ SVG phụ thuộc: mỗi task một ô (số, tên, "x/y bước"), màu theo trạng
     thái, mũi tên theo cột "Phụ thuộc" trong README. Vị trí TỰ TÍNH theo cấp
     phụ thuộc (task không phụ thuộc ở cột đầu), không dùng tọa độ cố định.
  c. Thẻ cho từng task: tên, nhánh git, thanh tiến độ, danh sách bước kèm
     biểu tượng trạng thái và ghi chú, link tương đối tới task.md và
     progress.md.
  d. Chú thích màu/trạng thái.
- Tự co giãn trên màn hình hẹp; sơ đồ rộng thì cuộn ngang trong khung riêng.

## 3. Cập nhật CLAUDE.md
- Mục "Sau MỖI bước": thêm "chạy npm run tasks:dashboard sau khi cập nhật
  progress.md".
- Mục "Khi tôi yêu cầu tạo task mới": thêm bước cuối "chạy npm run
  tasks:dashboard".
- Mục cấu trúc task: thêm dòng dashboard.html (file sinh ra, không sửa tay).
- Bổ sung danh sách ký hiệu trạng thái ở trên vào CLAUDE.md.

## 4. Kiểm tra
- Chạy npm run tasks:dashboard, in tóm tắt: số task đọc được, số bước mỗi task,
  cảnh báo (nếu có).
- Thử tạm một progress.md sai định dạng để xác nhận script không dừng, rồi hoàn
  tác.
- Đề xuất commit message "chore: add task progress dashboard". Chỉ commit khi
  tôi đồng ý.

Lập kế hoạch trước, DỪNG chờ tôi duyệt rồi mới làm.