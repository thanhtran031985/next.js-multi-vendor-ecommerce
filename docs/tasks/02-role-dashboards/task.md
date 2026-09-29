# 02 — Dashboard sau đăng nhập cho 3 role (role-dashboards)

> Quy trình làm việc và quy tắc code: xem `CLAUDE.md`.
> Tiến độ: `docs/tasks/02-role-dashboards/progress.md`.
> Phụ thuộc: `01-auth` (✅). Đọc `docs/tasks/01-auth/decisions.md` trước khi làm,
> đặc biệt mục "Page cũng gọi guard" và "Guard đọc lại user từ DB mỗi request".

## Mục tiêu
Thay các trang dashboard giữ chỗ (tạo ở task 01) bằng dashboard thật theo thiết kế
cho cả 3 role: khu vực khách hàng `/dashboard`, người bán `/vendor/dashboard`,
admin `/admin/dashboard`. Gồm khung giao diện dùng chung (sidebar, thanh trên, menu
người dùng, đăng xuất) và trang tổng quan của từng role.

## Thiết kế
Nằm trong `designs/` (định dạng x-dc):
- `designs/UserDashboard.dc.html`   → `/dashboard` (khách hàng)
- `designs/VendorDashboard.dc.html` → `/vendor/dashboard` (người bán)
- `designs/AdminDashboard.dc.html`  → `/admin/dashboard` (admin)
Tên file ở trên là dự kiến. Ở Bước 0, đối chiếu với tên thật (có thể khác hoa/thường)
và báo lại bảng ánh xạ. Không tìm thấy file nào trong 3 file → DỪNG và hỏi.
CHỈ đọc nội dung 3 file này. Các file thiết kế khác (AdminAllOrders, AdminProductList…)
chỉ được liệt kê tên khi cần đối chiếu link trong sidebar, không đọc nội dung.

## Bối cảnh
- Auth đã xong ở task 01: guard `requireRole`, `requireApprovedVendor`,
  `getVerifiedSession` trong `lib/auth/guards.ts`; layout nằm trong route group
  `app/(account)/dashboard/`, `app/(seller)/vendor/dashboard/`,
  `app/(admin)/admin/(protected)/`; đã có server action đăng xuất.
- Dữ liệu hiện có trong DB: CHỈ có `User` và `Vendor`. Chưa có model đơn hàng, sản
  phẩm, doanh thu, đánh giá…
- UI dùng tiếng Anh (theo quyết định ở task 01).

## Quyết định kiến trúc (làm đúng theo)
- **Không dữ liệu giả.** Mỗi widget trong thiết kế được phân loại ở Bước 0:
  - (A) Có dữ liệu thật từ `User`/`Vendor` → hiển thị dữ liệu thật.
  - (B) Cần model chưa có (đơn hàng, sản phẩm, doanh thu…) → giữ đúng bố cục của
    widget nhưng hiển thị trạng thái rỗng (empty state), KHÔNG bịa số liệu.
  - (C) Nội dung tĩnh (tiêu đề, lời chào, banner) → giữ nguyên.
- **Nguồn dữ liệu tách riêng:** mỗi role có một loader trong `lib/dashboard/<role>.ts`,
  trả về object có kiểu rõ ràng. Page chỉ gọi loader, không query Prisma trực tiếp.
  Widget loại (B) có trường trong kiểu dữ liệu nhưng loader trả giá trị rỗng, kèm
  comment `// TODO(<task tương lai>)`. Như vậy task sau chỉ cần sửa loader.
- **Không lộ dữ liệu nhạy cảm:** loader chỉ `select` đúng trường cần hiển thị.
  Tuyệt đối không select `passwordHash`.
- **Server component mặc định.** Chỉ dùng client component cho phần tương tác
  (mở/đóng sidebar trên mobile, dropdown menu người dùng).
- **Guard ở cả layout và page** (theo decisions của task 01). Page dùng đúng guard:
  `/dashboard` → role CUSTOMER; `/vendor/dashboard` → `requireApprovedVendor`;
  `/admin/dashboard` → role ADMIN. KHÔNG sửa logic trong `lib/auth/*` hoặc `proxy.ts`;
  nếu thấy cần sửa → DỪNG và hỏi.
- **Link sidebar tới trang chưa có:** cấu hình menu trong `lib/dashboard/nav.ts`
  (label, href, icon, enabled). Mục chưa có trang → hiển thị mờ, không phải link,
  `aria-disabled="true"`, tooltip "Coming soon". KHÔNG tạo route mới cho các mục này.
- **Biểu đồ:** không cài thư viện biểu đồ. Nếu thiết kế có biểu đồ, giữ khung và kích
  thước, hiển thị empty state. Ghi vào `decisions.md` để task sau quyết định thư viện.
- **Icon:** nếu thiết kế dùng SVG inline, chuyển thành component trong
  `components/icons/`. Không cài thư viện icon.
- **Responsive:** theo thiết kế. Nếu thiết kế không có bản mobile: dưới breakpoint `md`,
  sidebar thu thành drawer mở bằng nút menu. Ghi lựa chọn vào `decisions.md`.

## Các bước

### Bước 0 — Kiểm tra (không sửa code)
Báo cáo:
- Bảng ánh xạ: route → file thiết kế thật.
- Với từng thiết kế, liệt kê:
  - Khung: sidebar (các mục menu), thanh trên, menu người dùng, footer.
  - Từng widget: tên, kiểu (thẻ số liệu, bảng, danh sách, biểu đồ…), phân loại
    (A)/(B)/(C), và với (A) thì lấy từ trường nào.
  - Mục menu nào đã có trang thật, mục nào sẽ bị vô hiệu hóa.
