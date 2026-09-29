# Quyết định — 02-role-dashboards

<!-- Mỗi quyết định thêm một mục:
### <ngày> — <tiêu đề>
- Bối cảnh:
- Quyết định:
- Lý do:
- Ảnh hưởng:
-->

### 2026-09-29 — Tổng kết: khác biệt so với `task.md` gốc
Task hoàn thành. Chủ dự án đã test thủ công ("test ok"). Chi tiết ở các mục bên dưới.

**Theo thiết kế, được chủ dự án chốt (Q1–Q4):**
- `/dashboard` là form hồ sơ **chỉ đọc**. Thiết kế không có widget tổng quan; lưu hồ sơ là task sau.
- `StorefrontHeader` nhận prop `user`: sửa nhỏ ngoài phạm vi, để hiện "Hello, <tên> / Dashboard".
- Widget vendor của admin (theo trạng thái + 5 đăng ký mới nhất) nằm ở hàng đầu nhóm "Stores".
- Thông tin cửa hàng của vendor nằm ở phụ đề + dropdown hồ sơ.

**Khác cách mô tả trong `task.md`, đã chấp nhận:**
- **Layout khách hàng dùng `AccountShell`, không phải `DashboardShell`.** Khách hàng không có dropdown `UserMenu`: tên/email và Sign out nằm ở sidebar, theo DESIGN_SYSTEM §9.
- **`SidebarNav` là client component**, chỉ để đọc `usePathname`.
- **Icon mới nằm trong `components/icons/dashboard.tsx`.** `components/icons.tsx` có sẵn được giữ nguyên và dùng lại.
- **Thêm file ngoài danh sách phạm vi:**
  - `loading.tsx` + `error.tsx` cho 3 dashboard (DESIGN_SYSTEM §10).
  - `scripts/verify-dashboards.ts` (script HTTP của Bước 5).
  - `data-stat`/`data-store` để so số liệu với SQL.
- **Lệch nhỏ so với thiết kế:**
  - Bỏ tab "Preview state".
  - Setup Guide ghi "Coming soon" thay cho %.
  - Ô Phone không có "+1".
  - Dropdown admin có header tên/email.
  - Tooltip icon rail là "<Tên> — Coming soon".

**Sửa sau rà soát (/finish-task):**
1. Loader có `import "server-only"`.
2. Drawer mobile khi đóng ẩn hẳn khỏi bàn phím và trình đọc màn hình; khi mở/đóng, focus được chuyển đúng chỗ.
3. `UserMenu` điều hướng được bằng bàn phím (mẫu menu button WAI-ARIA).

**Không sửa:** ngày hiển thị theo UTC (mục 4). Lý do ở mục riêng bên dưới.

**Để lại cho task sau:**
- Toàn bộ widget loại (B): bảng "Danh sách widget loại (B)".
- Chọn thư viện biểu đồ.
- Múi giờ chung của sàn.

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

### 2026-09-29 — Bước 2: ô Phone không có mã vùng "+1"
- **Bối cảnh:** thiết kế có ô chọn mã vùng "+1" trước số điện thoại. Đây là dữ liệu demo, và `User` chưa có trường phone.
- **Quyết định:** ô Phone chỉ là input trống với placeholder "Not added yet", không có ô mã vùng.
- **Ảnh hưởng:** task hồ sơ khách hàng sẽ thêm lại ô mã vùng khi có trường `phone`.

### 2026-09-29 — Bước 3: dashboard người bán
- **Phụ đề:** thông tin cửa hàng (Q4) **thay** câu "Monitor your business analytics and statistics." của thiết kế, không thêm dòng mới. Như vậy bố cục phần tiêu đề không đổi.
- **Widget danh sách/lưới:** đã có phần render dữ liệu thật, theo đúng kiểu của thiết kế. Loader trả mảng rỗng thì hiện empty state. Task sau chỉ cần sửa loader, không phải sửa page.
- **Biểu đồ:** `ChartFrame` giữ nguyên khung 300px và chú thích, luôn hiện empty state. Task nào mang dữ liệu doanh thu về sẽ chọn thư viện biểu đồ (thiết kế dùng Chart.js 4 qua CDN; ở đây chưa cài).
- **Nút và bộ chọn chưa có chức năng:** "Overall Statistics", "Products", "Withdraw" bị vô hiệu, có tooltip "Coming soon".

### 2026-09-29 — Bước 4: dashboard admin
- **Cách tính số:**
  - "Total Stores" = số dòng `Vendor` ở mọi trạng thái. Phần chia theo trạng thái nằm ở "Vendors by Status".
  - "Total Vendor" trong User Overview = số user role VENDOR.
- **User Overview:** chưa có thư viện biểu đồ, nên khung donut (230px) hiện "Chart coming soon". Số thật nằm trong chú thích bên dưới.
- **Q3:** tên hai thẻ vendor mới là "Vendors by Status" và "Recent Vendor Registrations". Thẻ "Recent Vendor Registrations" có "View All" vô hiệu (trang danh sách vendor là task sau).
- **Pill admin** giữ nhãn "Master Admin" của thiết kế: đây là nhãn vai trò, không phải số liệu.
- **Thuộc tính `data-stat` / `data-store`:** thêm trên số liệu và danh sách của dashboard admin để `scripts/verify-dashboards.ts` so với SQL. Không ảnh hưởng giao diện.

### 2026-09-29 — Danh sách widget loại (B) và task sẽ lấp dữ liệu
Loader đã có trường và kiểu dữ liệu (`lib/dashboard/types.ts`), hiện trả giá trị rỗng kèm `// TODO(<task>)`. Page đã có phần hiển thị dữ liệu, nên task sau chỉ cần sửa loader. Tên task dưới đây là đề xuất.

