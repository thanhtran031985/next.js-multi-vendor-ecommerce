# 03 — Quản lý thương hiệu (brands)

> Quy trình làm việc, quy tắc code và cách chuyển thiết kế x-dc: xem `CLAUDE.md`.
> Tiến độ: `docs/tasks/03-brands/progress.md`.
> Phụ thuộc: `01-auth` (guard), `02-role-dashboards` (khung admin, `lib/dashboard/nav.ts`).
> Đọc `decisions.md` của 01 và 02 trước khi làm.

## Mục tiêu
CRUD thương hiệu (Brand) cho admin tại `/admin/brands`: danh sách, thêm/sửa bằng modal,
trang chi tiết, xóa có bảo vệ, bật/tắt trạng thái ngay trên danh sách.
Brand gồm: tên, ảnh, trạng thái (ACTIVE / INACTIVE). Chỉ ADMIN được truy cập.

## Thiết kế
Dùng làm MẪU giao diện (không có thiết kế riêng cho Brand):
- `designs/VendorProductList.dc.html` → mẫu trang danh sách (header, tìm kiếm, bộ lọc,
  bảng, badge trạng thái, thao tác từng dòng, phân trang, empty state)
- `designs/VendorAddProduct.dc.html`  → mẫu form (trường nhập, nhãn, khối tải ảnh,
  công tắc, nút lưu/hủy)
- `designs/AdminProductList.dc.html`  → cách trang nằm trong khung admin (breadcrumb…)
Tên file là dự kiến. Bước 0 đối chiếu tên thật và tìm thêm file nào có chữ "brand"
trong tên. Không tìm thấy mẫu danh sách hoặc mẫu form → DỪNG và hỏi.
Khung admin (sidebar, thanh trên) đã làm ở task 02: DÙNG LẠI, không dựng lại.

## Bối cảnh
- DB hiện có `User`, `Vendor` và các bảng của task 02 (nếu có). **CHƯA có model
  `Product`** — xem quyết định "Phần phụ thuộc Product" bên dưới.
- UI tiếng Anh (quyết định từ task 01).
- Task 01 đã có: `lib/auth/guards.ts` (`getVerifiedSession`, `requireRole`),
  `lib/slug.ts`, server action đặt ở `app/actions/`.

## Quyết định kiến trúc (làm đúng theo)

### Tổ chức code
- `lib/brands/schema.ts` — Zod schema dùng chung client/server, export kiểu suy ra.
- `lib/brands/queries.ts` — hàm ĐỌC (`listBrands`, `getBrandById`,
  `countProductsByBrand`). Gọi trực tiếp từ server component. **Không** làm thành
  server action (server action dành cho thao tác ghi).
- `lib/brands/service.ts` — logic GHI thuần (`createBrand`, `updateBrand`,
  `deleteBrand`, `setBrandStatus`): nhận dữ liệu đã validate, không đụng session.
  Tách riêng để script kiểm tra gọi được trực tiếp.
- `lib/storage/images.ts` — lưu/xóa ảnh, kiểm tra loại file.
- `app/actions/brands.ts` — server action mỏng, mỗi action theo đúng thứ tự:
  kiểm tra ADMIN → validate Zod → gọi service → `revalidatePath` → trả kết quả.
- Trang: trong route group admin hiện có (`app/(admin)/admin/(protected)/brands/`),
  gồm `page.tsx`, `loading.tsx`, `error.tsx`, `[id]/page.tsx`.
- Component: `components/brands/`.

### Kiểu kết quả của action
```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```
Không throw lỗi thô ra client. Lỗi không lường trước → log server + thông báo chung.

### Phân quyền
- MỌI server action kiểm tra ADMIN bằng `getVerifiedSession()` (đọc DB, theo
  decisions task 01). Không phải ADMIN → trả `{ success: false, error: "Unauthorized" }`,
  **không redirect** trong action. Viết một helper dùng chung, vd `requireAdminAction()`.
- Mọi page gọi `requireRole("ADMIN")` (layout đã có, page vẫn gọi — decisions task 01).
- KHÔNG sửa `lib/auth/*`, `proxy.ts`, `auth.ts`. Cần sửa → DỪNG và hỏi.

### Phần phụ thuộc Product (model CHƯA tồn tại)
- KHÔNG tạo model Product, KHÔNG thêm quan hệ `products` vào Brand ở task này.
- `countProductsByBrand(brandId)` trả `0`, kèm `// TODO(product task): dùng _count`.
  Mọi chỗ cần số sản phẩm (cột Products, thống kê trang chi tiết, chặn xóa) đều gọi
  hàm này, để task Product chỉ cần sửa một chỗ.
- Luồng "chặn xóa khi còn sản phẩm" vẫn được code đầy đủ (service + UI), dù hiện
  chưa kích hoạt được.
