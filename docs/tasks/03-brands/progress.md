# Tiến độ — 03-brands

Trạng thái chung: ✅ · Cập nhật lần cuối: 2026-09-30

| Bước | Tên | Trạng thái | Ghi chú |
|------|-----|------------|---------|
| 0 | Kiểm tra (không sửa code) | ✅ | Q1–Q3 đã chốt (decisions.md) |
| 1 | Prisma model | ✅ | Migration `20260929142159_add_brand`; Q4: giữ `unicode_ci` (khác dấu cũng trùng) |
| 2 | Schema, truy vấn, service | ✅ | `lib/storage/images.ts` làm sớm ở bước này (service cần) |
| 3 | Lưu trữ ảnh | ✅ | Route `/media/brands/[file]`, `bodySizeLimit: "3mb"`, `/storage/` ignored |
| 4 | Server actions | ✅ | 4 action; helper ở `lib/actions/` |
| 5 | Trang danh sách (`/admin/brands`) | ✅ | Build OK; `verify-brands.ts` 22/22 |
| 6 | Modal thêm/sửa | ✅ | Gọi action thật qua HTTP 18/18; sửa lỗi "sửa không ảnh" |
| 7 | Trang chi tiết (`/admin/brands/[id]`) | ✅ | Danh sách chuyển vào route group `(list)` để id sai trả 404 thật |
| 8 | Luồng xóa | ✅ | `DeleteBrandButton` dùng ở danh sách và trang chi tiết |
| 9 | Kiểm tra tổng | ✅ | Tự động đạt; checklist thủ công chờ chủ dự án |

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
- Q4: server là MariaDB 10.4.32, không có collation vừa phân biệt dấu vừa không phân biệt
  hoa/thường (đã thử 4 collation trên DB). Chủ dự án chọn giữ `utf8mb4_unicode_ci` → không
  sửa schema/migration. Chi tiết ở decisions.md.

### Bước 2 — Schema, truy vấn, service (2026-09-29)
- Đã làm:
  - `lib/brands/schema.ts`: `createBrandSchema` / `updateBrandSchema` (tên trim 2–60, ảnh
    `z.file()` ≤ 2 MB + JPG/PNG/WEBP, bắt buộc khi tạo, tùy chọn khi sửa; input file rỗng =
    chưa chọn ảnh), `brandStatusSchema`, `brandIdSchema`, `brandInputFromForm` (công tắc
    không tick = INACTIVE), `parseBrandListParams` (q/status/page/pageSize, sai → mặc định).
    Không import Prisma (client dùng được).
  - `lib/brands/queries.ts`: `listBrands` (count → kẹp page về trang cuối → findMany trong
    cùng một interactive `$transaction`; trả `total` theo bộ lọc và `totalAll` để phân biệt
    hai kiểu rỗng), `getBrandById`, `countProductsByBrand` (luôn 0, `// TODO(product task)`).
  - `lib/brands/service.ts`: `createBrand`, `updateBrand`, `deleteBrand`, `setBrandStatus`
    theo đúng thứ tự file ↔ DB của task.md; slug sinh khi tạo (base, -2, -3…, thử lại khi
    P2002 trên slug), giữ nguyên khi sửa; P2002 trên name → "A brand with this name already
    exists"; xóa bị chặn khi `countProductsByBrand > 0`.
  - `lib/storage/images.ts` (làm sớm, xem decisions.md): magic bytes, `saveImage`,
    `deleteImage`, tên `<uuid>.<ext>`, `// TODO(production): chuyển sang S3/R2`.
