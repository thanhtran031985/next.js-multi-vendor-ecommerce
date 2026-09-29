# Tiến độ — 02-role-dashboards

Trạng thái chung: 🔄 · Cập nhật lần cuối: 2026-09-29

| Bước | Tên | Trạng thái | Ghi chú |
|------|-----|------------|---------|
| 0 | Kiểm tra (không sửa code) | ✅ | Q1–Q4 đã chốt, xem decisions.md |
| 1 | Thành phần dùng chung | ✅ | tsc/lint/build đạt; HTTP đạt (chạy cùng Bước 2) |
| 2 | Dashboard khách hàng (`/dashboard`) | ✅ | HTTP: 42/42 kiểm tra đạt |
| 3 | Dashboard người bán (`/vendor/dashboard`) | ✅ | HTTP: 63/63 kiểm tra đạt |
| 4 | Dashboard admin (`/admin/dashboard`) | ✅ | HTTP 89/89; số liệu khớp SQL |
| 5 | Kiểm tra tổng | ✅ | Tự động đạt hết; checklist thủ công bên dưới |

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

### Bước 2 — Dashboard khách hàng (2026-09-29)
- Đã làm:
  - Loader `lib/dashboard/customer.ts` (`getCustomerDashboard`):
    - Chỉ select `name`, `email`, `createdAt`.
    - Tách First/Last Name bằng `splitName`.
    - `phone: null` kèm `// TODO(customer-profile)`.
  - Page `/dashboard` (Profile Info, chỉ đọc, theo Q1). Page chỉ gọi loader, không query Prisma trực tiếp.
    - Avatar mặc định, tên đầy đủ, "Member since <ngày>".
    - 6 ô form:
      - Name/Email: `readOnly`, lấy từ DB.
      - Phone: trống, placeholder "Not added yet".
      - Mật khẩu: `disabled`, có "Coming soon".
    - Nút đổi ảnh và "Update Profile" bị vô hiệu, có "Coming soon".
    - Page vẫn gọi `requireRole("CUSTOMER")`.
  - `loading.tsx`: skeleton theo trạng thái Loading của thiết kế.
  - `error.tsx`: thẻ lỗi của thiết kế + "Try again". Dùng prop `retry` của Next 16.
  - Component mới:
    - `DashboardError` (client, dùng chung cho 3 dashboard).
    - `ProfileHeading`.
    - `EmptyState` thêm prop `framed`, để hiện trạng thái bên trong một thẻ có sẵn.
