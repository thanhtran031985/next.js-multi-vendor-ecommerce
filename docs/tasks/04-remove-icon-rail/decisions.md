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

### 2026-09-30 — Logo admin: chữ "Covet." thay vì icon giỏ hàng
- **Bối cảnh:** task.md ghi giữ nguyên logo (icon giỏ hàng trong ô tím) khi chuyển lên cột trắng. Chủ dự án muốn thay bằng chữ
  logo để nhìn ra ngay đó là logo.
- **Quyết định:** ở cột trắng của admin dùng `Wordmark` có sẵn (`components/Wordmark.tsx`, "Covet." Sora 800, dấu chấm màu iris,
  cỡ `text-27` như header storefront), bọc `Link` tới `/admin/dashboard`. Logo của vendor (trong thanh icon) không đổi.
- **Ảnh hưởng:** khác task.md ở điểm "giữ kích thước và token màu hiện tại" (chủ dự án yêu cầu). Ghi chú ở
  `DashboardShell.tsx` cập nhật theo.

### 2026-09-30 — Rà soát /finish-task
- Không có mục ❌. Hai khác biệt (⚠️) đã có quyết định: logo là chữ "Covet." theo yêu cầu chủ dự án; `verify-dashboards.ts` sửa ngoài
  danh sách phạm vi để khóa hành vi rail.

### 2026-09-30 — Sửa sau rà soát và tổng kết: khác với task.md gốc
- **Sửa:** `DashboardShell` ném lỗi khi `showIconRail` bật mà thiếu `nav.rail`.
- **Khác task.md:** (1) logo admin là chữ "Covet." (`Wordmark`) theo yêu cầu chủ dự án, không giữ icon giỏ hàng; (2) chọn P1-b/P2/P3 theo
  đề xuất Bước 0 khi chủ dự án trả lời "continue"; (3) sửa `scripts/verify-dashboards.ts` (ngoài danh sách phạm vi); (4) task 02 có thêm mục
  "Lệch thiết kế có chủ đích".
- **Chưa xác nhận:** checklist thủ công về giao diện, đóng task theo yêu cầu chủ dự án.
