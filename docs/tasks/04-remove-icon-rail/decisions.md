# Quyết định — 04-remove-icon-rail

<!-- Mỗi quyết định thêm một mục:
### <ngày> — <tiêu đề>
- Bối cảnh:
- Quyết định:
- Lý do:
- Ảnh hưởng:
-->

### 2026-09-30 — Bước 0/1: phương án chốt
- **P1-b:** `ShellNav.rail` thành tùy chọn và `adminNav` bỏ `rail` (tránh dữ liệu chết); `vendorNav` giữ nguyên.
- **P2:** logo ở hàng riêng phía trên "Home", `Link` tới `/admin/dashboard`.
- **P3:** không cần đệm thêm: logo căn trái, nút X đóng drawer căn phải.
- **Cơ chế:** prop `showIconRail` (mặc định `true`) của `DashboardShell`; không ẩn bằng CSS theo đường dẫn.
- **Lý do:** các phương án này là đề xuất ở Bước 0; chủ dự án trả lời "continue" mà không chọn khác.
- **Không cần phương án điều hướng thay thế:** không mục admin nào phụ thuộc thanh icon (chỉ Home là link, trùng "Dashboard").
- **Sửa ngoài danh sách phạm vi:** `scripts/verify-dashboards.ts` (thêm 3 ca kiểm tra rail).