- Phần giống nhau giữa 3 thiết kế (để làm component dùng chung) và phần khác nhau.
- Hiện trạng: nội dung các page/layout dashboard hiện có, component đăng xuất, tên
  guard chính xác, các token trong `@theme` có thể dùng lại, token còn thiếu.
Ghi kết quả vào progress.md.

### Bước 1 — Thành phần dùng chung
- `components/dashboard/`: `DashboardShell` (sidebar + thanh trên + vùng nội dung),
  `SidebarNav` (đọc từ `lib/dashboard/nav.ts`), `UserMenu` (tên, email, đăng xuất —
  dùng lại server action đăng xuất của task 01), `StatCard`, `SectionCard`,
  `EmptyState`, và bảng/danh sách cơ bản nếu thiết kế có.
- `lib/dashboard/nav.ts`: cấu hình menu cho 3 role.
- Gắn `DashboardShell` vào 3 layout được bảo vệ, giữ nguyên lời gọi guard hiện có.
- Chỉ dùng design token; token thiếu thì thêm vào `@theme` và liệt kê.
- Kiểm tra: `npx tsc --noEmit`, `npm run build` không lỗi.

### Bước 2 — Dashboard khách hàng (`/dashboard`)
- Chuyển `UserDashboard` sang TSX theo phân loại ở Bước 0.
- Loader `lib/dashboard/customer.ts`: dữ liệu (A) như tên, email, ngày tạo tài khoản.
- Widget đơn hàng, wishlist, địa chỉ… (nếu có trong thiết kế) → empty state.
- Kiểm tra: build không lỗi; request HTTP thật: khách hàng → 200; vendor và admin →
  về dashboard của họ (không lỗi, không vòng lặp).

### Bước 3 — Dashboard người bán (`/vendor/dashboard`)
- Chuyển `VendorDashboard` sang TSX theo phân loại ở Bước 0.
- Loader `lib/dashboard/vendor.ts`: dữ liệu (A) như tên cửa hàng, slug, trạng thái,
  ngày tạo, tên và email chủ cửa hàng.
- Widget sản phẩm, đơn hàng, doanh thu… → empty state.
- Không đổi `/vendor/pending`.
- Kiểm tra: build không lỗi; HTTP: vendor APPROVED → 200; PENDING/SUSPENDED → về
  `/vendor/pending`; khách hàng → về `/dashboard`.

### Bước 4 — Dashboard admin (`/admin/dashboard`)
- Chuyển `AdminDashboard` sang TSX theo phân loại ở Bước 0.
- Loader `lib/dashboard/admin.ts` (các query chạy song song bằng `Promise.all`):
  - Số khách hàng, số vendor theo từng trạng thái (PENDING / APPROVED / SUSPENDED).
  - 5 vendor đăng ký gần nhất: tên cửa hàng, email chủ, trạng thái, ngày đăng ký
    (CHỈ xem, không có nút duyệt).
  - Chỉ dùng `count` và `select` trường cần thiết.
- Widget đơn hàng, doanh thu, sản phẩm, đánh giá… → empty state.
- Kiểm tra: build không lỗi; HTTP: admin → 200; khách hàng và vendor → về dashboard
  của họ; số liệu khớp với truy vấn SQL trực tiếp.

### Bước 5 — Kiểm tra tổng
Tự động (chạy và dán kết quả):
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `npx tsx --env-file=.env scripts/verify-auth.ts` vẫn đạt toàn bộ (không làm hỏng auth).
- Grep: không có mã hex/`rgba(` cố định trong file mới; không có `passwordHash` trong
  `lib/dashboard/**` và `components/dashboard/**`.
- Script HTTP (không cài thư viện mới) kiểm tra mỗi role vào đúng dashboard, sai role
  bị chuyển đúng chỗ; dọn dữ liệu test sau khi chạy.

Checklist thủ công cho tôi (ghi vào progress.md):
- Mở từng dashboard cạnh file thiết kế tương ứng trong trình duyệt: bố cục, khoảng
  cách, màu khớp.
- Mục menu chưa có trang: mờ, không bấm được, có tooltip "Coming soon".
- Widget chưa có dữ liệu hiển thị empty state, không có số liệu bịa.
- Admin: số liệu khớp với SQL (đưa lệnh SQL chính xác).
- Menu người dùng → Sign out ở cả 3 role về đúng trang đăng nhập.
- Thu nhỏ trình duyệt còn 375px: sidebar thành drawer, không cuộn ngang toàn trang.
- F5 vẫn giữ session; khách hàng mở `/admin/dashboard` vẫn bị chuyển về `/dashboard`.

## Phạm vi
- Được tạo/sửa: `components/dashboard/**`, `components/icons/**`, `lib/dashboard/**`,
  3 page dashboard, 3 layout được bảo vệ (chỉ để gắn `DashboardShell`), theme token.
- KHÔNG làm trong task này:
  - Model/migration mới (đơn hàng, sản phẩm…), số liệu giả.
  - Các trang con trong sidebar (Orders, Products, Reports…).
  - Chức năng duyệt/khóa vendor của admin.
  - Cài thư viện biểu đồ hoặc icon.
  - Sửa logic auth (`lib/auth/*`, `proxy.ts`, `auth.ts`, `auth.config.ts`).

## Tiêu chí hoàn thành
- Mọi bước trong progress.md là ✅.
- Phần kiểm tra tự động ở Bước 5 không lỗi, `verify-auth.ts` vẫn đạt toàn bộ.
- Checklist thủ công đã được ghi vào progress.md để tôi kiểm tra.
- `decisions.md` ghi danh sách widget loại (B) và task tương lai sẽ lấp dữ liệu.
