# Tiến độ — 02-role-dashboards

Trạng thái chung: 🔄 · Cập nhật lần cuối: 2026-09-29

| Bước | Tên | Trạng thái | Ghi chú |
|------|-----|------------|---------|
| 0 | Kiểm tra (không sửa code) | ✅ | Q1–Q4 đã chốt, xem decisions.md |
| 1 | Thành phần dùng chung | ✅ | tsc/lint/build đạt; kiểm tra HTTP chờ MySQL |
| 2 | Dashboard khách hàng (`/dashboard`) | ⬜ | |
| 3 | Dashboard người bán (`/vendor/dashboard`) | ⬜ | |
| 4 | Dashboard admin (`/admin/dashboard`) | ⬜ | |
| 5 | Kiểm tra tổng | ⬜ | |

## Nhật ký

### Bước 0 — Kiểm tra (2026-09-29)
- Đã làm: đọc `01-auth/decisions.md`, 3 file thiết kế, các page/layout dashboard, guard,
  action đăng xuất, `globals.css`, `DESIGN_SYSTEM.md` §9–§10 và §15, `prisma/schema.prisma`.
  Không sửa code.
- File tạo/sửa: chỉ `progress.md` và `README.md` (trạng thái 🔄).
- Kết quả kiểm tra: xem báo cáo bên dưới.
- Việc tôi cần làm thủ công: trả lời Q1–Q4 ở mục "Câu hỏi mở" (đã trả lời).

#### 1. Ánh xạ route → thiết kế
| Route | Tên trong task.md | File thật |
|---|---|---|
| `/dashboard` | `UserDashboard.dc.html` | `designs/userdashboard.dc.html` (chữ thường) |
| `/vendor/dashboard` | `VendorDashboard.dc.html` | `designs/vendordashboard.dc.html` (chữ thường) |
| `/admin/dashboard` | `AdminDashboard.dc.html` | `designs/AdminDashboard.dc.html` |

Không thiết kế nào có bản mobile. Vendor/admin có nút thu gọn sidebar; khách hàng không có.

Trong cả 3 thiết kế, những thứ sau chỉ là công cụ xem trước của Claude Design, nên bỏ đi:
- Tab "Preview state" (Default/Loading/Empty/Error).
- Dữ liệu demo trong `renderVals()`.
- Chart.js tải từ CDN.

#### 2. Khách hàng — `userdashboard.dc.html`
**Khung** (DESIGN_SYSTEM §9: storefront header/footer + sidebar tài khoản + thẻ nội dung trắng):
- Khung storefront: utility bar, header (search, Wishlist, "Hello, Test / Dashboard", giỏ hàng), mega nav, footer.
- Breadcrumb "Home › My Dashboard".
- Lưới `300px 1fr`:
  - Sidebar tài khoản: avatar, tên, email; 12 mục menu có icon và badge; nút "Sign out" màu đỏ ở cuối.
  - Thẻ nội dung.
- 4 help card (About/Contact/FAQ/Blog) phía trên footer.

**Menu người dùng:** không có dropdown riêng. Có nút "Hello, Test / Dashboard" trên header và "Sign out" trong sidebar.

**Widget:**
| Widget | Kiểu | Loại | Nguồn / ghi chú |
|---|---|---|---|
| Thẻ tài khoản ở sidebar (tên, email) | thẻ | A | `User.name`, `User.email` |
| Badge menu (Orders 8, Wishlist 5, Inbox 3) | badge | B | chưa có model, sẽ ẩn badge |
| Tiêu đề "Profile Info" | tiêu đề | C | |
| Avatar và nút đổi ảnh | ảnh | B | chưa có trường ảnh; giữ avatar mặc định, nút đổi ảnh vô hiệu |
| Form: First/Last Name, Phone, Email, New/Confirm Password, "Update Profile" | form sửa hồ sơ | A (một phần) | name/email có thật; **Phone chưa có trường**; lưu hồ sơ là ghi DB, ngoài phạm vi (xem **Q1**) |
| Trạng thái Empty/Error/Loading của thẻ | trạng thái | C | xem đề xuất về `loading.tsx`/`error.tsx` ở mục 8 |
| Help cards | thẻ link | C | dùng lại `components/storefront/HelpCards.tsx` |

