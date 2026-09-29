# Tiến độ — 03-brands

Trạng thái chung: 🔄 · Cập nhật lần cuối: 2026-09-29

| Bước | Tên | Trạng thái | Ghi chú |
|------|-----|------------|---------|
| 0 | Kiểm tra (không sửa code) | ✅ | Q1–Q3 đã chốt (decisions.md) |
| 1 | Prisma model | 🔄 | Migration `20260929142159_add_brand` xong; Q4 = phân biệt dấu, còn migration đổi collation |
| 2 | Schema, truy vấn, service | ⬜ | |
| 3 | Lưu trữ ảnh | ⬜ | |
| 4 | Server actions | ⬜ | |
| 5 | Trang danh sách (`/admin/brands`) | ⬜ | |
| 6 | Modal thêm/sửa | ⬜ | |
| 7 | Trang chi tiết (`/admin/brands/[id]`) | ⬜ | |
| 8 | Luồng xóa | ⬜ | |
| 9 | Kiểm tra tổng | ⬜ | |

## Nhật ký
<!-- Mỗi bước thêm một mục:
### Bước N — <tên> (<ngày>)
- Đã làm:
- File tạo/sửa:
- Kết quả kiểm tra:
- Việc tôi cần làm thủ công:
-->

### Bước 0 — Kiểm tra (2026-09-29)
- Đã làm: rà soát dự án và 3 thiết kế mẫu, không sửa code. Nhánh `feat/03-brands` tạo từ
  `feat/02-role-dashboards` (c379a3f).
- File tạo/sửa: `docs/tasks/README.md` (03 → 🔄), file này.

**Thiết kế**
| File trong task.md | File thật | Dùng cho |
|---|---|---|
| `VendorProductList.dc.html` | khớp tên | header (icon + h1 + pill đếm), ô tìm kiếm có nút Search, bảng lưới, công tắc, nút thao tác 32px, empty state |
| `VendorAddProduct.dc.html` | khớp tên | nhãn + `*`, input 46px, khối tải ảnh (viền đứt, "Click To Upload Or Drag And Drop"), hàng công tắc "Status", nút Reset/Submit |
| `AdminProductList.dc.html` | khớp tên | khung admin, phân trang (ô 34px, trang hiện tại iris), error state "Couldn't load … / Try again", bảng `overflow-x:auto` |
| Có chữ "brand" trong tên | **không có** | — |

- Thiết kế đặt mục **"Brand Setup"** trong sidebar "Catalog" → nhóm **"Organization"**
  (cùng Category Setup, Product Attribute Setup, Product Gallery), thuộc khu rail **Products**.
- Suy ra từ thiết kế (không có mẫu riêng):
  - Không có bộ chọn số dòng/trang, không có dropdown lọc trạng thái (chỉ có nút "Filter")
    → dùng `<select>` theo kiểu select 46px của form mẫu.
  - Bỏ nút "Export" (task loại trừ import/export) và nút mã vạch (màu cam) ở cột thao tác;
    giữ View (xanh lá), Edit (iris), Delete (đỏ).
  - Chú thích khối ảnh đổi thành "JPG, PNG, WEBP · Max 2MB".
- Token còn thiếu, sẽ thêm vào `app/globals.css`:
  - `--toggle-off` `#E4E2E9` (DESIGN_SYSTEM §Toggle: công tắc tắt)
  - `--success-soft` `#F1FBF6` (nền nút View)
  - `--backdrop` `rgba(20,18,31,.55)` (DESIGN_SYSTEM: nền mờ sau modal)
  - Còn lại đã có: `field`, `bg-subtle`, `track`, `line-soft`, `control-border`, `iris-50`,
    `success-bg`, `error-bg`, `error-line`, `shadow-xl`, `radius-2xl`.

**Dự án**
- Task 02 ✅. Khung admin: `app/(admin)/admin/(protected)/layout.tsx` → `DashboardShell`
  (`adminNav`). Brands đặt trong `(protected)/brands/` sẽ có khung sẵn.