- File tạo/sửa: `lib/brands/schema.ts`, `lib/brands/queries.ts`, `lib/brands/service.ts`,
  `lib/storage/images.ts`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`: không lỗi. `npx eslint lib/brands lib/storage`: không lỗi.
  - Chạy thử schema (script nháp, không ghi DB/đĩa): tham số URL sai → mặc định
    (`page=abc`→1, `pageSize=13`→10, `status=nope`→bỏ); tạo không ảnh → "Brand image is
    required"; ảnh 2 MB + 1 byte → "Image must be 2 MB or smaller"; SVG → "Use a JPG, PNG or
    WEBP image"; sửa không ảnh → hợp lệ; magic bytes JPG/PNG/WEBP nhận đúng, PDF → null.
  - Service chưa chạy với DB/đĩa thật: kiểm ở Bước 3 (lưu ảnh) và `verify-brands.ts` (Bước 9).
- Việc tôi cần làm thủ công: không có.

### Bước 3 — Lưu trữ ảnh (2026-09-29)
- Đã làm:
  - `app/media/brands/[file]/route.ts`: chỉ nhận tên khớp `^[0-9a-f-]{36}\.(jpg|png|webp)$`
    (qua `storedImagePath`), sai tên hoặc không có file → 404; Content-Type theo đuôi,
    `Cache-Control: public, max-age=31536000, immutable`, thêm `X-Content-Type-Options: nosniff`.
  - `next.config.ts`: `experimental.serverActions.bodySizeLimit: "3mb"` (khóa đúng cho Next
    16.3.6, theo `node_modules/next/dist/docs/.../serverActions.md`).
  - `.gitignore`: thêm `/storage/`.
  - (`lib/storage/images.ts` đã làm ở Bước 2.)
- File tạo/sửa: `app/media/brands/[file]/route.ts`, `next.config.ts`, `.gitignore`.
- Kết quả kiểm tra (`npm run dev`, script nháp gọi `saveImage`/`deleteImage`):
  - `npx tsc --noEmit`, eslint các file mới: không lỗi.
  - Lưu PNG 1×1 gửi kèm tên `photo.jpg` + MIME `image/jpeg` → lưu thành
    `<uuid>.png` (đuôi theo magic bytes, không theo client).
  - GET qua route → **200**, `content-type: image/png`, `cache-control: public,
    max-age=31536000, immutable`, `content-length: 68`, nội dung trùng khớp byte với file gốc.
  - `/media/brands/..%2F..%2Fpackage.json` → **404**; `/media/brands/../../package.json`
    (`--path-as-is`) → **404**; `package.json`, uuid không tồn tại, tên viết HOA → **404**;
    `..%2F..%2F..%2Fpackage.json` → **400** (Next từ chối trước khi vào route; vẫn không lộ file).
  - `deleteImage` → file mất, GET lại → 404; thư mục `storage/uploads/brands/` trống.
    `git check-ignore` xác nhận `storage/` bị bỏ qua.
  - Tình cờ kiểm được: Git Bash đổi tham số thành `C:/Program Files/Git/media/...`,
    `deleteImage` bỏ qua đường dẫn lạ đó và không xóa gì (đúng thiết kế).
  - Chưa kiểm được: giới hạn 3 MB của server action (cần action thật, kiểm ở Bước 6/9).
- Việc tôi cần làm thủ công: không có.

### Bước 4 — Server actions (2026-09-29)
- Đã làm:
  - `app/actions/brands.ts`: `createBrandAction(formData)`, `updateBrandAction(id, formData)`,
    `deleteBrandAction(id)`, `toggleBrandStatusAction(id, status)`. Mỗi action:
    `requireAdminAction()` → Zod (`brandIdSchema`, `createBrandSchema`/`updateBrandSchema`,
    `brandStatusSchema`) → service → `revalidatePath("/admin/brands")` (+ trang chi tiết khi
    sửa/xóa/đổi trạng thái) → `ActionResult`. Lỗi của service có `field` → `fieldErrors`;
    lỗi không lường trước → `console.error` + "Something went wrong. Please try again.".
  - `deleteBrandAction`: service chặn khi `countProductsByBrand > 0`, trả lỗi nêu số sản phẩm
    và gợi ý chuyển sang Inactive.
  - `lib/actions/result.ts`: kiểu `ActionResult<T>` đúng như task.md + `ok`/`fail`/
    `invalidInput` (`z.flattenError`)/`unexpected`.
  - `lib/actions/require-admin.ts`: `requireAdminAction()` dùng `getVerifiedSession()` (đọc
    DB); không phải ADMIN hoặc session cũ → `{ success: false, error: "Unauthorized" }`,
    không redirect.
- File tạo/sửa: `app/actions/brands.ts`, `lib/actions/result.ts`, `lib/actions/require-admin.ts`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`: không lỗi. eslint 3 file mới: không lỗi.
  - Grep: 4 action được export, 4 lời gọi `await requireAdminAction()`; câu lệnh đầu tiên
    trong thân cả 4 action là `const admin = await requireAdminAction();`.
  - Chưa chạy action qua HTTP (cần form ở Bước 6); các nhánh Unauthorized/validate/service
    sẽ được kiểm ở Bước 6 và Bước 9.