- File tạo/sửa:
  - `lib/dashboard/customer.ts`.
  - `app/(account)/dashboard/{page,loading,error}.tsx`.
  - `components/dashboard/{DashboardError,ProfileHeading}.tsx`, `components/dashboard/EmptyState.tsx`.
  - `scripts/verify-dashboards.ts`: thêm marker của trang khách hàng.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`: không lỗi.
  - `npm run lint`: không lỗi.
  - `npm run build`: thành công.
  - HTTP (sau khi bật MySQL): `next start` + `npx tsx --env-file=.env scripts/verify-dashboards.ts` → **ALL CHECKS PASSED**, 42/42, đã xóa 5 user test.
    - Khách hàng:
      - `/dashboard` trả 200. Hiện "Hello, Cora", tên/email thật, First/Last Name, "Member since", "Coming soon".
      - Không có link `/dashboard/orders`. Không có `passwordHash`.
    - Vendor và admin vào `/dashboard` bị chuyển 1 lần về dashboard của họ (không vòng lặp).
    - Kiểm tra luôn shell của Bước 1:
      - Vendor APPROVED → 200, PENDING/SUSPENDED → `/vendor/pending`.
      - Admin → 200.
      - Chưa đăng nhập → trang login đúng khu vực.
- Việc tôi cần làm thủ công: không có. (Checklist trình duyệt để ở Bước 5.)

### Bước 3 — Dashboard người bán (2026-09-29)
- Đã làm:
  - Loader `lib/dashboard/vendor.ts` (`getVendorDashboard`):
    - (A) Chỉ select `storeName`, `slug`, `status`, `createdAt` và `user.name`, `user.email`.
    - (B) Các trường sau trả giá trị rỗng, mỗi trường có `// TODO(<task>)`:
      - `orderStatusCounts: null`
      - `wallet: null`
      - `earnings: []`
      - `mostRatedProducts: []`
      - `topSellingProducts: []`
      - `topDeliveryMen: []`
  - Kiểu dùng chung cho widget (B) nằm trong `lib/dashboard/types.ts`: `ORDER_STATUSES`, `OrderStatusCounts`, `ChartPoint`, `RatedProduct`, `TopProduct`, `DeliveryPerson`.
  - Page `/vendor/dashboard` theo thiết kế:
    - Tiêu đề và thanh công cụ:
      - "Welcome <tên>".
      - Phụ đề (Q4): "<Store> · /<slug> · <StatusBadge> · Since <ngày>".
      - Nút Products vô hiệu.
    - Business Analytics: 8 thẻ trạng thái đơn hàng, hiện "—" vì chưa có model đơn hàng. Bộ chọn "Overall Statistics" vô hiệu.
    - Vendor Wallet: số dư + Withdraw (vô hiệu) + 4 ô tiền, tất cả hiện "—".
    - Earning Statistics: tab khoảng thời gian (vô hiệu), chú thích, khung biểu đồ 300px với empty state.
    - Các khối Most Rated / Top Selling / Top Delivery Man hiện empty state.
    - Page vẫn gọi `requireApprovedVendor()`.
  - Các widget tự hiện dữ liệu khi loader có dữ liệu, rỗng thì hiện empty state. Task sau chỉ cần sửa loader.
  - Component mới:
    - `OrderStatusGrid`, `WalletTile` (+ `Dash`).
    - `ProductWidgets`: `RatedProductList`, `TopProductGrid`, `DeliveryPeopleGrid`. Cả 3 dùng chung cho vendor và admin, có biến thể theo từng thiết kế.
  - Icon mới `TimerIcon`. Tone chip mới: `amber`, `danger`. `formatMoney`.
  - `loading.tsx` (skeleton) và `error.tsx` (thẻ lỗi + Try again).
  - Không đổi `/vendor/pending`.
- File tạo/sửa:
  - `lib/dashboard/{vendor,types}.ts`, `lib/dashboard/format.ts`.
  - `app/(seller)/vendor/dashboard/{page,loading,error}.tsx`.
  - `components/dashboard/{OrderStatusGrid,WalletTile,ProductWidgets}.tsx`, `components/dashboard/{SectionCard,StatCard}.tsx`.
  - `components/icons/dashboard.tsx`.
  - `scripts/verify-dashboards.ts`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi.
  - HTTP (`verify-dashboards.ts`, `next start`): **ALL CHECKS PASSED**, 63/63, đã xóa 5 user test.
    - Vendor APPROVED:
      - `/vendor/dashboard` trả 200.
      - Có tên, cửa hàng, slug, "Approved", "Since", các khối và empty state.
      - Không có số demo của thiết kế ("10,081.50", "James Dawson"). Không có link `/vendor/dashboard/products`.
    - Vendor PENDING/SUSPENDED → `/vendor/pending`. `/vendor/pending` của PENDING vẫn 200.
    - Khách hàng → `/dashboard`.
  - Grep: không có hex/`rgba(`, không có `passwordHash` trong `lib/dashboard/**` và `components/dashboard/**`. Hai comment từng nhắc "passwordHash" đã được sửa lời.
- Việc tôi cần làm thủ công: không có.

