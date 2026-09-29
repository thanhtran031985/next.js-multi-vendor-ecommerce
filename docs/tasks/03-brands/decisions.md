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

### 2026-09-29 — Q4: tên brand phân biệt dấu, không phân biệt hoa/thường
- **Bối cảnh:** bảng `Brand` được tạo với collation `utf8mb4_unicode_ci`. Truy vấn thật trên DB:
  `'Sony' = 'sony'` → 1 (đúng ý task.md), nhưng `'Café' = 'Cafe'` → 1: tên chỉ khác dấu
  cũng bị coi là trùng. task.md không nói tới trường hợp này.
- **Quyết định:** chủ dự án chọn phân biệt dấu. Cột `name` đổi sang `utf8mb4_0900_as_ci`
  (accent-sensitive, case-insensitive) bằng một migration mới chỉ chứa `ALTER TABLE … MODIFY`.
  Không sửa migration `add_brand` và không reset DB.
- **Lý do:** Prisma không khai báo được collation cho từng cột, nên đổi bằng SQL tay. Migration
  mới giữ nguyên dữ liệu dev; Prisma không theo dõi collation nên không báo lệch schema.
- **Ảnh hưởng:** "Sony"/"sony" vẫn trùng; "Café"/"Cafe" là hai brand khác nhau. Collation
  `*_0900_*` cần MySQL 8+ (sẽ xác nhận trước khi chạy). `verify-brands.ts` thêm ca khác dấu.
