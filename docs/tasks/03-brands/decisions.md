# Quyết định — 03-brands

<!-- Mỗi quyết định thêm một mục:
### <ngày> — <tiêu đề>
- Bối cảnh:
- Quyết định:
- Lý do:
- Ảnh hưởng:
-->

### 2026-09-29 — Bước 0: chốt Q1–Q3
- **Q1 — shadcn/ui:** chưa cài, KHÔNG cài. Tự làm primitive nhỏ trong `components/ui/`:
  Dialog (thẻ `<dialog>` + `showModal()`, Esc để đóng), Switch, Select, Pagination.
  Dùng lại `EmptyState`, `DashboardError` của task 02.
- **Q2 — Breadcrumb:** sửa nhỏ `DashboardShell` (file của task 02, ngoài danh sách phạm vi)
  để page tự đặt breadcrumb trên thanh trên. Mặc định vẫn "Home / Dashboard", nên các
  dashboard hiện có không đổi. Brands: "Dashboard / Brands", "Dashboard / Brands / {tên}".
- **Q3 — Menu:** thêm nhóm "Organization" dưới "Overview" trong `adminNav`, mục
  "Brand Setup" → `/admin/brands`, icon có sẵn `box`. task.md ghi "bật enabled: true",
  nhưng mục này chưa tồn tại nên phải thêm mới. Tên và nhóm lấy theo thiết kế
  `AdminProductList.dc.html`.
- **Lý do:** chủ dự án chọn các phương án được đề xuất.

### 2026-09-29 — Bước 0: mặc định suy ra từ thiết kế
- **Thanh công cụ:** thiết kế chỉ có nút "Filter", không có bộ chọn trạng thái và số dòng/trang
  → dùng `<select>` theo kiểu select 46px của `VendorAddProduct`. Bỏ nút "Export" (task loại
  trừ import/export).
- **Cột thao tác:** bỏ nút mã vạch (màu cam); giữ View (xanh lá), Edit (iris), Delete (đỏ).
- **Badge INACTIVE:** component riêng trong `components/brands/`, nền `track` + chữ `muted`.
  Không sửa `StatusBadge`: với nó, "inactive" rơi vào tông accent (tím).