### Bước 4 — Dashboard admin (2026-09-29)
- Đã làm:
  - Loader `lib/dashboard/admin.ts` (`getAdminDashboard`) chạy 6 query song song bằng `Promise.all`:
    - `user.count` với CUSTOMER và với VENDOR.
    - `vendor.count` với từng trạng thái PENDING / APPROVED / SUSPENDED.
    - `vendor.findMany` lấy 5 vendor mới nhất (`orderBy createdAt desc, id desc`). Chỉ select `id`, `storeName`, `status`, `createdAt`, `user.email`.
  - Total Stores = tổng vendor mọi trạng thái.
  - Các widget (B) trả giá trị rỗng, mỗi widget có `// TODO(<task>)`: tổng đơn hàng/sản phẩm, trạng thái đơn, ví, 2 biểu đồ, số người giao hàng, top customers, người giao hàng, cửa hàng, sản phẩm inhouse/vendor.
  - Page `/admin/dashboard` theo thiết kế:
    - Welcome.
    - Business Analytics: 4 thẻ số liệu. Total Stores và Total Customers là số thật, Total Order và Total Products hiện "—". Tiếp theo là 8 thẻ trạng thái đơn hàng.
    - Admin Wallet.
    - Order Statistics + User Overview:
      - Khung donut hiện empty state.
      - Chú thích dùng số thật cho Customer/Vendor; Delivery Man hiện "—".
    - Earning Statistics.
    - Nhóm Users / Stores / Inhouse Products / Vendor Products.
  - Q3: hàng đầu của nhóm "Stores" gồm 2 thẻ.
    - "Vendors by Status": 3 thẻ số liệu.
    - "Recent Vendor Registrations": tên cửa hàng, email chủ, StatusBadge, ngày. Chỉ xem, không có nút duyệt.
    - Most Popular Stores và Top Selling Stores ở hàng dưới.
  - Page vẫn gọi `requireRole("ADMIN")`.
  - Component mới `StoreWidgets` (TopCustomerList, RecentVendorList, PopularStoreGrid, TopStoreGrid). `StatCard` có thêm prop `stat` (xuất ra `data-stat`) để script so số liệu với SQL.
  - Thêm `loading.tsx` và `error.tsx`.
  - Script: so số trên trang với **truy vấn SQL trực tiếp** (`prisma.$queryRaw`, không qua loader).
    - Tạo thêm 4 cửa hàng test (tổng 7) để danh sách 5 cửa hàng mới nhất thật sự bị cắt ở 5.
- File tạo/sửa:
  - `lib/dashboard/admin.ts`, `lib/dashboard/types.ts`.
  - `app/(admin)/admin/(protected)/dashboard/{page,loading,error}.tsx`.
  - `components/dashboard/StoreWidgets.tsx`, `components/dashboard/StatCard.tsx`.
  - `scripts/verify-dashboards.ts`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi.
  - HTTP: **ALL CHECKS PASSED**, 89/89, đã xóa 9 user test.
    - Admin:
      - `/admin/dashboard` trả 200, có đủ các khối.
      - Không có số demo ("27,514.52", "Robert Downey"). Không có link `/admin/dashboard/products`.
    - Khách hàng và vendor vào `/admin/dashboard` bị chuyển về dashboard của họ.
    - Số liệu = SQL: customers 1, stores 7, pending 5, approved 1, suspended 1, overview vendors 7. Danh sách 5 cửa hàng mới nhất khớp thứ tự SQL.
  - Grep: không có hex/`rgba(`, không có `passwordHash`.
  - Ghi chú: ngoài user test, DB hiện **không có khách hàng hay vendor nào**. Trên dashboard thật, admin sẽ thấy 0 cho đến khi có đăng ký.
- Việc tôi cần làm thủ công: không có.

### Bước 5 — Kiểm tra tổng (2026-09-29)
- Đã làm:
  - Chạy toàn bộ kiểm tra tự động.
  - Rà lại code của cả task và sửa 2 lỗi nhỏ:
    - `AccountFrame`: thêm `md:bottom-auto`. Sidebar tài khoản trên desktop giữ `bottom:0` của drawer mobile cùng với `sticky`, nên có thể bị đẩy lệch khi cuộn.
    - `SidebarNav`: tooltip icon rail bị vô hiệu đổi thành "<Tên mục> — Coming soon". Trước đây chỉ là "Coming soon", nên không biết icon là mục gì.