Thiết kế **không có** widget đơn hàng, wishlist hay địa chỉ trên trang này. Các phần đó là mục menu riêng.

**Menu:** chỉ "Profile Info" (`/dashboard`) có trang thật. 11 mục còn lại bị vô hiệu:
| Mục | Thiết kế liên quan (theo tên) |
|---|---|
| My Orders | `Userorder`, `userorderdetails` |
| Restock Requests | — |
| Wish List | `userwishlist` |
| My Wallet | — |
| My Loyalty Point | — |
| Inbox | `Userchat` |
| My Address | `useraddress` |
| Support Ticket | `supportticket` |
| Refer & Earn | — |
| Coupons | — |
| Track Order | `usertrackorder` |

#### 3. Người bán — `vendordashboard.dc.html`
**Khung** (§9):
- Icon rail tối, rộng 64px, 8 icon, không có nhãn chữ.
- Sidebar trắng rộng 236px:
  - Tiêu đề "Home".
  - Nhóm "OVERVIEW" gồm Dashboard và POS.
  - Thẻ "Setup Guide 20% Complete".
- Topbar cao 64px:
  - Bên trái: nút thu gọn sidebar, breadcrumb "Home › Dashboard".
  - Bên phải: các nút Visit store, Notifications (badge 1), Messages (badge 3), Fullscreen, rồi pill hồ sơ.
  - Pill hồ sơ hiển thị tên và email đã che, mở dropdown gồm Profile Setting, Change Password, Logout.
- Nội dung trên nền `--bg-dash`, rộng tối đa 1240px.
- Không có footer.

**Widget:**
| Widget | Kiểu | Loại | Nguồn / ghi chú |
|---|---|---|---|
| "Welcome {tên}" + phụ đề | tiêu đề | A + C | `User.name` |
| Nút "Products" | nút | — | chưa có trang, vô hiệu |
| Pill và dropdown hồ sơ | menu | A | `User.name`, `User.email` (che giống thiết kế: `j****@g**il.com`) |
| Setup Guide (thanh %) | thẻ tiến độ | B | chưa có dữ liệu thiết lập; giữ thẻ, bỏ số % |
| Business Analytics: 8 thẻ trạng thái đơn hàng + bộ chọn "Overall Statistics" | thẻ số liệu | B | model Order |
| Vendor Wallet: số dư + Withdraw, 4 ô tiền | thẻ số liệu | B | model ví/thanh toán |
| Earning Statistics: tab năm/tháng/tuần + chú thích + khung 300px | **biểu đồ** | B | giữ khung, hiện empty state |
| Most Rated Products | danh sách | B | model Product/Review |
| Top Selling Products | lưới | B | model Product/Order |
| Top Delivery Man | lưới | B | model Delivery |
| Badge thông báo/tin nhắn | badge | B | ẩn |

Dữ liệu (A) mà task.md yêu cầu nhưng **thiết kế không có chỗ hiển thị**: tên cửa hàng, slug, trạng thái, ngày tạo. Xem **Q4**.

**Menu:** Dashboard là trang thật. Vô hiệu các mục:
- POS.
- 7 icon rail (trừ Home).
- Visit store, Products.
- Profile Setting, Change Password.

Thiết kế liên quan (theo tên): `VendorProductList`, `VendorAddProduct`, `VendorOrderList`, `VendorOrderReport`, `VendorProductReport`, `VendorTransactionReport`, `VendorCoupon`, `VendorProfile`, `VendorChangePassword`, `VendorProductReview`.

Icon rail không có nhãn trong thiết kế. Nhãn tôi **suy ra** (dùng cho `aria-label` và tooltip):

| Icon | Nhãn |
|---|---|
| home | Home |
| box | Products |
| bag | Orders |
| send | Messages |
| speaker | Promotions |
| chart | Reports |
| users | Customers |
| sliders | Settings |