- Bảng sản phẩm ở trang chi tiết: hiển thị empty state "No products yet".
- Ghi vào `decisions.md` danh sách những gì task Product phải nối lại và kiểm tra lại.

### Slug
- Sinh từ tên khi TẠO (dùng lại hàm slugify trong `lib/slug.ts` nếu dùng được; không
  sửa hành vi hiện có của nó). Trùng → thêm `-2`, `-3`…
- Khi SỬA tên: **slug giữ nguyên** (để URL storefront sau này không bị gãy).
- Tên `@unique`. MySQL mặc định so sánh không phân biệt hoa/thường, nên "Sony" và
  "sony" bị coi là trùng — đó là hành vi mong muốn. Bắt lỗi P2002 trên `name` →
  "A brand with this name already exists"; P2002 trên `slug` → sinh slug khác, thử lại.

### Ảnh
- Chỉ nhận JPG, PNG, WEBP; tối đa 2 MB. Không nhận SVG.
- Kiểm tra phía SERVER bằng dữ liệu thật: kích thước tính từ số byte thực nhận được;
  loại file xác định bằng **magic bytes** (JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`,
  WEBP `RIFF....WEBP`). Không tin MIME type hay đuôi file từ client. Không cài thư viện.
- Tên file lưu: `<uuid>.<đuôi theo loại file đã phát hiện>`, không dùng tên gốc.
- **Nơi lưu:** `storage/uploads/brands/` (NGOÀI `public/`, thêm vào `.gitignore`), phục vụ
  qua route handler `app/media/brands/[file]/route.ts`:
  - Chỉ chấp nhận tên khớp `^[0-9a-f-]{36}\.(jpg|png|webp)$`, sai → 404 (chặn `../`).
  - Content-Type theo đuôi, `Cache-Control: public, max-age=31536000, immutable`.
  - DB lưu đường dẫn `/media/brands/<file>`.
  - Lý do: Next.js chỉ phục vụ file có trong `public/` lúc build; ảnh tải lên lúc chạy
    sẽ không hiện khi dùng `next start`.
  - Kiểm tra `proxy.ts` không chặn `/media/*` (chỉ báo cáo, không tự sửa).
- Thêm comment `// TODO(production): chuyển sang S3/R2` ở `lib/storage/images.ts`.
- **Giới hạn body của server action:** mặc định khoảng 1 MB, sẽ chặn ảnh 2 MB. Cấu hình
  giới hạn khoảng 3 MB trong `next.config` theo đúng khóa cấu hình của phiên bản Next
  đang cài (tra tài liệu, báo lại khóa đã dùng).
- **Nhất quán file ↔ DB:**
  - Tạo: lưu file → tạo bản ghi; tạo lỗi → xóa file vừa lưu.
  - Sửa có ảnh mới: lưu file mới → cập nhật bản ghi → xóa file cũ; cập nhật lỗi →
    xóa file mới, giữ file cũ.
  - Xóa brand: xóa bản ghi → xóa file (xóa file lỗi thì chỉ log, không báo thất bại).
- Sửa brand: ảnh là tùy chọn; không gửi ảnh mới → giữ ảnh cũ. Không có thao tác xóa
  hẳn ảnh (vì tạo mới bắt buộc có ảnh); nút "remove" trong form chỉ bỏ ảnh vừa chọn.

### Danh sách
- `searchParams` là nguồn trạng thái duy nhất: `q`, `status`, `page`, `pageSize`
  (10 | 20 | 50, mặc định 10). Giá trị sai → dùng mặc định; `page` vượt quá → trang cuối.
- Phân trang phía server (`skip`/`take` + `count` trong cùng một `$transaction`).
- Thanh công cụ là client component: cập nhật URL, tìm kiếm debounce 300 ms, đổi bộ
  lọc thì về trang 1.
- Bật/tắt trạng thái: `useOptimistic`, lỗi → hoàn tác + toast.
- Bốn trạng thái: đang tải (`loading.tsx`, skeleton), lỗi (`error.tsx`, nút Retry
  gọi `reset`), rỗng khi chưa có brand nào (icon + thông báo + nút Add Brand), rỗng
  khi lọc không ra kết quả (thông báo + nút xóa bộ lọc).

### Thành phần giao diện
- shadcn/ui: CHỈ dùng nếu Bước 0 xác nhận dự án đã cài. Chưa cài → KHÔNG tự cài; dùng
  lại component của task 02 và tự làm primitive nhỏ trong `components/ui/` (modal dùng
  thẻ `<dialog>` gốc với `showModal()`: có focus, Esc để đóng). Bước 0 báo lại và
  chờ tôi chọn.
- Chỉ dùng design token (màu, khoảng cách, bo góc, cỡ chữ). Badge: ACTIVE = token
  success, INACTIVE = token muted.

## Các bước

### Bước 0 — Kiểm tra (không sửa code)
Báo cáo:
- Bảng ánh xạ file thiết kế (3 file mẫu + file nào có "brand" trong tên).
- Task 02 đã ✅ chưa; khung admin và `lib/dashboard/nav.ts` hiện có; menu admin đã có
  mục Brands chưa (thiết kế đặt nó ở đâu).
- Có shadcn/ui không (`components.json`, `components/ui/`); primitive nào đã có.
- Model Product có tồn tại không (dự kiến: không).
- `lib/slug.ts` có hàm slugify dùng lại được không (chữ ký hàm).
- Khóa cấu hình giới hạn body server action cho phiên bản Next đang cài.
- `proxy.ts` matcher có ảnh hưởng tới `/media/*` không.
- Từ thiết kế mẫu: cột bảng, bộ lọc, phân trang, khối tải ảnh, token có sẵn/còn thiếu.
Ghi vào progress.md. DỪNG — đặc biệt chờ tôi chọn phương án shadcn/ui.

### Bước 1 — Prisma model
```prisma
model Brand {
  id        String      @id @default(cuid())
  name      String      @unique @db.VarChar(60)
  slug      String      @unique @db.VarChar(80)
  image     String?
  status    BrandStatus @default(ACTIVE)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

enum BrandStatus {
  ACTIVE
  INACTIVE
}
```
- Chạy `npx prisma migrate dev --name add_brand` và `npx prisma generate`.
- Kiểm tra: migration thành công, `npx prisma migrate status` sạch.

### Bước 2 — Schema, truy vấn, service
- `lib/brands/schema.ts`:
  - `name`: trim, 2–60 ký tự.
  - `image`: `File`; BẮT BUỘC khi tạo, tùy chọn khi sửa; kiểm tra sơ bộ loại và 2 MB
    (server kiểm tra lại bằng magic bytes ở Bước 3).
  - `status`: ACTIVE | INACTIVE.
  - Tách `createBrandSchema` / `updateBrandSchema`, export kiểu.
- `lib/brands/queries.ts`, `lib/brands/service.ts` theo phần Tổ chức code.
- Kiểm tra: `npx tsc --noEmit` không lỗi.

### Bước 3 — Lưu trữ ảnh
- `lib/storage/images.ts` (`saveImage`, `deleteImage`, phát hiện loại bằng magic bytes)
  và route `app/media/brands/[file]/route.ts` theo phần Ảnh.
- Cấu hình giới hạn body server action; thêm `storage/` vào `.gitignore`.
- Kiểm tra: tsc không lỗi; script nhỏ lưu thử 1 ảnh, GET qua route → 200 đúng
  Content-Type; GET `/media/brands/..%2F..%2Fpackage.json` → 404; dọn file thử.

### Bước 4 — Server actions
- `app/actions/brands.ts`: `createBrandAction`, `updateBrandAction`,
  `deleteBrandAction`, `toggleBrandStatusAction`.
- Mỗi action: `requireAdminAction()` → Zod → service → `revalidatePath("/admin/brands")`
  (và trang chi tiết khi liên quan) → `ActionResult`.
- `deleteBrandAction`: `countProductsByBrand > 0` → không xóa, trả lỗi nêu số sản phẩm
  và gợi ý chuyển sang INACTIVE.
- Kiểm tra: tsc không lỗi; grep xác nhận MỌI action export đều gọi
  `requireAdminAction()` đầu tiên.

### Bước 5 — Trang danh sách (`/admin/brands`)
- Nằm trong khung admin; breadcrumb "Dashboard / Brands".
- Header: tiêu đề, tổng số brand, nút "+ Add Brand" (mở modal).
- Thanh công cụ: tìm theo tên, lọc trạng thái, chọn số dòng/trang.
- Cột: # / ảnh thu nhỏ / tên / slug / số sản phẩm / trạng thái (có công tắc bật/tắt) /
  thao tác (View, Edit, Delete).
- Bốn trạng thái và phân trang theo phần Danh sách.
- Bật mục Brands trong `lib/dashboard/nav.ts` (enabled: true).
- Kiểm tra: build không lỗi; HTTP: admin → 200; khách hàng/vendor → về dashboard của họ;
  `?page=999`, `?pageSize=abc` không lỗi.

### Bước 6 — Modal thêm/sửa
- MỘT component `BrandFormDialog` dùng cho cả tạo và sửa (truyền `brand` khi sửa).
- Trường: tên, ảnh (xem trước bằng `URL.createObjectURL`, thu hồi khi đổi/đóng; nút bỏ
  ảnh vừa chọn), trạng thái.
- Lỗi Zod dưới từng trường; nút gửi có loading và bị vô hiệu khi đang gửi.
- Thành công: đóng modal, toast, danh sách tự cập nhật.
- Thất bại: giữ modal mở, hiện lỗi, KHÔNG mất dữ liệu đã nhập (kể cả file đã chọn).
- Sửa: điền sẵn dữ liệu, hiện ảnh hiện tại, cho phép thay.
- Kiểm tra: build không lỗi.

### Bước 7 — Trang chi tiết (`/admin/brands/[id]`)
- Breadcrumb "Dashboard / Brands / {tên}".
- Thẻ đầu trang: ảnh, tên, slug, badge trạng thái, ngày tạo, nút Edit (mở modal) và Delete.
- Thống kê: tổng sản phẩm, đang bán / ngừng bán (qua `countProductsByBrand`, hiện là 0).
- Bảng sản phẩm: empty state "No products yet".
- id không tồn tại → `notFound()`.
- Kiểm tra: build không lỗi; HTTP: id đúng → 200, id sai → 404.

### Bước 8 — Luồng xóa
- Modal xác nhận nêu rõ tên: "Delete 'Sony'?".
- Còn sản phẩm → chặn, giải thích lý do, nút "Deactivate instead" (gọi toggle).
- Được xóa → xóa bản ghi và file ảnh; toast; ở trang chi tiết thì chuyển về danh sách.
- Kiểm tra: build không lỗi.

### Bước 9 — Kiểm tra tổng
Tự động (chạy và dán kết quả):
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `scripts/verify-auth.ts` vẫn đạt toàn bộ.
- Grep: không có hex/`rgba(`/px cố định trong file mới; mọi action gọi
  `requireAdminAction()`.
- `scripts/verify-brands.ts` (gọi schema + service + storage trực tiếp, không cài thư
  viện mới), dọn dữ liệu và file test sau khi chạy:
  - Tạo có ảnh → có bản ghi, file tồn tại.
  - Trùng tên (kể cả khác hoa/thường) → lỗi thân thiện; file vừa lưu bị dọn.
  - Ảnh 5 MB → bị từ chối. File PDF đổi đuôi thành `.jpg` → bị từ chối.
  - Hai tên sinh cùng slug → slug thứ hai có `-2`. Sửa tên → slug không đổi.
  - Sửa không gửi ảnh → giữ ảnh cũ. Sửa có ảnh mới → file cũ bị xóa.
  - Đổi trạng thái → lưu bền.
  - Xóa → bản ghi và file đều mất.
  - `listBrands`: tìm kiếm, lọc trạng thái, phân trang đúng số lượng.
- HTTP: khách hàng/vendor vào `/admin/brands` và `/admin/brands/<id>` → bị chuyển.

Checklist thủ công cho tôi (ghi vào progress.md):
- So sánh trang danh sách và modal với thiết kế mẫu: bố cục, khoảng cách, màu.
- Thêm brand có ảnh; thêm trùng tên; thử ảnh > 2 MB (báo lỗi, modal giữ dữ liệu).
- Sửa đổi tên và thay ảnh; ảnh mới hiện đúng.
- Bật/tắt trạng thái trên danh sách; F5 vẫn giữ.
- Tìm kiếm, lọc, đổi số dòng/trang, chuyển trang; URL phản ánh bộ lọc.
- Xóa brand; mở trang chi tiết của id không tồn tại → 404.
- Xóa hết brand → empty state; lọc không ra kết quả → thông báo riêng.
- Mục Brands trong sidebar admin hoạt động.

Chưa kiểm tra được (chờ task Product, ghi vào decisions.md): cột số sản phẩm, thống kê
trang chi tiết, bảng sản phẩm, chặn xóa khi còn sản phẩm.

## Phạm vi
- Được tạo/sửa: model Brand + enum + migration; `lib/brands/**`, `lib/storage/**`,
  `app/actions/brands.ts`, các route `/admin/brands/**`, `app/media/brands/**`,
  `components/brands/**`, primitive trong `components/ui/` (nếu được duyệt ở Bước 0),
  mục Brands trong `lib/dashboard/nav.ts`, giới hạn body trong `next.config`,
  `storage/` trong `.gitignore`, theme token.
- KHÔNG làm: model Product hay quan hệ tới Product; lọc brand ở storefront; thao tác
  hàng loạt, import/export, sắp xếp cột; cài thư viện mới khi chưa hỏi; sửa logic auth.

## Tiêu chí hoàn thành
- Mọi bước trong progress.md là ✅.
- Phần tự động ở Bước 9 không lỗi; `verify-auth.ts` vẫn đạt.
- Checklist thủ công đã ghi vào progress.md.
- `decisions.md` có danh sách việc task Product phải nối lại.