- Kết quả kiểm tra tự động (trên commit cuối, sau 2 chỗ sửa):
  - `npx tsc --noEmit`: OK, 0 lỗi.
  - `npm run lint`: OK, exit 0, không cảnh báo.
  - `npm run build`: exit 0, "Compiled successfully", 14/14 route.
  - `npx tsx --env-file=.env scripts/verify-auth.ts`: **ALL CHECKS PASSED**, 31/31, đã dọn 3 user test. Auth không bị ảnh hưởng.
  - Grep trên 43 file code mà task tạo hoặc sửa (`git diff cbfcbd2..HEAD`):
    - Mã hex/`rgba(`: chỉ xuất hiện trong 9 dòng **định nghĩa token** mới ở `app/globals.css` (`:root`). Không có trong component/page. Phần sửa ở `StorefrontChrome.tsx` không có mã màu.
    - `passwordHash` trong `lib/dashboard/**` và `components/dashboard/**`: không có.
  - `git diff cbfcbd2..HEAD -- lib/auth proxy.ts auth.ts auth.config.ts prisma`: không có thay đổi. Logic auth và schema giữ nguyên.
  - Script HTTP `scripts/verify-dashboards.ts` (`next start`): **ALL CHECKS PASSED**, 88/88, đã xóa 9 user test. Kiểm tra lại DB: còn 0 user `*.covet.test`.
    - Mỗi role vào đúng dashboard (200).
    - Sai role bị chuyển một lần về dashboard của mình.
    - PENDING/SUSPENDED → `/vendor/pending`.
    - Chưa đăng nhập → trang login của khu vực đó.
    - Mục menu chưa có trang không phải link.
    - Không có số demo của thiết kế.
    - Số liệu admin = SQL trực tiếp.
- Việc tôi cần làm thủ công: checklist bên dưới.

## Checklist thủ công (cho chủ dự án)
Chuẩn bị:
1. Bật MySQL, chạy `npm run dev`.
2. Tạo tài khoản test:
   - Khách hàng: qua `/register`.
   - Vendor: qua `/vendor/register`. Trang duyệt vendor chưa có (task sau), nên duyệt bằng SQL: ``UPDATE `Vendor` SET status = 'APPROVED' WHERE slug = '<slug>';``
   - Admin: `npx prisma db seed` (tạo tài khoản `ADMIN_EMAIL` trong `.env`).

- [ ] **So với thiết kế:** mở từng dashboard cạnh file thiết kế trong trình duyệt. Kiểm tra bố cục, khoảng cách và màu khớp.
  | Dashboard | File thiết kế |
  |---|---|
  | `/dashboard` | `designs/userdashboard.dc.html` |
  | `/vendor/dashboard` | `designs/vendordashboard.dc.html` |
  | `/admin/dashboard` | `designs/AdminDashboard.dc.html` |

  Các điểm lệch có chủ đích nằm trong `decisions.md`:
  - Q1–Q4.
  - Bỏ tab "Preview state".
  - Setup Guide ghi "Coming soon".
  - Ô Phone không có "+1".
  - Dropdown admin có header.
- [ ] **Mục menu chưa có trang:**
  - Mục bị mờ, bấm không có tác dụng, hover hiện tooltip "Coming soon". Với icon rail, tooltip là "<Tên> — Coming soon".
  - Mục đang mở ("Profile Info" / "Dashboard" / icon Home) được tô màu iris.
- [ ] **Không có số liệu bịa:**
  - Thẻ số liệu hiện "—".
  - Danh sách và biểu đồ hiện empty state ("No sales yet", "No earnings yet"…).
  - Không có số demo của thiết kế ($10,081.50, 248 orders…).