#### 4. Admin — `AdminDashboard.dc.html`
**Khung:** giống vendor, với các khác biệt sau:
- Topbar có ô "Search Menu...".
- Không có nút Visit store. Notifications có badge 12.
- Pill hồ sơ hiển thị "Admin / Master Admin".
- Dropdown gồm Profile, Settings, Logout.
- Setup Guide ghi 38%.
- Nội dung rộng tối đa 1280px.

**Widget:**
| Widget | Kiểu | Loại | Nguồn / ghi chú |
|---|---|---|---|
| "Welcome Admin" + phụ đề | tiêu đề | A + C | `User.name` |
| Thẻ **Total Stores** | thẻ số liệu | A | `vendor.count()` |
| Thẻ **Total Customers** | thẻ số liệu | A | `user.count({ role: CUSTOMER })` |
| Thẻ Total Order, Total Products | thẻ số liệu | B | model Order/Product |
| 8 thẻ trạng thái đơn hàng | thẻ số liệu | B | model Order |
| Admin Wallet: tổng thu + 4 ô | thẻ số liệu | B | model thanh toán |
| Order Statistics (tab + khung 300px) | biểu đồ | B | giữ khung, empty state |
| User Overview: **donut** + chú thích | biểu đồ | A (chú thích) / B (donut) | chú thích dùng số thật Customer/Vendor; Delivery Man là B; khung donut hiện empty state vì chưa có thư viện biểu đồ |
| Earning Statistics | biểu đồ | B | |
| Top Customers ("Orders: N") | danh sách | B | cần model Order để xếp hạng |
| Top Delivery Man | lưới | B | |
| Most Popular Stores (lượt thích), Top Selling Stores (doanh số) | lưới | B | |
| Inhouse / Vendor Products (Most Rated, Top Selling) | danh sách/lưới | B | |

Dữ liệu (A) task.md yêu cầu nhưng **thiết kế không có widget tương ứng**:
- Số vendor theo trạng thái PENDING/APPROVED/SUSPENDED.
- 5 vendor đăng ký gần nhất.

Xem **Q3**.

**Menu:** Dashboard là trang thật. Vô hiệu các mục:
- POS.
- 7 icon rail.
- Ô Search Menu.
- Profile, Settings.

Thiết kế liên quan (theo tên): `AdminAllOrders`, `AdminProductList`, `AdminProductAdd`, `AdminProductStock`, `AdminVendorList`, `AdminAddVendor`, `AdminVendorProductList`, `AdminCustomerList`, `AdminCustomerReview`, `AdminEarningReport`, `AdminOrderReport`, `AdminProductReport`.

#### 5. Giống và khác giữa 3 thiết kế
**Vendor và admin gần như trùng khung**, gồm:
- Icon rail, sidebar, thẻ Setup Guide.
- Topbar và dropdown hồ sơ.
- Section card: tiêu đề có chip icon 30px, nền trắng, viền `line-soft`, bo 18px.
- Thẻ số liệu và lưới 8 trạng thái đơn hàng.
- Khối Wallet (lưới `300px 1fr 1fr`).
- Khung biểu đồ và tab khoảng thời gian.
- Danh sách sản phẩm.
- Empty state (icon 78px, tiêu đề, mô tả, nút).

Như vậy `DashboardShell`, `SidebarNav`, `UserMenu`, `StatCard`, `SectionCard`, `EmptyState` và khối biểu đồ rỗng đều dùng chung được.

**Khách hàng khác hẳn:** khung storefront, sidebar tài khoản, thẻ nội dung là form hồ sơ. Không có rail, topbar hay biểu đồ. Phần dùng chung được với vendor/admin:
- Cấu hình menu `nav.ts` (hiển thị theo biến thể "account").
- `EmptyState`.
- Nút Sign out.

**Đề xuất:**
- `DashboardShell` dùng cho vendor và admin.
- Khách hàng dùng `AccountShell`: khung storefront có sẵn + `SidebarNav` biến thể account.