- **Khối tải ảnh:** chú thích "JPG, PNG, WEBP · Max 2MB" thay cho chú thích của mẫu sản phẩm.
- **Token mới** (`app/globals.css`): `--toggle-off` (#E4E2E9, DESIGN_SYSTEM §Toggle),
  `--success-soft` (#F1FBF6, nền nút View), `--backdrop` (rgba(20,18,31,.55), DESIGN_SYSTEM
  §Dialog).
- **Slug:** kiểm tra trùng viết riêng trong `lib/brands/` (`uniqueVendorSlug` chỉ dành cho
  Vendor). `slugify` trả `"store"` khi tên không còn ký tự a-z0-9, nên brand sẽ dùng fallback
  riêng. Không sửa `lib/slug.ts`.
- **Tên file ảnh:** dùng `crypto.randomUUID()` có sẵn, không dùng gói `uuid`.

### 2026-09-29 — Q4: tên brand trùng khi khác hoa/thường HOẶC khác dấu
- **Bối cảnh:** bảng `Brand` được tạo với collation `utf8mb4_unicode_ci`. Truy vấn thật trên DB:
  `'Sony' = 'sony'` → 1 (đúng ý task.md), nhưng `'Café' = 'Cafe'` → 1: tên chỉ khác dấu
  cũng bị coi là trùng. task.md không nói tới trường hợp này.
- **Lần chọn đầu:** phân biệt dấu (đổi cột `name` sang `utf8mb4_0900_as_ci`). Không làm được:
  server là **MariaDB 10.4.32**, không có collation `*_0900_*` hay `*_as_ci`. Đã thử trên DB:
  | Collation | Sony=sony | Café=Cafe | Việt=Viet | Hà=Ha |
  |---|---|---|---|---|
  | `utf8mb4_unicode_ci` (hiện tại) | 1 | 1 | 1 | 1 |
  | `utf8mb4_unicode_520_ci` | 1 | 1 | 1 | 1 |
  | `utf8mb4_vietnamese_ci` | 1 | 1 | 0 | 1 |
  | `utf8mb4_bin` | 0 | 0 | 0 | 0 |
- **Quyết định cuối:** chủ dự án chọn quay về hướng 1: giữ `utf8mb4_unicode_ci`, schema và
  migration `add_brand` giữ nguyên như task.md. Tên chỉ khác hoa/thường hoặc khác dấu đều
  bị coi là trùng → "A brand with this name already exists".
- **Phương án không chọn:** thêm cột `nameKey` (utf8mb4_bin, chữ thường) làm khóa unique;
  nâng cấp lên MySQL 8 / MariaDB 10.10+.
- **Ảnh hưởng:** `verify-brands.ts` thêm ca "khác dấu → trùng" để khóa hành vi này.
  Nếu sau này đổi DB server, xem lại quyết định này.

### 2026-09-29 — Bước 2: chi tiết triển khai
- **`lib/storage/images.ts` làm ở Bước 2 thay vì Bước 3:** `service.ts` phải lưu/xóa file để
  giữ nhất quán file ↔ DB, nên cần module này để tsc chạy được. Bước 3 vẫn làm route `/media`,
  `bodySizeLimit`, `.gitignore` và phần kiểm tra lưu ảnh thật.
- **Không `import "server-only"`** trong `lib/brands/queries.ts`, `service.ts`,
  `lib/storage/images.ts`: `scripts/verify-brands.ts` (tsx) phải import được, giống
  `lib/auth/register.ts` với `verify-auth.ts`. Client component không import các file này.
- **Kiểm tra tên trùng trước khi lưu file** (`findFirst` theo tên, loại trừ chính nó khi sửa),
  để tên trùng không ghi rồi lại xóa file. Unique index vẫn là chốt chặn cuối (P2002).
- **Sửa brand khóa dòng** (`SELECT … FOR UPDATE` trong transaction) khi đọc ảnh cũ: hai lần
  thay ảnh đồng thời không cùng đọc một file cũ, nên không để lại file mồ côi.
- **Chặn xóa khi còn sản phẩm nằm ở cả service** (không chỉ action), để script và mọi nơi gọi
  service đều bị chặn.
- **`countProductsByBrand(brandId, status?)`:** thêm tham số tùy chọn `"active" | "inactive"`
  cho thống kê "đang bán / ngừng bán" ở trang chi tiết. Hiện luôn trả 0.
- **Slug:** tên không còn chữ/số Latin (vd "索尼", "!!") → base `brand`; base cắt còn 72 ký tự
  để hậu tố `-N` vừa cột VarChar(80).
- **Danh sách (Bước 2):** `listBrands` trả thêm `totalAll` (bỏ qua bộ lọc) để phân biệt "chưa có brand"
  với "lọc không ra kết quả"; pill đếm ở header dùng `totalAll`. Sắp xếp mới nhất trước.

### 2026-09-29 — Bước 4: vị trí helper và chữ ký action
- **`ActionResult` và `requireAdminAction()` nằm trong `lib/actions/`** (`result.ts`,
  `require-admin.ts`), ngoài danh sách phạm vi của task.md. Lý do: file `"use server"` chỉ được
  export hàm async (không export được type/helper dùng chung), và task cấm sửa `lib/auth/*`.
  Hai file dùng chung được cho các task admin sau.
- **Chữ ký:** `createBrandAction(formData)`, `updateBrandAction(id, formData)`,
  `deleteBrandAction(id)`, `toggleBrandStatusAction(id, status)`. Form gọi action trực tiếp
  (không qua `useActionState`), để khi lỗi React không tự reset form và mất file đã chọn
  (Bước 6).
- **Toggle nhận trạng thái đích**, không tự đảo: gọi lại (mạng chậm, bấm lặp) cho cùng kết quả,
  hợp với `useOptimistic`.

### 2026-09-29 — Bước 5: trang danh sách
- **Breadcrumb (Q2) làm bằng parallel route `@breadcrumb`**, không dùng context client như mô tả
  lúc chọn Q2. Kết quả giống nhau (page tự đặt breadcrumb trên thanh trên, mặc định vẫn
  "Home / Dashboard"), nhưng breadcrumb được render ở server nên không nháy "Home / Dashboard"
  trước khi đổi, và trang chi tiết lấy được tên brand ngay ở server.
  - `DashboardShell` nhận prop `breadcrumb?: ReactNode`; component mới
    `components/dashboard/Breadcrumb.tsx` (`DASHBOARD_CRUMBS` = Home / Dashboard).
  - Layout `app/(admin)/admin/(protected)/layout.tsx` nhận slot `breadcrumb`.
  - Slot: `@breadcrumb/default.tsx`, `@breadcrumb/[...catchAll]/page.tsx` (route admin nào
    không có trang breadcrumb riêng → mặc định; cần vì khi điều hướng phía client, slot không
    khớp sẽ giữ breadcrumb của trang trước), `@breadcrumb/brands/page.tsx`.
  - Build liệt kê thêm `/admin/[...catchAll]`; đã kiểm: `/admin/no-such-page` vẫn 404,
    `/admin/login` vẫn là trang đăng nhập.
  - **Trang admin mới về sau:** thêm `@breadcrumb/<route>/page.tsx` nếu muốn breadcrumb riêng.
- **Sửa ngoài danh sách phạm vi (task 02):** `DashboardShell.tsx` (prop breadcrumb, khoảng cách
  `mt-5` giữa các nhóm menu — trước đây chỉ có 1 nhóm), `components/icons/dashboard.tsx` (thêm
  `EditIcon`, `TrashIcon` lấy từ thiết kế).
- **Token mới:** `--toggle-off`, `--success-soft` (đã báo ở Bước 0), thêm `--tracking-table`
  (0.04em, chữ tiêu đề cột bảng trong thiết kế). `--backdrop` để Bước 6.
- **Bảng:** thẻ `<table>` thật (`table-fixed` + `<colgroup>` theo rem) thay cho lưới CSS của
  mockup, để giữ ngữ nghĩa bảng cho trình đọc màn hình. Cột: # / Image / Brand Name / Slug /
  Products / Status (công tắc + badge) / Action. Tên brand cũng là link tới trang chi tiết.
- **Phân trang:** theo mockup (ô 34px, căn phải), thêm dấu "…" khi > 7 trang; không có nút
  Trước/Sau (mockup không có). Ẩn khi chỉ có 1 trang.
- **Pill đếm ở header = tổng số brand** (`totalAll`, không theo bộ lọc).
- **`error.tsx` dùng `retry`** (Next 16.3: tải lại dữ liệu server) thay vì `reset` như task.md
  ghi (`reset` chỉ render lại, không chạy lại truy vấn) — giống task 02.
- **Nút Add Brand, Edit, Delete** đã có vị trí và kiểu dáng nhưng tạm "Coming soon"
  (`comingSoonProps`); nối chức năng ở Bước 6 (thêm/sửa) và Bước 8 (xóa). Nút View là link.
- **Mục "Brand Setup"** chỉ sáng trên `/admin/brands` (sidebar so khớp chính xác đường dẫn,
  quy ước task 02); trang chi tiết không làm sáng mục nào. Rail không có mục nào sáng (mục
  Products của rail vẫn "Coming soon").
- **`scripts/verify-brands.ts`** bắt đầu từ Bước 5 (phần HTTP), Bước 9 bổ sung phần service.

### 2026-09-29 — Bước 6: modal thêm/sửa
- **Form gửi bằng `onSubmit` + gọi action trực tiếp**, không `<form action>` / `useActionState`:
  React 19 tự reset form sau khi action chạy xong, sẽ làm mất dữ liệu và file đã chọn khi lỗi
  (task.md yêu cầu giữ). Kiểm tra trước bằng cùng schema Zod.
- **Modal chỉ render khi mở** (mount = `showModal()`, unmount = đóng): mỗi lần mở là form mới,
  mỗi dòng không giữ sẵn một `<dialog>` ẩn. Khi đang gửi không đóng được (Esc/X/nền).
- **Tái sử dụng** `FieldError`, `SubmitButton` (`components/auth/form-kit.tsx`) và
  `firstFieldErrors` (`lib/validation/auth.ts`) — chỉ import, không sửa.
- **File 0 byte = chưa chọn ảnh** (sửa lỗi phát hiện khi gọi action thật; xem progress.md).
- **Nút Cancel** thay cho "Reset" của mockup (trong modal, Cancel là hành động đúng); nút gửi
  "Add Brand" / "Save Changes".

### 2026-09-30 — Bước 7: trang chi tiết
- **Route group `(list)`:** `page.tsx` và `loading.tsx` của danh sách nằm trong `brands/(list)/`.
  `loading.tsx` đặt ở `brands/` sẽ bọc cả `[id]`, khiến id sai trả 200 (stream trước `notFound()`).
  URL không đổi; `error.tsx` giữ ở `brands/` để phủ cả hai trang. Trang chi tiết chưa có skeleton
  riêng (truy vấn một dòng, nhanh).
- **Thống kê:** "On sale" / "Not on sale" gọi `countProductsByBrand(id, "active" | "inactive")`;
  task Product cần định nghĩa lại hai nhãn này theo trạng thái sản phẩm.
- **Việc task Product phải nối lại:** `countProductsByBrand` (một chỗ), cột Products ở danh sách,
  3 ô thống kê và bảng sản phẩm ở trang chi tiết, chặn xóa khi còn sản phẩm.

### 2026-09-30 — Bước 8: luồng xóa
- **Một component `DeleteBrandButton`** cho cả danh sách và trang chi tiết; nhận `productCount`
  từ `countProductsByBrand` nên task Product không phải sửa gì ở UI.
- **Chặn xóa ở cả UI và server:** UI hiện nhánh "blocked" theo `productCount`; server
  (`deleteBrand`) vẫn từ chối nếu số sản phẩm > 0, nên UI cũ/lệch dữ liệu không xóa nhầm.
- **Brand đã INACTIVE mà còn sản phẩm:** không có "Deactivate instead", chỉ nhắc chuyển/xóa sản phẩm.
- **Task Product cần kiểm tra lại:** nhánh chặn xóa và "Deactivate instead" (hiện không kích hoạt được).

### 2026-09-30 — Việc task Product phải nối lại (tổng hợp)
1. `lib/brands/queries.ts` → `countProductsByBrand(brandId, status?)`: thay `return 0` bằng `_count`
   (gỡ `TODO(product task)`); định nghĩa "active"/"inactive" theo trạng thái sản phẩm.
2. Thêm quan hệ `products` vào `Brand` (và migration) khi tạo model Product.
3. Trang chi tiết `brands/[id]/page.tsx`: 3 ô thống kê (đang lấy từ hàm trên) và bảng sản phẩm
   (hiện là empty state "No products yet").
4. Cột Products ở danh sách (`BrandTable`) — gọi từ `listBrands`, đổi sang `_count` trong một truy vấn.
5. Kiểm tra lại: chặn xóa khi còn sản phẩm (service + `DeleteBrandButton` nhánh blocked) và nút
   "Deactivate instead"; thêm ca kiểm tra vào `scripts/verify-brands.ts`.

### 2026-09-30 — Rà soát /finish-task: khác biệt so với task.md
- Không có mục nào ❌. Ba khác biệt (⚠️) đều đã có quyết định trước đó: `page`/`loading` của danh sách
  nằm trong `brands/(list)/`; `error.tsx` dùng `retry`; sửa nhỏ ngoài phạm vi (shell task 02,
  `lib/actions/`, slot breadcrumb).

### 2026-09-30 — Sửa sau rà soát
- **`deleteBrandAction(id, from)`:** thêm tham số `from` ("list" mặc định | "detail"). Từ trang chi tiết
  không revalidate gì: trang sắp được thay bằng danh sách (trang động, luôn render mới); revalidate sẽ
  render lại trang của brand vừa xóa thành 404 trước khi chuyển hướng.
- **`error.tsx` riêng cho `[id]`**, thông báo theo ngữ cảnh.
- **`getBrandByIdCached`** ở file riêng (`lib/brands/cached.ts`) thay vì bọc `cache` trong `queries.ts`,
  để `verify-brands.ts` (Node thuần) vẫn import `queries.ts` như cũ.

### 2026-09-30 — Tổng kết: khác với task.md gốc
- **Cấu trúc route:** `page.tsx`/`loading.tsx` của danh sách ở `brands/(list)/` để id sai trả 404 thật;
  `error.tsx` ở `brands/` (danh sách) và `brands/[id]/` (chi tiết), đều dùng `retry` thay `reset`.
- **Menu và breadcrumb:** thêm nhóm "Organization" → "Brand Setup" vào `adminNav` (mục chưa tồn tại);
  breadcrumb theo parallel route `@breadcrumb`, sửa nhỏ `DashboardShell` của task 02.
- **Ngoài danh sách phạm vi:** `lib/actions/{result,require-admin}.ts`, `lib/brands/{list-url,cached}.ts`.
- **Giao diện:** primitive tự làm (Dialog, Switch, Select, Pagination), token mới `--toggle-off`,
  `--success-soft`, `--backdrop`, `--tracking-table`; bỏ Export/mã vạch; Cancel thay Reset; tên trùng
  tính cả khác dấu (Q4, MariaDB).
- **Action:** `deleteBrandAction(id, from)`; toggle nhận trạng thái đích.
- **Chờ task Product:** xem danh sách nối lại ở mục "Việc task Product phải nối lại" phía trên.
