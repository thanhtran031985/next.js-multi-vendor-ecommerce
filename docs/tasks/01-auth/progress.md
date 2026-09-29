# Tiến độ — 01-auth

Trạng thái chung: ✅ · Cập nhật lần cuối: 2026-09-28

Code đã được viết theo prompt cũ, nằm trên nhánh `feat/multi-role-auth` (commit `30e0818`). Nhật ký chi tiết của lần làm đó ở `_archive/progress-2026-09-28.md`. Bảng dưới là kết quả rà soát lại theo `task.md` mới.

Ký hiệu:
- ✅ đúng
- ⚠️ có nhưng khác `task.md` (xem `decisions.md`)
- ❌ thiếu

| Bước | Tên | Trạng thái | Ghi chú |
|------|-----|------------|---------|
| 0 | Kiểm tra dự án (không sửa code) | ✅ | Phiên bản và bảng ánh xạ thiết kế: xem Giai đoạn A bên dưới |
| 1 | Prisma schema | ✅ | `prisma/schema.prisma` dòng 14–46; `migrate status` sạch |
| 2 | Seed admin | ✅ | `prisma/seed.ts`; `package.json` dòng 12; chạy 2 lần vẫn đúng 1 ADMIN |
| 3 | Cấu hình NextAuth v5 | ✅ | Khác biệt đã được chấp nhận: thông báo tiếng Anh, augment `@auth/core/jwt` (decisions) |
| 4 | Đăng ký (server actions) | ✅ | Có thêm ràng buộc nhỏ (decisions) |
| 5 | Các trang (chuyển từ thiết kế) | ✅ | Lệch thiết kế có chủ đích đã được chấp nhận (decisions) |
| 6 | Bảo vệ route (middleware/proxy + layout) | ✅ | Route group; guard đọc lại user từ DB (Giai đoạn B, mục 1) |
| 7 | Chuyển hướng sau đăng nhập + đăng xuất | ✅ | |
| 8 | Kiểm tra tổng | ✅ | Tự động OK; chủ dự án đã test thủ công ("test ok", 2026-09-28) |
| — | `.env.example` (mục Môi trường) | ✅ | Tạo ở Giai đoạn B, mục 2 |

## Nhật ký

### Giai đoạn A — Rà soát (2026-09-28)

**Bước 0 — Phiên bản**
- next 16.3.6: dùng `proxy.ts`.
- next-auth 5.0.0-beta.32.
- prisma / @prisma/client 6.19.3: bản dưới 7, seed khai báo trong `package.json#prisma`.
- tailwindcss 4.3.3: v4, token nằm trong `@theme`.

**Bảng ánh xạ thiết kế**

| Trang | Tên trong task.md | File thật |
|---|---|---|
| /login | `Login.dc.html` | `designs/login.dc.html` |
| /register | `Register.dc.html` | `designs/register.dc.html` |
| /vendor/login | `VendorLogin.dc.html` | `designs/VendorLogin.dc.html` |
| /vendor/register | `VendorRegister.dc.html` | `designs/VendorRegister.dc.html` |
| /admin/login | `AdminLogin.dc.html` | **Không có**, nên theo phong cách `login.dc.html` |

- Không file thiết kế auth nào tham chiếu `designs/uploads/`, nên không có ảnh cần copy sang `public/`. Các ô ảnh trong mockup là placeholder.