#### 6. Hiện trạng code
- **Guard** (`lib/auth/guards.ts`, không sửa):
  - `getVerifiedSession()`: cache, đọc lại user từ DB.
  - `requireRole(role)`: trả về `SessionUser` gồm id, name, email, role, vendorId, vendorStatus.
  - `requireApprovedVendor()`: trả về `{ user, vendor: { id, storeName, slug, status } }`.
  - Guard không select `createdAt`, nên loader phải tự query.
- **Layout** (chỉ gọi guard rồi trả `children`):
  - `app/(account)/dashboard/layout.tsx` gọi `requireRole("CUSTOMER")`.
  - `app/(seller)/vendor/dashboard/layout.tsx` gọi `requireApprovedVendor()`.
  - `app/(admin)/admin/(protected)/layout.tsx` gọi `requireRole("ADMIN")`.
- **Page:** cả 3 là trang giữ chỗ (h1 + `SignOutButton`) và đã gọi đúng guard.
- **Đăng xuất:**
  - Server action `signOutAction` trong `app/actions/auth.ts` đưa từng role về trang login của role đó.
  - `components/auth/SignOutButton.tsx` là client component, dùng form và `useFormStatus`.
- **Có thể dùng lại:**
  - `components/storefront/StorefrontChrome.tsx` (UtilityBar, StorefrontHeader, MegaNav, StorefrontFooter). Header đang cứng "Hello, Guest / Sign in", xem **Q2**.
  - `components/storefront/HelpCards.tsx`, `components/StatusBadge.tsx` (có tone cho pending/approved/suspended), `components/Wordmark.tsx`.
  - `components/icons.tsx`, đã có User, Heart, Cart, Truck, Package, Building, Chat, Help, Blog, MapPin, Clock, Ban, Alert, Check, Search, ChevronDown, Grid, Eye/EyeOff.
- **Lưu ý thư mục icon:** đã có **file** `components/icons.tsx`, còn task.md yêu cầu **thư mục** `components/icons/`.
  - Đề xuất: icon mới đặt trong `components/icons/dashboard.tsx`, import bằng `@/components/icons/dashboard`. `@/components/icons` vẫn trỏ vào file cũ.
  - Không di chuyển file cũ vì làm vậy phải sửa import ngoài phạm vi.
- **DB:** chỉ có `User` (id, name, email, passwordHash, role, createdAt) và `Vendor` (storeName, slug, status, createdAt).

#### 7. Token
**Dùng lại được:**
- Màu: `iris-*`, `ink`, `ink-soft`, `muted`, `muted-soft`, `line`, `line-soft`, `line-strong`, `bg`, `bg-dash`, `bg-subtle`, `field`, `field-muted`, `on-dark-subtle` (icon rail chưa chọn).
- Màu trạng thái: `success/-bg/-solid`, `warning/-bg/-solid`, `error/-bg/-solid`, `info/-bg/-solid`, `accent-*`, `star`.
- Khác:
  - Radius: `md`, `lg`, `xl`, `2xl`, `full`.
  - Shadow: `xs` (card), `md` (help card hover), `lg`.
  - Animation: `animate-shimmer`.
  - Utility `placeholder-hatch`.
  - Container: `max-w-marketing` (1240).

**Còn thiếu (sẽ thêm vào `:root` và `@theme` ở Bước 1):**
| Giá trị trong thiết kế | Token đề xuất | Dùng cho |
|---|---|---|
| `#C6C4CE` | `--muted-faint` | chevron breadcrumb |
| `#6E6A7C` | `--muted-strong` | icon menu tài khoản chưa chọn |
| `#DAD8E0` | `--line-dashed` | viền đứt empty state |
| `#F6D9DA` | `--error-line` | viền thẻ lỗi |
| `#EDECF1` | `--track` | nền track của tab khoảng thời gian, nền skeleton |
| `#F7F6F9` | `--track-highlight` | vệt sáng skeleton |
| `0 10px 24px -14px rgba(20,18,31,.2)` | `--shadow-card-hover` | hover thẻ số liệu/sản phẩm |
| `0 20px 48px -14px rgba(20,18,31,.28)` | `--shadow-menu` | dropdown hồ sơ |
| `0 6px 16px -6px rgba(101,68,224,.4)` | `--shadow-iris` | chip icon ví |
| font 11.5 / 17 / 20 / 21 / 22 px | `text-11-5`, `text-17`, `text-20`, `text-21`, `text-22` | |
| max-width 1280px / 840px | `max-w-dash` (80rem) / `max-w-profile` (52.5rem) | |