| Dashboard | Widget | Trường trong loader | Task tương lai |
|---|---|---|---|
| Khách hàng | Số điện thoại (form hồ sơ) | `profile.phone` | `customer-profile` (thêm `User.phone`, bật form, lưu hồ sơ, đổi mật khẩu, ảnh) |
| Khách hàng | Badge menu My Orders / Wish List / Inbox | (chưa có trường; ẩn) | `orders`, `wishlist`, `messages` |
| Vendor | Business Analytics: 8 trạng thái đơn hàng | `orderStatusCounts` | `orders` |
| Vendor | Vendor Wallet (số dư, rút tiền, thuế, hoa hồng, phí giao, tiền mặt) | `wallet` | `payouts` |
| Vendor | Earning Statistics (biểu đồ) | `earnings` | `orders` + chọn thư viện biểu đồ |
| Vendor | Most Rated Products | `mostRatedProducts` | `products` + `reviews` |
| Vendor | Top Selling Products | `topSellingProducts` | `products` + `orders` |
| Vendor | Top Delivery Man | `topDeliveryMen` | `delivery` |
| Vendor/Admin | Setup Guide (% hoàn thành) | (chưa có trường) | `onboarding` |
| Vendor/Admin | Badge Notifications / Messages | (chưa có trường) | `notifications`, `messages` |
| Admin | Total Order, Total Products | `totals.orders`, `totals.products` | `orders`, `products` |
| Admin | 8 trạng thái đơn hàng | `orderStatusCounts` | `orders` |
| Admin | Admin Wallet | `wallet` | `payouts` |
| Admin | Order Statistics (biểu đồ) | `orderStatistics` | `orders` + thư viện biểu đồ |
| Admin | User Overview: donut + "Total Delivery Man" | `userOverview.deliveryMen` (donut: thư viện biểu đồ) | `delivery` + thư viện biểu đồ |
| Admin | Earning Statistics (biểu đồ) | `earnings` | `orders` + `payouts` + thư viện biểu đồ |
| Admin | Top Customers | `topCustomers` | `orders` |
| Admin | Top Delivery Man | `topDeliveryMen` | `delivery` |
| Admin | Most Popular Stores | `popularStores` | `store-follows` |
| Admin | Top Selling Stores | `topSellingStores` | `orders` |
| Admin | Inhouse / Vendor Products: Most Rated, Top Selling | `inhouseMostRated`, `inhouseTopSelling`, `vendorMostRated`, `vendorTopSelling` | `products` + `reviews` + `orders` |

**Thư viện biểu đồ:** chưa cài. Thiết kế dùng Chart.js 4 (CDN). Task đầu tiên mang dữ liệu biểu đồ về sẽ chọn thư viện (hỏi chủ dự án trước khi cài). Khi đó chỉ cần thay phần empty state trong `components/dashboard/ChartFrame.tsx`.

### 2026-09-29 — Bước 5: sửa sau khi rà lại
- `AccountFrame`: thêm `md:bottom-auto` cho sidebar tài khoản. Lớp `inset-y-0` của drawer mobile làm `sticky` trên desktop có thêm `bottom:0`.
- `SidebarNav`: tooltip icon rail bị vô hiệu thành "<Tên> — Coming soon".

### 2026-09-29 — Rà soát (/finish-task): khác biệt với task.md chưa được ghi rõ
- **Bước 1, "gắn `DashboardShell` vào 3 layout":**
  - Layout vendor và admin dùng `DashboardShell`.
  - Layout khách hàng dùng `AccountShell`: khung storefront + sidebar tài khoản, theo DESIGN_SYSTEM §9 và thiết kế `userdashboard`, vốn không có rail/topbar.
- **"`UserMenu` (tên, email, đăng xuất)":**
  - Vendor/admin dùng dropdown `UserMenu`.
  - Khách hàng không có dropdown (thiết kế không có). Tên và email nằm ở thẻ đầu sidebar, "Sign out" ở cuối sidebar, pill "Hello, <tên> / Dashboard" trên header dẫn tới `/dashboard`.
  - Cả hai cách dùng chung `SignOutItem`, tức `signOutAction` của task 01.
- **`SidebarNav` là client component:**
  - Lý do duy nhất là dùng `usePathname` để tô mục đang mở. Layout không nhận được path hiện tại, còn truyền path từ từng page thì phải sửa mọi page con về sau.
  - Phần tương tác thật (drawer, thu gọn, dropdown) vẫn nằm trong `ShellFrame`, `AccountFrame`, `UserMenu`.

### 2026-09-29 — Rà soát, mục 4: ngày hiển thị theo UTC — KHÔNG SỬA
- **Bối cảnh:**
  - `formatDate` (`lib/dashboard/format.ts`) định dạng theo `timeZone: "UTC"`. Hàm này dùng cho "Member since", "Since" (vendor) và ngày trong "Recent Vendor Registrations".
  - Người dùng ở UTC+7 có tài khoản tạo lúc 00:00–07:00 giờ Việt Nam sẽ thấy ngày lùi 1.
- **Quyết định:** giữ UTC. Chủ dự án chọn phương án (d) ngày 2026-09-29.
- **Lý do:**
  - Ở đây chỉ hiển thị ngày (không có giờ), sai số tối đa 1 ngày, và chỉ để xem.
  - UTC cho kết quả giống nhau ở server và trình duyệt, không gây lệch hydration.
  - Chưa có quyết định chung về múi giờ của sàn. Khi có đơn hàng thì cần giờ chính xác, và task đó sẽ quyết định múi giờ cho toàn app.
- **Ảnh hưởng:**
  - Ngày trên dashboard là ngày theo UTC.
  - Checklist thủ công: khi so ngày với SQL, dùng giá trị `createdAt` trong DB (Prisma lưu UTC).