- Việc tôi cần làm thủ công: không có.

### Bước 5 — Trang danh sách (2026-09-29)
- Đã làm:
  - Trang `app/(admin)/admin/(protected)/brands/page.tsx` (+ `loading.tsx` skeleton,
    `error.tsx` "Couldn't load brands" / Try again): header (icon, "Brands", pill tổng số),
    thanh công cụ, bảng, phân trang; 2 kiểu rỗng ("No brands yet" + Add Brand; "No brands
    match your filters" + Clear filters). `requireRole("ADMIN")` trong page.
  - `components/brands/`: `BrandToolbar` (client: tìm kiếm debounce 300 ms + nút Search,
    lọc trạng thái, số dòng/trang 10/20/50, đổi gì cũng về trang 1, URL là nguồn trạng thái
    duy nhất), `BrandTable` (bảng + `BrandThumb`), `BrandStatusToggle` (`useOptimistic`, lỗi →
    hoàn tác + toast), `BrandStatusBadge`.
  - `components/ui/`: `Switch`, `Select`, `Pagination`. `lib/brands/list-url.ts`.
  - Breadcrumb qua slot `@breadcrumb` ("Dashboard / Brands"); nhóm "Organization" →
    "Brand Setup" trong `adminNav`. Chi tiết và các file task 02 bị sửa: decisions.md.
  - Token: `--toggle-off`, `--success-soft`, `--tracking-table`.
  - `scripts/verify-brands.ts` (phần HTTP).
- File tạo/sửa: `app/(admin)/admin/(protected)/layout.tsx`, `…/@breadcrumb/{default.tsx,
  [...catchAll]/page.tsx, brands/page.tsx}`, `…/brands/{page,loading,error}.tsx`,
  `components/brands/*`, `components/ui/*`, `components/dashboard/{Breadcrumb,DashboardShell}.tsx`,
  `components/icons/dashboard.tsx`, `lib/brands/list-url.ts`, `lib/dashboard/nav.ts`,
  `app/globals.css`, `scripts/verify-brands.ts`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`, `npm run lint`: không lỗi. `npm run build`: thành công (có route
    `/admin/brands`, `/admin/[...catchAll]`).
  - `npx tsx --env-file=.env scripts/verify-brands.ts` (dev server): 21/22 PASS —
    khách → `/admin/login`, khách hàng → `/dashboard`, vendor → `/vendor/dashboard`;
    "No brands yet" khi DB rỗng; admin 200, header + pill tổng, breadcrumb Dashboard / Brands,
    10 dòng mặc định, `?pageSize=20` → 20, `?page=999` → 200 và hiện trang cuối (3),
    `?pageSize=abc&page=-3&status=nope` → 200, trang 1, 10 dòng; lọc INACTIVE → 8; tìm kiếm
    không phân biệt hoa/thường → 1; không khớp → thông báo + Clear filters; `/admin/dashboard`
    vẫn 200 với "Home / Dashboard"; `/admin/no-such-page` → 404; `/admin/login` vẫn 200.
    Dọn sạch 23 brand + 3 user thử.
  - Lần đầu 1 FAIL do regex của script (Next `<Link>` đặt `href` sau `aria-current`), không
    phải lỗi giao diện. Sửa regex, chạy lại: **22/22 PASS** ("Brand Setup" là link hiện tại
    trên `/admin/brands`), dọn sạch 23 brand + 3 user thử.
- Việc tôi cần làm thủ công: không có.

### Bước 6 — Modal thêm/sửa (2026-09-29)
- Đã làm:
  - `components/ui/Dialog.tsx`: `<dialog>` + `showModal()` (focus bị giữ trong modal, Esc /
    nút X / bấm nền để đóng, khóa đóng khi đang gửi), mount = mở, unmount = đóng, trả focus về
    nút đã mở; focus vào ô có `data-autofocus`. Token `--backdrop`; `html:has(dialog[open]:modal)`
    khóa cuộn trang.
  - `components/brands/BrandFormDialog.tsx`: MỘT component cho tạo và sửa (`brand` khi sửa).
    Trường: tên (46px, `maxLength` 60), ảnh (bấm hoặc kéo-thả, xem trước bằng
    `URL.createObjectURL`, thu hồi khi đổi/đóng, nút "Remove" chỉ bỏ ảnh vừa chọn; khi sửa hiện
    ảnh hiện tại + "Leave empty to keep the current image"), trạng thái (Switch). Kiểm tra trước
    bằng cùng schema Zod; lỗi dưới từng trường; nút gửi có spinner, bị vô hiệu khi đang gửi.
    Gửi bằng `onSubmit` gọi action trực tiếp (không dùng `<form action>`, vì React tự reset form
    sau action) → lỗi thì modal giữ nguyên dữ liệu, kể cả file. Thành công → toast, đóng, danh
    sách tự cập nhật (revalidatePath).
  - `components/brands/BrandFormTriggers.tsx`: `AddBrandButton` (thanh công cụ + empty state),
    `EditBrandButton` (nút 32px trên dòng; bản "button" cho trang chi tiết ở Bước 7).
    `components/brands/styles.ts`: class nút dùng chung.
  - **Sửa lỗi** trong `lib/brands/schema.ts`: input file trống gửi file 0 byte mà tên sau khi
    server giải mã không phải "" → sửa brand không kèm ảnh bị báo "Use a JPG, PNG or WEBP image".
    Nay mọi file 0 byte = chưa chọn ảnh.
- File tạo/sửa: `components/ui/Dialog.tsx`, `components/brands/{BrandFormDialog,
  BrandFormTriggers,styles}.tsx|ts`, `components/brands/BrandTable.tsx`,
  `app/(admin)/admin/(protected)/brands/page.tsx`, `lib/brands/schema.ts`, `app/globals.css`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi. Grep file mới: không còn
    hex/`rgba(`/px (chỉ còn trong comment).
  - Gọi 3 server action thật qua HTTP trên dev server (script nháp; ID lấy từ manifest,
    tham số mã hóa như `encodeReply` của React): **18/18 PASS**
    - khách hàng → proxy chuyển hướng; admin bị hạ role trong DB (token vẫn ADMIN) →
      `requireAdminAction` trả "Unauthorized", không tạo gì, không ghi file;
    - tạo → tên được trim, slug `brands-verify-alpha`, ảnh `/media/brands/<uuid>.png`, GET 200;
    - trùng tên khác hoa/thường + dấu ("brands verify ÁLPHA") → lỗi ở trường name, không để lại file;
    - PDF đổi tên `.jpg`, MIME `image/jpeg` → "Use a JPG, PNG or WEBP image";
    - ảnh 2,5 MB vào tới action (giới hạn body > 1 MB mặc định) → "Image must be 2 MB or smaller";
      body 3,5 MB → bị từ chối trước action (≥ 400);
    - sửa không ảnh → slug giữ nguyên, ảnh giữ nguyên, công tắc không tick → INACTIVE;
    - sửa có ảnh mới → file cũ bị xóa, file mới tồn tại; toggle → INACTIVE lưu bền; toggle
      trạng thái sai → lỗi validate. Dọn sạch: 0 file còn lại.
  - Chưa kiểm được bằng máy (không có trình duyệt tự động): tương tác trong modal (focus, Esc,
    kéo-thả, xem trước, giữ dữ liệu khi lỗi) → checklist thủ công.
- Việc tôi cần làm thủ công (có thể làm ngay, `npm run dev`): mở `/admin/brands` → Add Brand →
  thử tên trùng và ảnh > 2 MB (modal giữ dữ liệu), thêm thành công; Edit một brand, đổi ảnh.
### Bước 7 — Trang chi tiết (2026-09-30)
- Đã làm:
  - `brands/[id]/page.tsx`: `requireRole("ADMIN")`, `getBrandById` → `notFound()`. Thẻ đầu trang
    (ảnh 96px, tên, badge trạng thái, slug, ngày tạo, nút Edit mở `BrandFormDialog`, nút Delete);
    3 ô thống kê (Total products / On sale / Not on sale) qua `countProductsByBrand`; khối
    Products với empty state "No products yet". Title trang theo tên brand.
  - Breadcrumb "Dashboard / Brands / {tên}" qua slot `@breadcrumb/brands/[id]/page.tsx`.
  - Nút Delete tạm "Coming soon" (nối ở Bước 8).
  - **Sửa cấu trúc:** `page.tsx` + `loading.tsx` của danh sách chuyển vào route group
    `brands/(list)/` (URL không đổi). Lý do: `loading.tsx` ở `brands/` bọc cả `[id]`, response
    được stream với 200 trước khi `notFound()` chạy → id sai trả 200. `error.tsx` vẫn ở `brands/`.
  - `scripts/verify-brands.ts`: thêm phần trang chi tiết (chuyển hướng theo role, 200, nội dung,
    breadcrumb, id không tồn tại/sai định dạng → 404).
- File tạo/sửa: `app/(admin)/admin/(protected)/brands/[id]/page.tsx`,
  `…/@breadcrumb/brands/[id]/page.tsx`, `…/brands/(list)/{page,loading}.tsx` (git mv),
  `scripts/verify-brands.ts`.
- Kết quả kiểm tra:
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi (build có `/admin/brands/[id]`).
    Grep hex/`rgba(`/px trong file mới: không có.
  - `verify-brands.ts` (dev server): tất cả PASS, gồm phần list (22) + detail: khách → login,
    khách hàng → `/dashboard`, vendor → `/vendor/dashboard`, admin id đúng → 200 (tên, slug,
    badge Inactive, breadcrumb, thống kê, "No products yet", nút Edit), id không tồn tại → 404,
    id sai định dạng → 404. Dọn sạch dữ liệu thử.
  - Lưu ý môi trường: MySQL (XAMPP) đang tắt nên tôi khởi động `mysqld` để chạy kiểm tra.
- Việc tôi cần làm thủ công: mở một brand từ danh sách, thử nút Edit trong trang chi tiết.
### Bước 8 — Luồng xóa (2026-09-30)
- Đã làm: `components/brands/DeleteBrandButton.tsx` (client) — nút Delete + modal xác nhận
  "Delete “{tên}”?" (dùng `Dialog` size sm). Hai kiểu nút: icon 32px (danh sách), nút viền
  (trang chi tiết, `redirectToList` → về `/admin/brands` sau khi xóa).
  - Được xóa: `deleteBrandAction` → toast, đóng modal (danh sách tự bỏ dòng nhờ revalidate).
  - Còn sản phẩm (`productCount > 0`): chặn, giải thích lý do, nút "Deactivate instead"
    (gọi `toggleBrandStatusAction(id, "INACTIVE")`; brand đã Inactive thì chỉ hiện Cancel và lời nhắc).
  - Lỗi từ action/mạng: hiện trong modal, modal giữ nguyên; đang gửi thì không đóng được.
  - Thay hai nút "Coming soon" ở `BrandTable` và trang chi tiết (xóa `PendingAction`).
- File tạo/sửa: `components/brands/DeleteBrandButton.tsx`, `components/brands/BrandTable.tsx`,
  `app/(admin)/admin/(protected)/brands/[id]/page.tsx`.
- Kết quả kiểm tra: `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi; grep hex/px: không có.
  Action xóa + service xóa (bản ghi và file) sẽ được chạy thật trong `verify-brands.ts` ở Bước 9;
  nhánh chặn khi còn sản phẩm chưa kích hoạt được (chưa có Product).
- Việc tôi cần làm thủ công: xóa thử một brand ở danh sách và ở trang chi tiết (về danh sách).
### Bước 9 — Kiểm tra tổng (2026-09-30)
- Đã làm: bổ sung phần service + storage vào `scripts/verify-brands.ts` (gọi schema, service,
  storage, `listBrands` trực tiếp; dọn dữ liệu và file sau khi chạy). Chạy toàn bộ kiểm tra.
- File tạo/sửa: `scripts/verify-brands.ts`.
- Kết quả kiểm tra (đã chạy, dev server + MySQL):
  - `npx tsc --noEmit`: không lỗi. `npm run lint`: không lỗi. `npm run build`: thành công
    (có `/admin/brands`, `/admin/brands/[id]`, `/media/brands/[file]`).
  - `verify-auth.ts`: ALL CHECKS PASSED. `verify-dashboards.ts` (task 02): ALL CHECKS PASSED.
  - `verify-brands.ts`: **All checks passed** (HTTP: list 22, detail 10; service/storage 19):
    - tạo có ảnh → có bản ghi, file `<uuid>.png` tồn tại;
    - trùng tên (cùng tên / khác hoa-thường / khác dấu) → "A brand with this name already exists",
      không để lại file; ảnh 5 MB → bị schema từ chối; PDF đổi đuôi `.jpg` (MIME image/jpeg) → bị
      magic bytes từ chối, không file, không bản ghi;
    - hai tên sinh cùng slug → `-2`; sửa tên → slug giữ nguyên;
    - sửa không ảnh → giữ ảnh (file còn); sửa có ảnh mới → file cũ bị xóa, file mới có;
    - đổi trạng thái → lưu bền; `listBrands`: tìm kiếm, lọc trạng thái, phân trang (12 dòng →
      10 + 2, không trùng, page vượt → trang cuối);
    - xóa → bản ghi và file mất; xóa lần hai → báo "no longer exists";
    - khách / khách hàng / vendor vào `/admin/brands` và `/admin/brands/<id>` → bị chuyển đúng;
      id không tồn tại / sai định dạng → 404. Cleanup: 0 brand, 0 file còn lại.
    - Dòng `prisma:error … No record was found for a delete` trong log là do ca "xóa lần hai"
      cố ý; service bắt P2025 và trả lỗi thân thiện.
  - Grep: không có hex/`rgba(` trong file mới; chỉ còn `sizes="46px"/"96px"` là thuộc tính HTML
    của `next/image` (không phải style) ở `BrandTable.tsx`. 4/4 action export đều gọi
    `await requireAdminAction()` ngay đầu.
- Việc tôi cần làm thủ công — checklist (`npm run dev`, đăng nhập admin):
  - [x] So sánh trang danh sách và modal với `VendorProductList` / `VendorAddProduct`: bố cục, khoảng cách, màu.
  - [x] Thêm brand có ảnh; thêm trùng tên; thử ảnh > 2 MB (báo lỗi, modal giữ dữ liệu).
  - [x] Sửa tên và thay ảnh; ảnh mới hiện đúng.
  - [x] Bật/tắt trạng thái trên danh sách; F5 vẫn giữ.
  - [x] Tìm kiếm, lọc, đổi số dòng/trang, chuyển trang; URL phản ánh bộ lọc.
  - [x] Xóa brand (danh sách và trang chi tiết → về danh sách); mở id không tồn tại → 404.
  - [x] Xóa hết brand → empty state; lọc không ra kết quả → thông báo riêng.
  - [x] Mục "Brand Setup" trong sidebar admin hoạt động.
  - [x] Modal: Esc đóng, focus giữ trong modal, kéo-thả ảnh, xem trước ảnh.
- Chưa kiểm tra được (chờ task Product): cột số sản phẩm, thống kê trang chi tiết, bảng sản phẩm,
  chặn xóa khi còn sản phẩm + "Deactivate instead". Danh sách việc nối lại: cuối decisions.md.

### Rà soát theo /finish-task (2026-09-30)
Đánh giá từng mục "Quyết định kiến trúc" của task.md so với code hiện tại (đã merge vào `main`).

| Mục | Đánh giá | Bằng chứng |
|-----|----------|------------|
| Tổ chức code (`lib/brands/{schema,queries,service}`, `lib/storage/images.ts`, `components/brands/`) | ✅ | đúng vị trí; `queries.ts` không phải server action |
| `app/actions/brands.ts` mỏng: ADMIN → Zod → service → revalidate → ActionResult | ✅ | `requireAdminAction()` ở dòng 32/48/70/95 (đầu thân mỗi action); `safeParse` dòng 35/51/53/73/98 |
| Kiểu `ActionResult`, không throw thô ra client | ✅ | `lib/actions/result.ts`; `unexpected()` log + thông báo chung |
| Phân quyền: action không redirect; page gọi `requireRole("ADMIN")`; không sửa `lib/auth/*`, `proxy.ts`, `auth.ts` | ✅ | `(list)/page.tsx:25`, `[id]/page.tsx:26`; git diff không đụng file auth |
| Trang trong `(protected)/brands/` gồm `page`, `loading`, `error`, `[id]/page` | ⚠️ | `page`/`loading` nằm ở `brands/(list)/` (id sai mới trả 404 thật) — decisions 2026-09-30 |
| Phụ thuộc Product: không model/quan hệ; `countProductsByBrand` = 0 + TODO | ✅ | `lib/brands/queries.ts:43`; danh sách nối lại cuối decisions.md |
| Slug: sinh khi tạo, `-2`/`-3`, giữ nguyên khi sửa; P2002 name/slug | ✅ | `service.ts`; `verify-brands.ts` ca slug/rename |
| Ảnh: magic bytes, ≤ 2 MB, uuid, `storage/` ngoài `public/`, route `/media`, `bodySizeLimit`, nhất quán file ↔ DB | ✅ | `lib/storage/images.ts`, `app/media/brands/[file]/route.ts`, `next.config.ts` (3mb), `.gitignore:24`; `verify-brands.ts` |
| `proxy.ts` không chặn `/media/*` | ✅ | matcher chỉ `/dashboard,/vendor,/admin,/login,/register` |
| Danh sách: `searchParams` là trạng thái duy nhất, phân trang server, debounce 300 ms, `useOptimistic`, 4 trạng thái | ⚠️ | đủ; `error.tsx` dùng `retry` thay `reset` (decisions Bước 5) |
| shadcn/ui: không cài, tự làm primitive, dùng `<dialog>` | ✅ | `components/ui/{Dialog,Switch,Select,Pagination}.tsx` (Q1) |
| Chỉ dùng design token | ✅ | grep hex/`rgba(`: không có; `px` chỉ trong `sizes=` của `next/image` (`BrandTable.tsx:96`, `BrandFormDialog.tsx:182`) |
| Zod cho mọi ghi DB; không Prisma/secret trong client component | ✅ | client chỉ import `app/actions/brands`, `lib/brands/schema`, `lib/brands/list-url` |
| Bước 1–9 (kể cả nút Delete, Deactivate instead, mục nav) | ✅ | progress bước 1–9; nav `lib/dashboard/nav.ts:94` |
| Sửa ngoài phạm vi task.md (task 02, `lib/actions/`, breadcrumb slot) | ⚠️ | đã ghi decisions Bước 4, 5 |

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi (chạy lại 2026-09-30).
- `npx prisma migrate status` không chạy lại được (MySQL đang tắt); lần chạy ở Bước 1: "up to date".

### Sửa sau rà soát (2026-09-30)
- Đã làm (3 mục đã chọn):
  1. Xóa brand ở trang chi tiết không còn revalidate chính trang đó (tránh nháy 404 trước khi về danh sách):
     `deleteBrandAction(id, from: "list" | "detail" = "list")`, `from` được Zod kiểm tra; ở "list" vẫn
     `revalidatePath("/admin/brands")`. `DeleteBrandButton` truyền `"detail"` khi `redirectToList`.
  2. Thêm `brands/[id]/error.tsx` ("Couldn't load this brand", dùng `retry`); trang chi tiết không còn
     hiện "Couldn't load brands".
  3. `lib/brands/cached.ts`: `getBrandByIdCached = cache(getBrandById)`; metadata, breadcrumb slot và page
     dùng chung một truy vấn mỗi request.
- File tạo/sửa: `app/actions/brands.ts`, `components/brands/DeleteBrandButton.tsx`,
  `lib/brands/cached.ts` (mới), `brands/[id]/{page,error}.tsx`, `@breadcrumb/brands/[id]/page.tsx`.
- Kết quả kiểm tra: `tsc`, `eslint`, `npm run build` không lỗi; `npx prisma migrate status`: "Database
  schema is up to date"; `verify-brands.ts`: All checks passed (dọn sạch dữ liệu).
- Chưa kiểm được bằng máy: hết nháy 404 khi xóa ở trang chi tiết (hiện tượng ở trình duyệt) → mục thủ công.

### Giai đoạn C — Kiểm tra sau rà soát (2026-09-30)
- Tự động (đã chạy sau các sửa): `npx tsc --noEmit`, `npm run lint`, `npm run build` không lỗi;
  `npx tsx --env-file=.env scripts/verify-brands.ts`: All checks passed (dọn sạch dữ liệu test).
- Checklist thủ công cho các mục vừa sửa (chuẩn bị: bật MySQL, `npm run dev`, đăng nhập admin;
  chưa có admin thì `npx prisma db seed`):
  - [x] Trang chi tiết → Delete → xác nhận: chuyển về `/admin/brands` KHÔNG nháy trang 404, có toast.
  - [x] Xóa từ danh sách: dòng biến mất ngay, có toast.
  - [x] Trang chi tiết bình thường vẫn hiện đúng breadcrumb "Dashboard / Brands / {tên}" và tiêu đề tab là tên brand.
  - [x] (Tùy chọn) Ép lỗi trang chi tiết (tạm tắt MySQL rồi F5 `/admin/brands/<id>`): hiện "Couldn't load this brand" + nút Try again.
  - [x] Các mục còn lại của checklist Bước 9 ở trên (nếu chưa tick).

## Bước tiếp theo
Hoàn thành