**Quyết định kiến trúc** (tất cả ✅)
- **Một bảng User với enum role:** `schema.prisma` dòng 14, 26, 31.
- **Một email = một role:** `User.email @unique` (dòng 29). Đăng ký kiểm tra email trước, và bắt P2002 ở `lib/auth/register.ts` dòng 53 và 88.
- **Vendor 1:1:** `Vendor.userId @unique` và `onDelete: Cascade` (dòng 39–40).
- **NextAuth chỉ lo đăng nhập, đăng ký là server action riêng:** `auth.ts` chỉ có Credentials; đăng ký ở `app/actions/auth.ts` và `lib/auth/register.ts`.
- **JWT, không adapter:** không có `PrismaAdapter`, không có model Account/Session/VerificationToken (grep: 0 kết quả).
- **Tách cấu hình:**
  - `proxy.ts` dòng 4–5 chỉ import `next-auth` và `./auth.config`.
  - `auth.config.ts` dòng 4–5 chỉ import type và `lib/auth/roles` (thuần, không import gì).
  - Bundle proxy sau build: 93 file được trace, **0** tham chiếu Prisma hay bcrypt.
- **Trạng thái vendor lấy từ DB:**
  - `auth.ts` dòng 24–25: callback jwt đọc lại trạng thái khi `trigger === "update"`, bỏ qua payload client gửi lên.
  - `lib/auth/guards.ts` dòng 48–54: `requireApprovedVendor` đọc DB ở mỗi request.
  - Layout và page `/vendor/dashboard` đều gọi guard.
  - `/vendor/pending` đọc DB (dòng 22); nếu APPROVED thì gọi `update()` rồi chuyển trang (`ApprovedRedirect.tsx` dòng 20).
  - Test HTTP ở lần làm trước: duyệt xong vào dashboard mà **không cần đăng nhập lại**.
- **Chung logic đăng nhập, đăng nhập "sai" trang vẫn được:** một `loginAction` dùng cho cả 3 trang, redirect bằng `safeCallbackUrl(…, user)` (`app/actions/auth.ts` dòng 54).

**Các điểm kiểm tra kỹ**
- **Proxy có import Prisma/bcrypt không:** không (xem trên).
- **Adapter, model thừa:** không có.
- **Trạng thái vendor từ DB, không cần đăng nhập lại sau khi duyệt:** đúng (xem trên).
- **signIn trong try/catch:**
  - `app/actions/auth.ts` dòng 38–43 và 82–86 chỉ bắt `AuthError`, còn lại `throw err`, nên redirect không bị nuốt.
  - Lỗi cấu hình của Auth.js cũng được phát hiện ở dòng 47.
- **authorize() không lộ email tồn tại:**
  - `lib/auth/credentials.ts` dòng 12 và 45: vẫn so bcrypt với `DUMMY_HASH` khi không có user.
  - Dòng 30 và 46: mọi thất bại trả `null`.
  - Hạn chế vốn có: form đăng ký buộc phải báo "email đã được đăng ký" theo spec.
- **callbackUrl:** `lib/auth/roles.ts` dòng 98–111 chặn URL tuyệt đối, `//`, `/\` và URL lệch origin, và giới hạn trong khu vực của role.
- **Layout kiểm tra role phía server:**
  - `app/(account)/dashboard/layout.tsx` dòng 6
  - `app/(admin)/admin/(protected)/layout.tsx` dòng 9
  - `app/(seller)/vendor/dashboard/layout.tsx` dòng 9
  - Các page cũng gọi guard.
- **Mã hex cố định trong các trang auth:** grep `#hex` và `rgba(` trong `app/(…)/**`, `app/layout.tsx`, `components/**` cho **0** kết quả.
- **Vendor.slug:** `@unique` (`schema.prisma` dòng 42); `uniqueVendorSlug` sinh `-2`, `-3`… (`lib/slug.ts` dòng 24); trùng slug do chạy đồng thời thì thử lại tối đa 3 lần (`lib/auth/register.ts` dòng 18 và 90).
- **`.env.example`:** ❌ **không tồn tại.**

**Kiểm tra tự động**
- `npx tsc --noEmit`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, 12 route và `ƒ Proxy (Middleware)`.
- `npx prisma migrate status`: "Database schema is up to date!".

### Giai đoạn B — Sửa (2026-09-28)
Lựa chọn của chủ dự án: sửa mục 1 và 2; giữ nguyên mục 3, 4, 5, 6 (ghi trong `decisions.md`).