- [ ] **Admin, số liệu khớp SQL.** Chạy trong phpMyAdmin, database `covetecom`:
  ```sql
  SELECT
    (SELECT COUNT(*) FROM `User`   WHERE role = 'CUSTOMER')    AS total_customers,    -- thẻ Total Customers + "Total Customer (N)"
    (SELECT COUNT(*) FROM `Vendor`)                             AS total_stores,       -- thẻ Total Stores
    (SELECT COUNT(*) FROM `Vendor` WHERE status = 'PENDING')   AS vendors_pending,    -- Vendors by Status: Pending
    (SELECT COUNT(*) FROM `Vendor` WHERE status = 'APPROVED')  AS vendors_approved,   -- Approved
    (SELECT COUNT(*) FROM `Vendor` WHERE status = 'SUSPENDED') AS vendors_suspended,  -- Suspended
    (SELECT COUNT(*) FROM `User`   WHERE role = 'VENDOR')      AS vendor_users;       -- "Total Vendor (N)"

  -- "Recent Vendor Registrations" (đúng thứ tự, ngày hiển thị theo UTC):
  SELECT v.storeName, u.email, v.status, v.createdAt
  FROM `Vendor` v JOIN `User` u ON u.id = v.userId
  ORDER BY v.createdAt DESC, v.id DESC
  LIMIT 5;
  ```
- [ ] **Sign out:** menu người dùng → Sign out/Logout ở cả 3 role đưa về đúng trang đăng nhập.
  - Khách hàng: nút "Sign out" trong sidebar → `/login`.
  - Vendor: pill hồ sơ → Logout → `/vendor/login`.
  - Admin: pill hồ sơ → Logout → `/admin/login`.
- [ ] **Màn hình 375px** (DevTools, iPhone SE):
  - Vendor/admin: rail + sidebar ẩn; nút ☰ trên topbar mở drawer. Đóng drawer bằng nút ✕, bấm ra ngoài, Esc, hoặc khi chuyển trang.
  - Khách hàng: nút "Account menu" mở drawer sidebar tài khoản.
  - Cả 3 trang không bị cuộn ngang.
- [ ] **Desktop:** nút ‹ trên topbar thu gọn/mở rail + sidebar (vendor/admin).
- [ ] **Giữ session và chặn sai role:**
  - F5 vẫn giữ session.
  - Khách hàng mở `/admin/dashboard` bị chuyển về `/dashboard`.
  - Vendor PENDING mở `/vendor/dashboard` bị chuyển về `/vendor/pending`.

### Ghi chú khi kiểm tra thủ công (2026-09-29)
- **Chủ dự án xác nhận:** mỗi role (customer, vendor, admin) vào đúng dashboard của mình.
- **`/admin/dashboard` chuyển sang `/vendor/dashboard`:** không phải lỗi. Trình duyệt lúc đó đang đăng nhập vendor, và quy tắc "sai role → dashboard của mình" có từ task 01. Muốn vào admin thì phải Logout rồi đăng nhập ở `/admin/login`.
- **"Issues 1" / "The children should not have changed if we pass in the same set" khi bấm `<`:** lỗi này đến từ extension React Developer Tools (`installHook.js`), không phải từ code.
  - Extension vẫn chạy trong cửa sổ ẩn danh nếu bật "Allow in Incognito".
  - Đã tái hiện bằng Chrome headless không có extension, trên dev server: sidebar thu gọn/mở lại đúng, 0 lỗi, 0 cảnh báo.
  - Không sửa code.

## Rà soát /finish-task — Giai đoạn A (2026-09-29)
Đối chiếu `task.md` (bản hiện tại, không có `_archive/`) với code trên `feat/02-role-dashboards` (HEAD `480ad1d`).

**Lệnh kiểm tra:**
- `npx tsc --noEmit`: OK.
- `npm run lint`: exit 0.
- `npm run build`: exit 0, 14/14 route.

**Kiểm tra trình duyệt tự động** (Chrome headless không có extension, dev server, 3 user test đã xóa):
- 375px: `/dashboard`, `/vendor/dashboard`, `/admin/dashboard` đều **không cuộn ngang** (`scrollWidth` = 375) và 0 lỗi console.
- 1440px: 0 lỗi console.
- Khi drawer mobile **đóng**, bên trong vẫn còn 3–4 phần tử nhận focus bằng bàn phím. Xem mục sửa số 2.