- `lib/dashboard/nav.ts`: **chưa có mục Brands** (task.md ghi "bật enabled: true" — phải
  thêm mới). `adminNav.groups` chỉ có nhóm "Overview".
- **Breadcrumb của shell cố định "Home / Dashboard"** trong `DashboardShell.tsx` — không có
  cách để page đặt "Dashboard / Brands / {tên}" mà không sửa component của task 02.
- shadcn/ui: **chưa cài** (không có `components.json`, không có `components/ui/`).
  Có thể dùng lại: `EmptyState` (variant page/inline, tone error), `DashboardError`,
  `StatusBadge` (không có tông muted: "inactive" rơi vào tông accent), `SectionCard`,
  `comingSoonProps`, `form-kit` (`FieldError`, `TextField`, `SubmitButton` — gắn với form auth).
- Model Product: **không có** (schema chỉ có `User`, `Vendor`).
- `lib/slug.ts`: `slugify(input: string): string` dùng lại được. Lưu ý: chuỗi không còn ký tự
  a-z0-9 thì trả `"store"`. `uniqueVendorSlug` chỉ dành cho Vendor → brand cần hàm riêng
  trong `lib/brands/` (không sửa `lib/slug.ts`).
- Next **16.3.6**. Khóa giới hạn body: `experimental.serverActions.bodySizeLimit` (tài liệu
  `node_modules/next/dist/docs/.../serverActions.md`); tính cả overhead multipart → đặt `"3mb"`.
  Proxy có giới hạn riêng `experimental.proxyClientMaxBodySize`, mặc định 10 MB → không cần sửa.
- `proxy.ts` matcher: `/dashboard`, `/vendor`, `/admin`, `/login`, `/register` →
  **không** ảnh hưởng `/media/*`.
- `.gitignore` chưa có `storage/`. `crypto.randomUUID()` có sẵn, không cần gói `uuid`.
- MySQL: nếu collation là `*_ai_ci` (mặc định MySQL 8) thì tên còn **không phân biệt dấu**:
  "Café" và "Cafe" bị coi là trùng. Sẽ xác nhận collation ở Bước 1.

- Kết quả kiểm tra: không sửa code, không chạy lệnh ghi.
- Việc tôi cần làm thủ công: đã chọn Q1–Q3 (tự làm primitive; sửa nhỏ shell cho breadcrumb;
  nhóm Organization → "Brand Setup"). Chi tiết ở `decisions.md`.

### Bước 1 — Prisma model (2026-09-29)
- Đã làm: thêm enum `BrandStatus` và model `Brand` đúng như task.md (kèm comment ngắn),
  chạy `npx prisma migrate dev --name add_brand` (tự chạy generate).
- File tạo/sửa: `prisma/schema.prisma`, `prisma/migrations/20260929142159_add_brand/migration.sql`.
- Kết quả kiểm tra:
  - Migration tạo và áp dụng thành công; Prisma Client v6.19.3 được sinh lại.
  - `npx prisma migrate status`: "2 migrations found … Database schema is up to date!".
  - Bảng `Brand`: `name` VARCHAR(60) UNIQUE, `slug` VARCHAR(80) UNIQUE, `image` VARCHAR(191)
    NULL, `status` ENUM mặc định ACTIVE.
  - Collation của `name`/`slug`: `utf8mb4_unicode_ci`. Truy vấn thật trên DB:
    `'Sony' = 'sony'` → 1, **`'Café' = 'Cafe'` → 1** (không phân biệt dấu). Xem Q4.
- Q4 đã chốt: phân biệt dấu (xem decisions.md). Còn làm: migration mới đổi collation cột
  `name` sang `utf8mb4_0900_as_ci` (không reset DB), sau khi xác nhận server là MySQL 8+.

## Bước tiếp theo
Bước 1 (tiếp) — xác nhận phiên bản MySQL, thêm migration `brand_name_accent_sensitive`,
kiểm tra lại `'Sony' = 'sony'` → 1 và `'Café' = 'Cafe'` → 0. Sau đó Bước 2.