Rộng 64/236/300px và các khoảng cách dùng thang spacing của Tailwind (`w-16`, `w-59`, `w-75`…), giống task 01.

#### 8. Mặc định tôi sẽ áp dụng (phản đối thì báo)
- Bỏ tab "Preview state". Mỗi route có thêm `loading.tsx` (skeleton theo thiết kế) và `error.tsx` (thẻ lỗi có nút "Try again") để đủ 4 trạng thái theo DESIGN_SYSTEM §10. Hai file này nằm trong thư mục route của 3 dashboard.
- Nút không có trang đích bị vô hiệu, có `aria-disabled` và tooltip "Coming soon". Đó là Products, Visit store, Withdraw, View All, nút đổi ảnh, Fullscreen, Search Menu, Notifications, Messages và các tab năm/tháng/tuần.
- Setup Guide: giữ thẻ, thay "20% Complete" bằng "Coming soon", thanh tiến độ để trống. Không bịa %.
- Email trong pill hồ sơ vendor được che giống thiết kế. Trong dropdown hiển thị đầy đủ tên.
- Responsive: dưới `md`, rail + sidebar (vendor/admin) và sidebar tài khoản (khách hàng) thu thành drawer, mở bằng nút menu. Từ `md` trở lên, nút trong topbar thu gọn/mở sidebar giống thiết kế.

#### Câu hỏi mở (cần trả lời trước Bước 1)
- **Q1:** Nội dung `/dashboard` là form sửa hồ sơ. Lưu hồ sơ là ghi DB, ngoài task. Hiển thị thế nào?
- **Q2:** Header storefront đang cứng "Hello, Guest / Sign in". Có sửa `StorefrontChrome` (ngoài phạm vi) để hiện tên người dùng không?
- **Q3:** Đặt số vendor theo trạng thái và 5 vendor gần nhất ở đâu trên dashboard admin?
- **Q4:** Đặt thông tin cửa hàng (tên, slug, trạng thái, ngày tạo) ở đâu trên dashboard vendor?

**Trả lời (2026-09-29):**
- Q1: form chỉ đọc.
- Q2: `StorefrontHeader` nhận prop `user`.
- Q3: thêm hàng 2 thẻ ở đầu section "Stores".
- Q4: thông tin cửa hàng ở phụ đề và dropdown hồ sơ.

Chi tiết ở `decisions.md`.