### Quyết định kiến trúc
| Mục | Đánh giá | Bằng chứng |
|---|---|---|
| Không dữ liệu giả; phân loại A/B/C | ✅ | (A) qua loader. (B) `null`/`[]` → "—"/empty state (`StatCard.tsx:23`, `WalletTile.tsx`, `ProductWidgets.tsx`, `StoreWidgets.tsx`). Script HTTP xác nhận không có số demo. |
| Loader riêng mỗi role, kiểu rõ ràng, page không query Prisma, (B) có `TODO(<task>)` | ✅ | `lib/dashboard/customer.ts:20-32`, `vendor.ts:33-52`, `admin.ts:58-102`. Grep `prisma` trong page/component: không có. |
| Chỉ select trường cần hiển thị, không `passwordHash` | ✅ | `customer.ts:22`, `vendor.ts:35-40`, `admin.ts:59-67`. Grep `passwordHash` trong `lib/dashboard`, `components/dashboard`: không có. |
| Server component mặc định; client chỉ cho phần tương tác | ⚠️ | Client: `ShellFrame`, `AccountFrame` (drawer/thu gọn), `UserMenu` (dropdown), `SignOutItem` (trạng thái pending), `DashboardError` + 3 `error.tsx` (bắt buộc là client). **`SidebarNav` là client chỉ để đọc `usePathname`** (tô mục đang mở), vì layout không biết path hiện tại. Đã ghi vào decisions.md. |
| Guard ở cả layout và page, đúng guard | ✅ | `(account)/dashboard/layout.tsx:8` + `page.tsx:19` dùng `requireRole("CUSTOMER")`. `vendor/dashboard/layout.tsx:11` + `page.tsx:34` dùng `requireApprovedVendor()`. `admin/(protected)/layout.tsx:11` + `dashboard/page.tsx:40` dùng `requireRole("ADMIN")`. `lib/auth/*`, `proxy.ts`, `auth*.ts`: không đổi (`git diff cbfcbd2..HEAD`). |
| Menu trong `lib/dashboard/nav.ts` (label, href, icon, enabled); mục chưa có trang mờ, không phải link, `aria-disabled`, tooltip "Coming soon"; không tạo route mới | ✅ | `nav.ts:30-35` + dữ liệu menu. `SidebarNav.tsx:52-66` render `<span role="link">` mờ + `comingSoonProps`. Không có route mới (build: 14 route như cũ). |
| Biểu đồ: không cài thư viện, giữ khung, empty state, ghi decisions | ✅ | `ChartFrame.tsx` (h-75 / h-57.5). `package.json` không đổi. decisions.md có mục "Thư viện biểu đồ". |
| Icon SVG inline → component trong `components/icons/`, không cài thư viện | ✅ | `components/icons/dashboard.tsx`. Grep `<svg` ngoài thư mục icon: không có. |
| Responsive: drawer dưới `md`, ghi decisions | ✅ (có lỗi a11y) | `ShellFrame.tsx:55-61`, `AccountFrame.tsx:62-68`. 375px không cuộn ngang. Drawer đóng vẫn nhận focus: mục sửa số 2. |

### Các bước
| Bước | Đánh giá | Ghi chú |
|---|---|---|
| 0 Kiểm tra | ✅ | Báo cáo trong progress.md. Q1–Q4 đã chốt. |
| 1 Thành phần dùng chung | ⚠️ | Có đủ `DashboardShell`, `SidebarNav`, `UserMenu`, `StatCard`, `SectionCard`, `EmptyState`, `ListRow`. **Khác task.md:** layout khách hàng gắn `AccountShell` thay cho `DashboardShell`, và khách hàng không có dropdown `UserMenu` (theo thiết kế). Đã ghi vào decisions.md. |
| 2 Khách hàng | ✅ | Loader lấy name/email/createdAt. Thiết kế không có widget đơn hàng/wishlist/địa chỉ trên trang này; các mục đó là menu, đang vô hiệu. HTTP đạt. |
| 3 Người bán | ✅ | Loader có store (tên, slug, trạng thái, ngày) và chủ cửa hàng (tên, email). `/vendor/pending` không đổi. HTTP: APPROVED → 200, PENDING/SUSPENDED → `/vendor/pending`, khách hàng → `/dashboard`. |
| 4 Admin | ✅ | `Promise.all` với `count` + `findMany select`. 5 vendor mới nhất, chỉ xem. Số liệu = SQL (script). |
| 5 Kiểm tra tổng | ✅ | tsc/lint/build, verify-auth 31/31, grep, script HTTP 88/88, checklist. |