#### Mục 2 — Tạo `.env.example` ✅
- **Đã làm:**
  - Tạo `.env.example` với 4 biến theo `task.md`: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
  - Thêm dưới dạng chú thích `AUTH_TRUST_HOST` và `AUTH_URL`, kèm hướng dẫn: cần khi chạy `next start` hoặc deploy.
  - Thêm `!.env.example` vào `.gitignore`, vì dòng `.env*` đang chặn cả file mẫu.
- **File tạo/sửa:** `.env.example` (mới), `.gitignore` (thêm 1 dòng).
- **Kết quả kiểm tra:**
  - `git check-ignore`: `.env.example` commit được; `.env`, `.env.local`, `.env.production` vẫn bị bỏ qua.
  - `npx tsc --noEmit`: OK.
- **Việc cần làm thủ công:** không có. `.env` hiện tại không đổi; so với `.env.example`, chỉ cần có đủ 4 biến bắt buộc.

#### Mục 1 — Guard kiểm tra user với DB mỗi request ✅
- **Đã làm:**
  - `lib/auth/guards.ts`: thêm `getVerifiedSession()` (bọc React `cache`, 1 query mỗi request). Hàm này đọc lại user từ DB theo id trong token, gồm role và vendor.
    - Kết quả `ok`: role, vendorId, vendorStatus lấy từ DB.
    - Kết quả `stale`: user đã bị xóa, hoặc role trong DB khác role trong token.
    - Kết quả `signed-out`: không có session.
  - `requireRole`, `requireApprovedVendor` và `redirectIfSignedIn` dùng `getVerifiedSession`. `requireApprovedVendor` dùng lại dữ liệu vendor đã tải, không query thêm.
  - Route mới `app/auth/session-ended/route.ts` (GET):
    - Chỉ đăng xuất khi session **thật sự** `stale`, rồi về trang login của khu vực cũ.
    - Session còn hợp lệ thì chỉ chuyển về home, nên link từ site khác không thể ép đăng xuất.
- **Vì sao cần route riêng:** server component không xóa được cookie khi render. Nếu chỉ redirect về trang login, proxy vẫn thấy token cũ và đẩy ngược lại, gây vòng lặp.
- **File tạo/sửa:** `lib/auth/guards.ts`, `app/auth/session-ended/route.ts` (mới).
- **Kết quả kiểm tra:**
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: OK (có thêm route `ƒ /auth/session-ended`).
  - HTTP trên server production, **11/11 đạt**, log không có lỗi `[auth]`, dữ liệu test `@fix1.covet.test` đã dọn:
    - Khách hàng hợp lệ vào `/dashboard`: 200. `/auth/session-ended` với session hợp lệ: về `/dashboard`, **không** bị đăng xuất.
    - User bị xóa khi đang đăng nhập: `/dashboard` → `/auth/session-ended` → `/login`, cookie bị xóa, không lặp. Vào `/login` bằng cookie cũ cũng kết thúc ở `/login`.
    - Admin bị hạ xuống CUSTOMER: `/admin/dashboard` → `/auth/session-ended` → `/admin/login`, cookie bị xóa, không lặp.
    - Vendor PENDING: về `/vendor/pending`. DB = APPROVED (token cũ PENDING): `/vendor/dashboard` 200. DB = SUSPENDED: về `/vendor/pending`, vẫn giữ đăng nhập.
    - Khách hàng vào `/admin/dashboard`: về `/dashboard`, không bị đăng xuất.
- **Việc cần làm thủ công:** không có.

### Giai đoạn C — Kiểm tra (2026-09-28)

**Tự động**

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | OK |
| `npm run lint` | OK |
| `npm run build` | OK: 13 route (có `/auth/session-ended`) và `ƒ Proxy (Middleware)` |
| `npx tsx --env-file=.env scripts/verify-auth.ts` | **31/31 PASS**; dọn 3 user test (vendor bị xóa theo cascade) |

