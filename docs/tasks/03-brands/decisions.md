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
- **Danh sách:** `listBrands` trả thêm `totalAll` (bỏ qua bộ lọc) để phân biệt "chưa có brand"
  với "lọc không ra kết quả"; pill đếm ở header dùng `totalAll`. Sắp xếp mới nhất trước.