### Quy tắc code trong CLAUDE.md
- **Zod cho thao tác ghi DB:** không áp dụng, task không ghi DB. Script test hash mật khẩu bằng bcrypt.
- **Không secret/Prisma trong client component:** ✅ (xem import của 9 file client). Loader chưa có `import 'server-only'`: mục sửa số 1.
- **Không hex/px cố định:** ✅. Hex/rgba chỉ có trong 9 dòng định nghĩa token ở `globals.css`. `px` chỉ xuất hiện trong comment.
- **Xử lý lỗi:** ✅ `error.tsx` cho cả 3 dashboard (prop `retry` của Next 16), `loading.tsx` cho cả 3.
- **Phạm vi:** ngoài danh sách được phép có 3 file, đều đã được chấp nhận:
  - `app/globals.css`: token.
  - `components/storefront/StorefrontChrome.tsx`: Q2.
  - `scripts/verify-dashboards.ts`: script HTTP của Bước 5.

### Danh sách cần sửa (chờ chủ dự án chọn)
1. **[Bảo mật, thấp]** Ba loader `lib/dashboard/{customer,vendor,admin}.ts` import Prisma nhưng không có `import 'server-only'`. Next 16 hỗ trợ sẵn, không cần cài.
2. **[Chức năng/a11y]** Drawer mobile khi đóng chỉ bị dời ra ngoài màn hình. Các link/nút bên trong (3–4 phần tử) vẫn nhận Tab và vẫn bị trình đọc màn hình đọc. Mở drawer không chuyển focus vào trong.
3. **[Nhỏ/a11y]** `UserMenu`: mục vô hiệu là `<span>` không nhận focus, không điều hướng được bằng phím mũi tên, và mở menu không chuyển focus vào menu.
4. **[Nhỏ]** Ngày hiển thị ("Member since", "Since", danh sách vendor) được định dạng theo **UTC**. Với người dùng ở UTC+7, tài khoản tạo lúc 00:00–07:00 giờ VN sẽ hiện lùi 1 ngày.

## Rà soát /finish-task — Giai đoạn B
Chủ dự án chọn sửa **tất cả** (1–4). Sửa lần lượt từng mục.

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| 1 `server-only` cho loader | ✅ | tsc/lint/build đạt; thử ngược: client import loader → build lỗi |
| 2 Drawer mobile đóng vẫn nhận focus | ⬜ | |
| 3 `UserMenu` điều hướng bàn phím | ⬜ | |
| 4 Ngày hiển thị theo UTC | ⬜ | chờ chọn múi giờ |

### Mục 1 — `import "server-only"` cho loader (2026-09-29)
- **Đã làm:** thêm `import "server-only";` vào đầu `lib/dashboard/customer.ts`, `vendor.ts`, `admin.ts`. Next 16 hỗ trợ sẵn, không cài gói mới.
- **Kiểm tra:**
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi.
  - **Thử ngược:** tạo tạm `app/zz-server-only-probe/page.tsx` ("use client", import `getAdminDashboard`). Build bị chặn với lỗi *You're importing a module that depends on "server-only"*. File tạm đã xóa, sau đó build lại sạch.
  - `scripts/verify-dashboards.ts` không import loader, nên không bị ảnh hưởng.

## Bước tiếp theo
Giai đoạn B, mục 2 — drawer mobile khi đóng không nhận focus.