Script `scripts/verify-auth.ts` kiểm tra:
- Đăng ký khách hàng.
- Đăng ký vendor: PENDING, slug `…` và `…-2`.
- Email trùng giữa các role, kể cả khác hoa/thường.
- Mật khẩu yếu và confirmPassword không khớp.
- `authorize()`: sai mật khẩu, email không tồn tại, input sai đều trả `null` với cùng thông báo chung.
- callbackUrl giả mạo.

Phần kiểm tra quyền (cần request thật) đã test bằng HTTP ở Giai đoạn B, mục 1.

### Checklist test thủ công

Chạy `npm run dev`, mở http://localhost:3000. `.env` cần có đủ 4 biến bắt buộc trong `.env.example`.

- [x] 1. `/register`: đăng ký khách hàng (tick ô Terms), được đưa vào `/dashboard` ("My account").
- [x] 2. Đăng xuất. `/vendor/register`: đăng ký vendor, được đưa vào `/vendor/pending` ("Your store is under review"). Mở `/vendor/dashboard` bị đưa lại `/vendor/pending`.
- [x] 3. Duyệt vendor trong DB (lệnh bên dưới), rồi tải lại `/vendor/pending`: tự chuyển tới `/vendor/dashboard` mà **không cần đăng nhập lại**.
- [x] 4. `/admin/login` với `admin@covet.local` và mật khẩu seed: vào `/admin/dashboard`.
- [x] 5. Đăng nhập khách hàng, rồi mở `/vendor/dashboard` và `/admin/dashboard`: đều bị đưa về `/dashboard`.
- [x] 6. Sai mật khẩu: toast "Invalid email or password". Đăng ký bằng email đã có: "This email is already registered" hiện dưới ô Email.
- [x] 7. Đăng xuất ở cả 3 role: về đúng `/login`, `/vendor/login`, `/admin/login`.
- [x] 8. Nhấn F5 khi đang đăng nhập: vẫn giữ session.
- [x] 9. Mở `http://localhost:3000/login?callbackUrl=https://evil.com` rồi đăng nhập khách hàng: về `/dashboard`, không sang evil.com.
- [x] 10. *(Bổ sung sau rà soát, không bắt buộc)* Khi đang đăng nhập bằng một khách hàng test, xóa user đó trong DB rồi tải lại `/dashboard`: bị đưa về `/login` và đã đăng xuất, không bị lặp redirect.

**Lệnh duyệt vendor** (MySQL, database `covetecom`)

Xem slug và trạng thái:
```sql
SELECT v.slug, v.status, u.email FROM `Vendor` v JOIN `User` u ON u.id = v.userId;
```

Duyệt theo slug:
```sql
UPDATE `Vendor` SET status = 'APPROVED' WHERE slug = '<slug>';
```

Hoặc duyệt theo email:
```sql
UPDATE `Vendor` v JOIN `User` u ON u.id = v.userId SET v.status = 'APPROVED' WHERE u.email = '<email>';
```

Thử trạng thái bị khóa:
```sql
UPDATE `Vendor` SET status = 'SUSPENDED' WHERE slug = '<slug>';
```

Cho mục 10, xóa user test (Vendor bị xóa theo cascade):
```sql
DELETE FROM `User` WHERE email = '<email test>';
```

Hoặc dùng Prisma Studio: chạy `npx prisma studio`, mở bảng **Vendor**, sửa `status` thành `APPROVED`, rồi bấm **Save 1 change**.

### Giai đoạn D — Đóng task (2026-09-28)
- Chủ dự án báo "test ok" sau khi test thủ công. Checklist đã được tích.
- Tất cả các bước ✅. `docs/tasks/README.md`: 01-auth ✅, nhánh `feat/multi-role-auth`.
- `decisions.md`: thêm mục tổng kết.

## Bước tiếp theo
Hoàn thành.