### Bước 1 — Thành phần dùng chung (2026-09-29)
- Đã làm:
  - Khung vendor/admin: `DashboardShell` (server) + `ShellFrame` (client).
    - Icon rail, sidebar có nhóm "Overview", thẻ Setup Guide.
    - Topbar gồm breadcrumb, ô search (admin), các nút icon, `UserMenu`.
    - Nút trên topbar thu gọn sidebar (từ `md` trở lên); dưới `md` nút này mở drawer.
  - Khung khách hàng: `AccountShell` (server) + `AccountFrame` (client).
    - Gồm khung storefront, breadcrumb, sidebar tài khoản, thẻ nội dung trắng, HelpCards, footer.
    - Dưới `md` có nút "Account menu" mở drawer.
  - `SidebarNav` (client, dùng `usePathname`) có 3 biến thể rail/sidebar/account.
    - Mục chưa có trang không phải link: mờ, `aria-disabled`, tooltip "Coming soon".
  - `UserMenu` (client):
    - Pill hồ sơ + dropdown: mở bằng click; đóng khi rời chuột, bấm Escape hoặc click ra ngoài.
    - Header dropdown hiện tên, email; vendor thêm tên cửa hàng.
    - Logout dùng `signOutAction` của task 01, qua `SignOutItem`.
  - Widget dùng chung: `SectionCard` (+ `ViewAllLink`), `StatCard` (metric/status/status-compact; `null` hiện "—" + sr-only "No data yet"), `EmptyState` (page/inline, tone error), `ListRow`, `ChartFrame` (khung biểu đồ rỗng), `RangeTabs` (vô hiệu).
  - `lib/dashboard/nav.ts`: menu 3 role (label, href, icon, enabled). `lib/dashboard/format.ts`: `maskEmail`, `splitName`, `formatDate`.
  - Gắn shell vào 3 layout, giữ nguyên lời gọi guard.
    - Layout vendor lấy `storeName` từ `requireApprovedVendor()`.
    - Ở 3 page giữ chỗ, đổi `<main>` thành `<div>` để không lồng `<main>`.
  - `StorefrontHeader` nhận prop `user` tùy chọn (Q2). Các trang storefront cũ không đổi.
  - `scripts/verify-dashboards.ts`: script HTTP của Bước 5, viết sớm để kiểm tra shell.
    - Tạo 5 user test (mật khẩu chỉ lưu dạng hash bcrypt).
    - Đăng nhập qua `/api/auth/callback/credentials` bằng `fetch`.
    - Kiểm tra trang 200, các chuyển hướng theo role, marker nội dung, và việc mục vô hiệu không phải link.
    - Dọn dữ liệu test cả khi lỗi. Không cài thư viện mới.
- File tạo/sửa:
  - Tạo mới:
    - `components/dashboard/{DashboardShell,ShellFrame,AccountShell,AccountFrame,SidebarNav,NavIcon,UserMenu,SignOutItem,SectionCard,StatCard,EmptyState,ListRow,ChartFrame,RangeTabs}.tsx` và `coming-soon.ts`.
    - `components/icons/dashboard.tsx`.
    - `lib/dashboard/nav.ts`, `lib/dashboard/format.ts`.
    - `scripts/verify-dashboards.ts`.
  - Sửa:
    - 3 layout, 3 page (chỉ thẻ bọc).
    - `components/storefront/StorefrontChrome.tsx` (Q2).
    - `app/globals.css`.
- Token thêm vào `:root` + `@theme` (`app/globals.css`):
  - Màu:
    - `muted-strong` #6E6A7C, `muted-faint` #C6C4CE.
    - `line-dashed` #DAD8E0, `error-line` #F6D9DA.
    - `track` #EDECF1, `track-highlight` #F7F6F9.
  - Shadow: `shadow-card-hover`, `shadow-menu`, `shadow-iris`.
  - Cỡ chữ: `text-11-5`, `text-17`, `text-20`, `text-21`, `text-22`.
  - Tracking: `tracking-label` (.08em, nhãn nhóm sidebar).
  - Container: `max-w-dash` (1280px), `max-w-profile` (840px).
  - Utility `skeleton` (dải shimmer `track` → `track-highlight`, dùng cho `loading.tsx`).
- Kết quả kiểm tra:
  - `npx tsc --noEmit`: không lỗi.
  - `npm run lint`: không lỗi.
  - `npm run build`: thành công, đủ 14 route.
  - Grep file mới: không có hex/`rgba(`, không có `passwordHash`.
  - CSS build có đủ các class token mới (đã grep, ví dụ `w-59`, `shadow-menu`, `size-19.5`, `bg-ink/40`, `skeleton`).
  - Kiểm tra HTTP (`verify-dashboards.ts`) **chưa chạy được**: MySQL `localhost:3306` không chạy ("Can't reach database server"). Script đã sẵn sàng, sẽ chạy ở Bước 2.
- Việc tôi cần làm thủ công: bật MySQL (database `covetecom`) trước Bước 2.

## Bước tiếp theo
Bước 2 — Dashboard khách hàng (`/dashboard`). Cần MySQL đang chạy để kiểm tra HTTP.
