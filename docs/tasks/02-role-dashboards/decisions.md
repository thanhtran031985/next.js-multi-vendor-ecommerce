# Quyết định — 02-role-dashboards

<!-- Mỗi quyết định thêm một mục:
### <ngày> — <tiêu đề>
- Bối cảnh:
- Quyết định:
- Lý do:
- Ảnh hưởng:
-->

### 2026-09-29 — Tên file thiết kế thật
- **Bối cảnh:** task.md ghi `UserDashboard.dc.html`, `VendorDashboard.dc.html`.
- **Quyết định:** dùng `designs/userdashboard.dc.html` và `designs/vendordashboard.dc.html` (chữ thường). `AdminDashboard.dc.html` khớp tên.

### 2026-09-29 — Q1: `/dashboard` hiển thị form hồ sơ dạng chỉ đọc
- **Bối cảnh:** thiết kế khách hàng không phải trang tổng quan mà là form sửa hồ sơ. Lưu hồ sơ là ghi DB, ngoài task.md.
- **Quyết định:**
  - Giữ bố cục form.
  - First/Last Name tách từ `User.name` theo khoảng trắng đầu tiên. Tên chỉ có 1 từ thì Last Name để trống.
  - Email lấy từ DB. Phone để trống (chưa có trường).
  - Hai ô mật khẩu, nút "Update Profile" và nút đổi ảnh bị vô hiệu, có tooltip "Coming soon".
  - Thêm dòng "Member since <ngày tạo>" dưới tên.
- **Lý do:** chủ dự án chọn. Không thêm tính năng ghi DB ngoài phạm vi.
- **Ảnh hưởng:** task sau (hồ sơ khách hàng) chỉ cần bật form và thêm server action.

### 2026-09-29 — Q2: sửa nhỏ `StorefrontHeader` (ngoài phạm vi ban đầu)
- **Bối cảnh:** header từ task 01 cứng "Hello, Guest / Sign in". Thiết kế `/dashboard` là "Hello, <tên> / Dashboard".
- **Quyết định:** `StorefrontHeader` nhận prop `user` tùy chọn.
  - Có `user`: hiện "Hello, <tên>" và link tới `/dashboard`.
  - Không có `user`: giữ nguyên như cũ.
  - Các trang storefront hiện có không truyền prop, nên không đổi.
- **Lý do:** chủ dự án đồng ý, ngày 2026-09-29.
- **Ảnh hưởng:** `components/storefront/StorefrontChrome.tsx` được thêm vào danh sách file được sửa của task này.

### 2026-09-29 — Q3: widget vendor trên dashboard admin
- **Bối cảnh:** task.md yêu cầu số vendor theo trạng thái và 5 vendor mới nhất. Thiết kế admin không có widget này.
- **Quyết định:** thêm một hàng ở đầu section "Stores", gồm 2 thẻ theo đúng kiểu thẻ trong thiết kế:
  - Thẻ trái "Vendors by status": 3 ô kiểu status card (Pending / Approved / Suspended).
  - Thẻ phải "Recent vendor registrations": danh sách kiểu Top Customers, gồm tên cửa hàng, email chủ, StatusBadge, ngày đăng ký. Chỉ xem, không có nút duyệt.
  - Most Popular Stores và Top Selling Stores (empty) ở hàng dưới.
- **Lý do:** chủ dự án chọn.

### 2026-09-29 — Q4: thông tin cửa hàng trên dashboard vendor
- **Bối cảnh:** loader vendor trả về tên cửa hàng, slug, trạng thái, ngày tạo. Thiết kế không có chỗ hiển thị.
- **Quyết định:**
  - Phụ đề dưới "Welcome <tên>" thành "<Store name> · /<slug> · <StatusBadge> · Since <ngày>".
  - Dropdown hồ sơ hiện tên, email đầy đủ và tên cửa hàng.
  - Pill trên topbar giữ email đã che như thiết kế.
- **Lý do:** chủ dự án chọn. Bố cục không đổi.

### 2026-09-29 — Các mặc định khác (báo ở Bước 0, không bị phản đối)
- **Trạng thái:**
  - Bỏ tab "Preview state" của Claude Design.
  - Mỗi dashboard có `loading.tsx` (skeleton) và `error.tsx` (thẻ lỗi + "Try again") theo DESIGN_SYSTEM §10.
  - Loại (B) dùng `EmptyState`.
- **Khung:**
  - `DashboardShell` dùng cho vendor và admin.
  - Khách hàng dùng khung storefront có sẵn + `SidebarNav` biến thể account (`AccountShell`).
- **Icon:**
  - Icon mới đặt trong `components/icons/dashboard.tsx`.
  - Không di chuyển `components/icons.tsx` có sẵn, vì di chuyển sẽ phải sửa import ngoài phạm vi.
- **Nhãn icon rail** (suy ra, thiết kế không có chữ): Home, Products, Orders, Messages, Promotions, Reports, Customers, Settings.
- **Nút không có trang đích:**
  - Vô hiệu, có `aria-disabled` và tooltip "Coming soon".
  - Gồm: Products, Visit store, Withdraw, View All, Fullscreen, Search Menu, Notifications, Messages, tab khoảng thời gian.
- **Setup Guide:** giữ thẻ, ghi "Coming soon" thay cho %, thanh tiến độ để trống.
- **Responsive:** không thiết kế nào có bản mobile.
  - Dưới `md`: sidebar (và rail) thành drawer, mở bằng nút menu.
  - Từ `md` trở lên: nút trên topbar thu gọn/mở sidebar như thiết kế.

### 2026-09-29 — Bước 1: chi tiết khung và menu người dùng
- **Dropdown admin có header tên + email.** Thiết kế admin không có header này (vendor thì có). Thêm vào để đạt yêu cầu "UserMenu (tên, email, đăng xuất)" của task.md. Pill admin vẫn giống thiết kế: tên + "Master Admin".
- **Mục chưa có trang:**
  - Mục menu: `opacity-50`.
  - Nút topbar: `opacity-60`.
  - Dùng `aria-disabled` + `title="Coming soon"`, không dùng thuộc tính `disabled`, để tooltip vẫn hiện khi hover.
  - Mục menu chưa có trang là `<span role="link">`, không phải `<a>`.
- **Chưa có số liệu:** `StatCard` với `value = null` hiện "—" (màu `muted-soft`) kèm "No data yet" cho trình đọc màn hình. Không hiện 0, vì 0 cũng là một con số khẳng định.
- **Breadcrumb "Home"** trỏ về `/`, theo thiết kế vendor (`Home.dc.html`).
- **Script HTTP của Bước 5** (`scripts/verify-dashboards.ts`) được viết từ Bước 1 để kiểm tra shell. Script nằm trong `scripts/` giống `verify-auth.ts`.
