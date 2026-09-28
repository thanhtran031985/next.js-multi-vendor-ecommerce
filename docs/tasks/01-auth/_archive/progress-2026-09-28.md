# Tiến độ: Xác thực đa vai trò — Covet

Spec: [auth.md](auth.md). Đọc file này trước tiên khi bắt đầu phiên mới hoặc sau khi compact.

## Trạng thái

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 0 | Kiểm tra dự án | ✅ xong |
| 1 | Prisma schema | ✅ xong |
| 2 | Seed admin | ✅ xong |
| 3 | Cấu hình NextAuth v5 | ✅ xong |
| 4 | Đăng ký (server actions) | ✅ xong |
| 5 | Các trang (chuyển từ thiết kế) | ✅ xong |
| 6 | Bảo vệ route (proxy + layout) | ✅ xong |
| 7 | Chuyển hướng sau đăng nhập + đăng xuất | ✅ xong |
| 8 | Kiểm tra | ✅ xong |

## Các quyết định đã chốt

- **Trang auth dùng khung tĩnh.** Header, footer, thẻ trợ giúp và các phần giới thiệu vendor là server component tĩnh. Mega-menu, giỏ hàng và tìm kiếm chưa hoạt động.
- **Form đăng ký vendor** gồm Full name, Store name, Email, Password, Confirm password, bố cục grid 2 cột. Bỏ trường Phone. Nút ghi "Create store".
- **Thông báo lỗi bằng tiếng Anh**, ví dụ "Invalid email or password" và "This email is already registered". Chọn tiếng Anh cho khớp UI, thay cho câu tiếng Việt ghi trong spec.
- **Cài `tsx`** làm devDependency.
- **Bỏ các phần ngoài phạm vi:** nút Google/Facebook, "Forgot password", "Remember me", hộp demo credentials.
- **Checkbox Terms** ở trang đăng ký khách hàng là bắt buộc (`acceptTerms`).
- **Icon dùng SVG inline** trong `components/icons.tsx`, vì chưa cài lucide-react và shadcn.
- **Route group** là `(storefront)`, `(account)`, `(seller)`, `(admin)`; URL không đổi.
- **Font:** `html { font-size: 17px }` cùng token tính bằng rem, thay cho `zoom: 1.0625` của mockup.

## Bước 0 — Kiểm tra dự án ✅

**Phiên bản đang cài**

| Package | Phiên bản | Hệ quả |
|---|---|---|
| next | 16.3.6 | Dùng `proxy.ts` (chạy trên Node runtime) |
| next-auth | 5.0.0-beta.32 | |
| prisma, @prisma/client | 6.19.3 | Bản dưới 7: seed khai báo trong `package.json#prisma` |
| tailwindcss | 4.3.3 | v4: token nằm trong `@theme` ở `globals.css` |
| Khác | react 19.2.8, zod 4.6.5, bcryptjs 3.0.3, react-hot-toast 2.6.1, typescript 5.9.3, Node 25.2.1 | |

- Package manager là npm, không phải pnpm. Không có script `typecheck`, nên dùng `npx tsc --noEmit`.
- Có đủ 4 file thiết kế, nhưng tên dùng dấu chấm: `designs/login.dc.html`, `register.dc.html`, `VendorLogin.dc.html`, `VendorRegister.dc.html`.
- Có `docs/PRD.md` và `docs/DESIGN_SYSTEM.md`.

## Bước 1 — Prisma schema ✅

**Đã làm**
- Enum `Role` (CUSTOMER, VENDOR, ADMIN) và `VendorStatus` (PENDING, APPROVED, SUSPENDED).
- Model `User` và `Vendor` quan hệ 1:1, xóa User thì xóa Vendor theo (cascade).
- Không có các model Account, Session, VerificationToken.
- Prisma client dùng chung một instance.

**Kiểm tra**
- Đã tạo và áp dụng migration `20260928143811_auth_init`.
- `migrate status` báo "Database schema is up to date!".
- `tsc` không lỗi.

**File**
- `prisma/schema.prisma`
- `prisma/migrations/20260928143811_auth_init/migration.sql`
- `lib/prisma.ts`

**Thủ công:** không có.

## Bước 2 — Seed admin ✅

**Đã làm**
- Cài `tsx` 4.23.15.
- Seed khai báo trong `package.json#prisma.seed`.
- Thêm vào `.env`: `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Viết `prisma/seed.ts`:
  - Validate bằng Zod; mật khẩu tối thiểu 12 ký tự.
  - Bcrypt cost 12.
  - Mật khẩu trống ở dev: sinh ngẫu nhiên và in ra một lần.
  - Mật khẩu trống ở production: throw.
  - Không nâng quyền cho email đã thuộc role khác.
  - Không bao giờ in hash.

**Kiểm tra**
- Chạy seed hai lần: lần 1 báo "created", lần 2 báo "already exists, no changes".
- Truy vấn DB: đúng **1** dòng ADMIN (`admin@covet.local`), hash dạng `$2b$12$`.
- `tsc` và eslint không lỗi.
- Cảnh báo vô hại: `package.json#prisma` sẽ bị bỏ ở Prisma 7.
- `npm audit` báo 3 lỗi high trong `deepmerge-ts`. Gói này là phụ thuộc của Prisma, không phải của tsx. Chưa xử lý.

**File**
- `prisma/seed.ts`
- `package.json` (thêm tsx và cấu hình seed)
- `package-lock.json`
- `.env`

**Thủ công**
- Lưu lại mật khẩu admin dev đã in khi seed lần 1. Nếu muốn đổi, điền `ADMIN_PASSWORD` vào `.env` rồi chạy `npx prisma db seed`.
- Tạo `AUTH_SECRET` bằng `npx auth secret`, hoặc tự điền vào `.env`.

## Bước 3 — Cấu hình NextAuth v5 ✅

**Đã làm**
- **`auth.config.ts`** (an toàn cho edge; chỉ có `import type` từ next-auth):
  - `session: jwt`, `pages.signIn: /login`, `providers: []`.
  - Callback `jwt` gắn id, role, vendorId, vendorStatus khi đăng nhập.
  - Callback `session` copy các trường đó sang `session.user`.
  - Callback `authorized` để sang Bước 6.
- **`auth.ts`**:
  - Spread `authConfig` và thêm Credentials với `authorize` gọi `verifyCredentials`.
  - Bọc callback `jwt`: khi `trigger === "update"` và role là VENDOR thì đọc lại `vendorId` và `vendorStatus` từ DB. Bỏ qua payload client gửi lên qua `update()`.
  - Export `handlers`, `auth`, `signIn`, `signOut`.
- **`lib/auth/credentials.ts`**, hàm `verifyCredentials`:
  - Validate bằng Zod (`loginSchema`), rồi `findUnique` kèm vendor, rồi `bcrypt.compare`.
  - Email không tồn tại vẫn so với `DUMMY_HASH` (cost 12).
  - Mọi thất bại đều trả `null`.
- **`lib/auth/roles.ts`** (thuần, dùng được cho edge/proxy):
  - Kiểu `Role` và `VendorStatus`.
  - Các hàm `getRoleHome`, `loginPathForRole`, `loginPathForPath`, `isPathAllowedForRole`, `isAuthPage`, `isUnder`.
  - `safeCallbackUrl`: chặn URL tuyệt đối, `//`, `/\`, trick tab/newline, URL lệch origin, và URL ngoài khu vực của role.
- **`lib/auth/messages.ts`**: `INVALID_CREDENTIALS` ("Invalid email or password") và `EMAIL_TAKEN`.
- **`lib/validation/auth.ts`**: `emailSchema` (trim, lowercase, tối đa 191 ký tự) và `loginSchema`. Ô password ở form đăng nhập chỉ bắt buộc có giá trị, vì chính sách độ mạnh mật khẩu áp dụng lúc đăng ký. Bước 4 sẽ bổ sung schema đăng ký vào file này.
- **`app/api/auth/[...nextauth]/route.ts`**.
- **`types/next-auth.d.ts`**:
  - Augment `next-auth` (`User`, `Session`).
  - Augment `@auth/core/jwt` (`JWT`). Không dùng `next-auth/jwt` vì file đó chỉ là `export *`, TypeScript không merge interface qua `export *` (đã thử và gặp lỗi tsc).

**Quyết định:** khu vực hợp lệ của callbackUrl theo role:
- CUSTOMER: `/dashboard/*` và storefront, tức mọi đường dẫn ngoài `/vendor` và `/admin`.
- VENDOR: `/vendor/dashboard/*` và `/vendor/pending`.
- ADMIN: `/admin/*`.
- Trang login/register không bao giờ là đích hợp lệ.

**Kiểm tra**
- `npx tsc --noEmit`: OK.
- Eslint: OK.
- File thử kiểu với `@ts-expect-error`: augmentation có hiệu lực. `JWT.role` chỉ nhận giá trị kiểu Role, `session.user.role` được gõ kiểu đúng, và `User` bắt buộc có role.
- Script chạy thật (file tạm, đã xóa):
  - Admin đăng nhập OK, email được trim và lowercase.
  - Sai mật khẩu và email không tồn tại đều trả `null`, thời gian tương đương (khoảng 360–600ms, bcrypt vẫn chạy).
  - Input rỗng hoặc sai định dạng trả `null`.
  - 20 ca `safeCallbackUrl` đều đạt, gồm `https://evil.com`, `//evil.com`, `/\evil.com`, tab trick, `javascript:`, `/administrator`, `/dashboard/../admin/x`.
- `auth.config.ts` và `roles.ts` không import Prisma hay bcrypt.

**File**
- `auth.config.ts`, `auth.ts`
- `lib/auth/roles.ts`, `lib/auth/credentials.ts`, `lib/auth/messages.ts`
- `lib/validation/auth.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `types/next-auth.d.ts`

**Thủ công**
- **Bắt buộc trước khi chạy app:** điền `AUTH_SECRET` trong `.env` (`npx auth secret`, hoặc chuỗi ngẫu nhiên từ 32 byte trở lên). `AUTH_SECRET=""` là chuỗi rỗng nên Auth.js không fallback sang `NEXTAUTH_SECRET`, và app sẽ lỗi `MissingSecret`.

## Bước 4 — Đăng ký (server actions) ✅

**Đã làm**
- **`lib/validation/auth.ts`**: schema dùng chung cho client và server.
  - `emailSchema`: trim, lowercase, tối đa 191 ký tự.
  - `nameSchema`, `storeNameSchema`: trim, 2–80 ký tự.
  - `passwordSchema`: tối thiểu 8 ký tự, có chữ cái (`\p{L}`) và chữ số, tối đa 72 byte (giới hạn của bcrypt).
  - `customerRegisterSchema` có thêm `acceptTerms: true`.
  - `vendorRegisterSchema` có thêm `confirmPassword`. Lỗi không khớp dùng `refine` với `when`, nên vẫn báo cùng lúc với lỗi của các trường khác.
  - Kiểu `FormState<Field> = { fieldErrors?, formError?, values? }`. `values` chỉ trả lại name, email, storeName, không bao giờ trả password.
  - Helper `firstFieldErrors`.
- **`lib/slug.ts`**:
  - `slugify`: NFKD, bỏ dấu, đổi `đ` thành `d`, `[a-z0-9-]`, tối đa 80 ký tự. Rỗng thì dùng `store`.
  - `uniqueVendorSlug(tx, base)`: dùng một truy vấn `startsWith` để lấy các slug đã có, rồi chọn slug trống đầu tiên trong `base`, `base-2`, `base-3`, …
- **`lib/auth/register.ts`**, gồm `registerCustomer` và `registerVendor`:
  - Luồng: Zod, kiểm tra email, bcrypt cost 12 (hash xong mới mở transaction), tạo user.
  - Vendor: `prisma.$transaction` tạo User(VENDOR) và Vendor(PENDING).
  - P2002 trên email trả "This email is already registered".
  - P2002 trên slug thì thử lại, tối đa 3 lần.
  - Các lỗi khác throw lại.
- **`app/actions/auth.ts`** (`"use server"`), gồm `registerCustomerAction` và `registerVendorAction` (chữ ký dùng cho `useActionState`):
  - Gọi logic lõi, rồi `signIn("credentials", { redirectTo: "/dashboard" | "/vendor/pending" })`.
  - Chỉ bắt `AuthError` (trả formError). Redirect và mọi lỗi khác đều throw lại.

**Kiểm tra**
- `npx tsc --noEmit`: OK.
- Eslint: OK.
- Script chạy thật trên DB (file tạm, đã xóa, dữ liệu test `@step4.covet.test` đã dọn), 14 mục đạt:
  - Khách hàng: tạo được, email được chuẩn hóa, role CUSTOMER, hash dạng `$2b$12$`.
  - 2 vendor cùng tên cửa hàng: cả hai PENDING, slug `step4-probe-studio` và `step4-probe-studio-2`.
  - Trùng email giữa customer và vendor (kể cả khác hoa/thường): bị từ chối, không để lại dòng thừa.
  - Mật khẩu yếu và các lỗi trường: báo đúng từng trường.
  - `slugify`: đúng với tiếng Việt và với chuỗi rỗng.
  - MySQL trả P2002 với `meta.target = "User_email_key"`, khớp với cách nhận diện trong code.

**File**
- `lib/validation/auth.ts` (mở rộng)
- `lib/slug.ts`
- `lib/auth/register.ts`
- `app/actions/auth.ts`

**Thủ công:** không có. Nhắc lại: cần điền `AUTH_SECRET` trước Bước 5.

## Bước 5 — Các trang ✅

**Đã làm**
- **Token** (`app/globals.css`, ghi thêm vào `docs/DESIGN_SYSTEM.md` §15):
  - `:root` gồm bộ token §14 cộng các token mới. `@theme inline` ánh xạ sang Tailwind.
  - Đã **xóa** palette và scale mặc định của Tailwind, nên chỉ class token Covet mới có hiệu lực.
  - `html { font-size: 17px }`, mọi kích thước tính bằng rem, tương đương `zoom: 1.0625` của mockup.
- **Root layout**: font Sora và Instrument Sans (`next/font/google`), `<Toaster />` mount **một lần** (style bằng token), metadata "Covet".
- **Component**:
  - `components/icons.tsx`: SVG inline.
  - `components/Wordmark.tsx`, `components/StatusBadge.tsx`.
  - `components/auth/form-kit.tsx`:
    - `useAuthForm` gồm `useActionState`, Zod pre-check phía client với cùng schema, và toast khi có `formError`.
    - Các trường `TextField`, `PasswordField` (ẩn/hiện mật khẩu), `CheckboxField`.
    - `SubmitButton`: disabled kèm spinner khi đang gửi.
  - Form: `LoginForm`, `CustomerRegisterForm`, `VendorRegisterForm`.
  - Khung tĩnh: `BrandPanel`, `AuthCard`, `storefront/StorefrontChrome`, `storefront/HelpCards`, `vendor/VendorPublic` (FAQ bằng `<details>`, không cần JS).
  - `vendor/ApprovedRedirect`: dùng `SessionProvider` chỉ ở trang này, gọi `update()` rồi `router.replace("/vendor/dashboard")`.
- **Trang**:

  | Route | File | Ghi chú |
  |---|---|---|
  | `/login` | `app/(storefront)/login` | Có khung storefront |
  | `/register` | `app/(storefront)/register` | Có khung storefront |
  | `/vendor/login` | `app/(seller)/vendor/login` | Split toàn màn hình |
  | `/vendor/register` | `app/(seller)/vendor/register` | Header vendor, hero form, các section giới thiệu, footer |
  | `/vendor/pending` | `app/(seller)/vendor/pending` | Đọc `Vendor.status` từ DB; hiển thị PENDING / SUSPENDED / không có store; APPROVED thì tự chuyển |
  | `/admin/login` | `app/(admin)/admin/login` | Giống login, không có khung, không có link đăng ký |

  - Trang auth gọi `redirectIfSignedIn()` (`lib/auth/guards.ts`): người đã đăng nhập được chuyển về khu vực của mình.
- **`loginAction`** (dùng chung cho cả 3 trang login):
  - Luồng: Zod, `signIn(redirect: false)`, đọc role từ DB, `redirect(safeCallbackUrl(...))`.
  - Gia cố: nếu Auth.js trả về trang lỗi cấu hình (không throw) thì báo `SIGN_IN_UNAVAILABLE` thay vì redirect như thể đã đăng nhập.
- `lib/validation/auth.ts`: thêm các hàm `*InputFromForm` (FormData sang input) dùng chung cho client và server.

**Kiểm tra**
- `npx tsc --noEmit`, eslint: OK.
- `npm run build`: OK. 9 route; các trang auth là dynamic (ƒ).
- Không còn hex hay rgba cố định trong `app/` và `components/`, trừ `app/page.tsx` là trang mặc định của Create Next App, không đụng tới.
- CSS build có các class token và không còn palette mặc định.
- **Server production (`next start`) với `AUTH_SECRET` tạm cho tiến trình**, 11 ca HTTP end-to-end đạt:
  - Đăng ký khách hàng: 303 về `/dashboard`, có session cookie.
  - Trùng email, lỗi Zod, sai mật khẩu: thông báo đúng, không có session.
  - Đăng ký vendor: 303 về `/vendor/pending`, trang hiện "under review".
  - `callbackUrl=https://evil.com` bị bỏ qua. Khách hàng login ở `/vendor/login` được chuyển về `/dashboard`. Vendor PENDING với callbackUrl admin được chuyển về `/vendor/pending`.
  - Người đã đăng nhập mở `/login` hoặc `/vendor/pending` sai role được chuyển về khu vực của mình.
- **Luồng duyệt vendor**, 8 ca đạt:
  - DB = APPROVED, JWT = PENDING: `/vendor/pending` hiện màn hình "approved" và tự chuyển.
  - `POST /api/auth/session` (tương đương `update()`) kèm payload giả `{vendorStatus: SUSPENDED, role: ADMIN}`: token được làm mới thành APPROVED từ DB, role vẫn là VENDOR (payload giả bị bỏ qua).
  - Đăng nhập lại: đi thẳng `/vendor/dashboard`.
- Dữ liệu test `@step5.covet.test` đã dọn. Các file script tạm đã xóa.

**Phát hiện khi test**
- Ở production (`next start`), Auth.js yêu cầu `AUTH_TRUST_HOST=true` hoặc `AUTH_URL`. Thiếu thì gặp lỗi `UntrustedHost`: không đăng nhập được, dù `authorize` đúng.
- `.env` có `NEXTAUTH_URL=http://localhost:3000`. URL này phải khớp đúng cổng/domain đang chạy.

**Quyết định (theo phạm vi spec)**
- Checkbox Terms mặc định **không tick** (mockup vẽ ở trạng thái đã tick), vì đồng ý điều khoản phải là hành động chủ động.
- Nút ẩn/hiện mật khẩu có ở mọi form (mockup storefront chỉ vẽ icon tĩnh).
- Header storefront ghi "Hello, Guest / Sign in" (link tới `/login`) thay cho "Hello, Test". Giỏ hàng hiện 0 / $0.00.
- Nội dung FAQ #1 được sửa cho khớp form mới (không còn phone) và bước duyệt store.
- Form vendor: Full name, Store name, Email (chiếm 2 cột), Password, Confirm password. Nút "Create store".
- Placeholder ảnh trong mockup được giữ nguyên ("seller lifestyle image", "seller illustration", "app mockup"), chờ có ảnh thật.
- Nút đăng xuất trên `/vendor/pending` sẽ thêm ở Bước 7 (`signOutAction`).

**File**
- `app/globals.css`, `app/layout.tsx`
- `app/(storefront)/{layout,login/page,register/page}.tsx`
- `app/(seller)/vendor/{login,register,pending}/page.tsx`
- `app/(admin)/admin/login/page.tsx`
- `app/actions/auth.ts` (thêm `loginAction`)
- `components/**` (mới)
- `lib/auth/{guards,messages,credentials}.ts`, `lib/validation/auth.ts`
- `docs/DESIGN_SYSTEM.md` (§15)

**Thủ công**
- **Điền `AUTH_SECRET`** trong `.env` (bắt buộc; hiện vẫn trống).
- Khi chạy thử production local bằng `next start`: thêm `AUTH_TRUST_HOST=true`. Khi chạy dev, sửa `NEXTAUTH_URL` cho đúng cổng thực tế (mặc định là 3000, đang khớp).

## Bước 6 — Bảo vệ route ✅

**Đã làm**
- **`lib/auth/roles.ts`**: thêm `requiredRoleForPath`:

  | Đường dẫn | Role yêu cầu |
  |---|---|
  | `/dashboard/*` | CUSTOMER |
  | `/vendor/dashboard/*`, `/vendor/pending` | VENDOR |
  | `/admin/*` (trừ `/admin/login`) | ADMIN |
  | Còn lại | Công khai |

- **`auth.config.ts`**: callback `authorized`, chỉ kiểm tra role từ token.
  - Trang auth + đã đăng nhập: chuyển về `getRoleHome`.
  - Trang bảo vệ + chưa đăng nhập: chuyển tới trang login của khu vực đó, kèm `callbackUrl` (pathname + search).
  - Sai role: chuyển về `getRoleHome` của chính user.
- **`proxy.ts`**: `export default NextAuth(authConfig).auth`, chỉ import `auth.config`. Matcher gồm `/dashboard/:path*`, `/vendor/:path*`, `/admin/:path*`, `/login`, `/register`.
- **`lib/auth/guards.ts`** (bọc React `cache`, mỗi request chỉ tra một lần):
  - `requireRole(role)`: chưa đăng nhập thì về trang login của role; sai role thì về home của user.
  - `requireApprovedVendor()`: đọc `Vendor.status` từ DB; khác APPROVED hoặc không có store thì về `/vendor/pending`.
- **Layout bảo vệ**:
  - `app/(account)/dashboard/layout.tsx`: `requireRole("CUSTOMER")`
  - `app/(seller)/vendor/dashboard/layout.tsx`: `requireApprovedVendor()`
  - `app/(admin)/admin/(protected)/layout.tsx`: `requireRole("ADMIN")`. `/admin/login` nằm ngoài group này.
- `/vendor/pending` chuyển sang dùng `requireRole("VENDOR")`.

**Lưu ý kỹ thuật** (theo tài liệu Next 16, guide authentication, mục "Layouts and auth checks")
- Layout **không render lại** khi điều hướng phía client giữa các trang con, nên kiểm tra ở layout không chạy ở mọi lần chuyển trang.
- Proxy thì chạy ở mọi request, nên role luôn được kiểm tra. Riêng trạng thái vendor từ DB chỉ được kiểm tra khi layout render.
- Vì vậy các trang được bảo vệ cũng gọi guard (`cache` giúp không bị query lặp). Bước 7 áp dụng cho các trang giữ chỗ; các trang vendor sau này cũng phải làm vậy.

**Kiểm tra**
- `npx tsc --noEmit`: OK.
- Eslint cho code dự án: OK.
  - `npx eslint .` báo 2 lỗi trong `designs/support.js`. Đó là file runtime của bộ mockup, có sẵn từ trước, không phải code auth. Xử lý ở Bước 8.
- `npm run build`: OK, có `ƒ Proxy (Middleware)`.
- Bundle proxy (`.next/server/middleware.js` và các chunk mà nó trace tới): **không** tham chiếu Prisma hay bcrypt.
- **Ma trận HTTP, 40/40 ca đạt**, trên server production (secret tạm, trusted host):
  - Chưa đăng nhập vào khu vực bảo vệ: chuyển tới trang login đúng khu vực, kèm `callbackUrl` đã encode (giữ cả query).
  - Sai role: chuyển về home của chính user (customer về `/dashboard`, vendor PENDING về `/vendor/pending`, admin về `/admin/dashboard`).
  - Đã đăng nhập mở bất kỳ trang auth nào: chuyển về home.
  - `/admin/login` công khai; `/administrator` không bị match.
  - Các trang dashboard chưa có (Bước 7), nên "được phép" hiển thị là 404.
- Dữ liệu test `@step6.covet.test` đã dọn.

**File**
- `proxy.ts` (mới), `auth.config.ts`
- `lib/auth/roles.ts`, `lib/auth/guards.ts`
- `app/(account)/dashboard/layout.tsx`
- `app/(seller)/vendor/dashboard/layout.tsx`
- `app/(admin)/admin/(protected)/layout.tsx`
- `app/(seller)/vendor/pending/page.tsx`

**Thủ công:** không có. Nhắc lại: `AUTH_SECRET` trong `.env` vẫn trống.

## Bước 7 — Chuyển hướng sau đăng nhập + đăng xuất ✅

**Đã làm**
- **`getRoleHome(user)`** (đã có từ Bước 3, `lib/auth/roles.ts`):

  | Role | Trang về |
  |---|---|
  | CUSTOMER | `/dashboard` |
  | VENDOR | `/vendor/dashboard` nếu APPROVED, ngược lại `/vendor/pending` |
  | ADMIN | `/admin/dashboard` |

  Được dùng ở:
  - `loginAction`, thông qua `safeCallbackUrl`.
  - Proxy (`authorized`): chuyển hướng khi sai role và trên các trang auth.
  - `redirectIfSignedIn` trên các trang login/register.
  - `requireRole` khi sai role.
- **`signOutAction`** (`app/actions/auth.ts`): đọc role từ session rồi gọi `signOut({ redirectTo: loginPathForRole(role) })`, tức về `/login`, `/vendor/login` hoặc `/admin/login`. Redirect không bị bắt lại.
- **`components/auth/SignOutButton.tsx`**: `<form action={signOutAction}>`, dùng `useFormStatus` để disabled và hiện "Signing out…" khi đang xử lý.
- **Trang giữ chỗ** (trước đó chưa tồn tại), chỉ gồm tiêu đề và nút đăng xuất:
  - `app/(account)/dashboard/page.tsx` ("My account")
  - `app/(seller)/vendor/dashboard/page.tsx` ("Seller dashboard")
  - `app/(admin)/admin/(protected)/dashboard/page.tsx` ("Admin dashboard")

  Mỗi trang gọi lại guard (`requireRole` hoặc `requireApprovedVendor`), vì layout không chạy lại khi điều hướng phía client.
- **`/vendor/pending`**: thêm nút "Sign out" cạnh "Check status again" (trạng thái PENDING / SUSPENDED / không có store). Ẩn khi đang tự chuyển sang dashboard.

**Kiểm tra**
- `tsc`, eslint (code dự án), `npm run build`: OK. Có 12 route, trong đó có `/dashboard`, `/vendor/dashboard`, `/admin/dashboard`, cùng Proxy.
- **Server production với `AUTH_SECRET` thật trong `.env`, 12/12 ca đạt:**
  - Khách hàng: `/dashboard` hiện trang giữ chỗ. Đăng xuất về `/login` và cookie session bị xóa.
  - Vendor PENDING vào `/vendor/dashboard`: layout chuyển về `/vendor/pending` (307). Trang pending có nút đăng xuất.
  - DB đổi sang APPROVED (token vẫn ghi PENDING): `/vendor/dashboard` trả 200. Layout đọc trạng thái từ DB, không từ JWT.
  - DB đổi sang SUSPENDED: `/vendor/dashboard` chuyển về `/vendor/pending`, trang hiện thông báo bị khóa.
  - Vendor đăng xuất: về `/vendor/login`, cookie bị xóa.
  - Admin: đăng nhập vào `/admin/dashboard`, đăng xuất về `/admin/login`, cookie bị xóa.
  - Khách hàng đăng nhập không kèm callbackUrl: về `/dashboard`.
- Log server không có lỗi `[auth]`. Dữ liệu test `@step7.covet.test` đã dọn.

**Lưu ý (đặc điểm của JWT session, không phải lỗi)**
- Đăng xuất xóa cookie trên trình duyệt. Nhưng nếu ai đó đã sao chép token trước đó, token vẫn hợp lệ cho tới khi hết hạn (mặc định 30 ngày), vì JWT không thu hồi được phía server.
- Trạng thái vendor luôn được đọc từ DB nên không bị ảnh hưởng.
- Muốn thu hồi được session thì phải dùng database session. Spec đã chọn JWT, nên không làm.

**File**
- `app/actions/auth.ts` (thêm `signOutAction`)
- `components/auth/SignOutButton.tsx`
- `app/(account)/dashboard/page.tsx`
- `app/(seller)/vendor/dashboard/page.tsx`
- `app/(admin)/admin/(protected)/dashboard/page.tsx`
- `app/(seller)/vendor/pending/page.tsx`

**Thủ công:** không có. `AUTH_SECRET` đã được điền (xác nhận có giá trị, không đọc nội dung).

## Bước 8 — Kiểm tra ✅

**Tự động**

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | OK |
| `npm run lint` | OK |
| `npm run build` | OK: 12 route và `ƒ Proxy (Middleware)` |
| `npx tsx --env-file=.env scripts/verify-auth.ts` | **31/31 PASS**; dọn 3 user test (vendor bị xóa theo cascade) |
| `npx prisma migrate status` | "Database schema is up to date!" |

- **Về `npm run lint`:** ban đầu báo 2 lỗi trong `designs/support.js` (file runtime của mockup, có từ commit đầu). Theo quyết định của anh/chị, tôi đã thêm `"designs/**"` vào `globalIgnores` trong `eslint.config.mjs`.
- **Nội dung `scripts/verify-auth.ts`** (gọi trực tiếp `lib/auth/register.ts` và `verifyCredentials`, cũng là hàm `authorize()` của Credentials):
  - Đăng ký khách hàng: email được chuẩn hóa, role CUSTOMER, hash bcrypt cost 12, không có dòng Vendor.
  - Đăng ký 2 vendor cùng tên cửa hàng: status PENDING, role VENDOR, slug `verify-script-studio` và `verify-script-studio-2`, session mang `vendorId`, home là `/vendor/pending`.
  - Email trùng (khác hoa/thường, khác role): bị từ chối, không để lại dòng thừa.
  - Mật khẩu yếu (không có số, không có chữ, ngắn) và `confirmPassword` không khớp: bị từ chối, không tạo user.
  - Sai mật khẩu, email không tồn tại, input sai định dạng: đều trả `null`, và đều ra cùng thông báo "Invalid email or password".
  - `callbackUrl` độc hại hoặc thuộc role khác bị bỏ qua.
- Sau khi chạy: DB có đúng 1 ADMIN, 0 user test còn sót.
- Các bước 5–7 còn có test HTTP end-to-end trên server production (form, proxy 40 ca, duyệt vendor, đăng xuất). Đều đạt; chi tiết ở từng bước phía trên.

**Checklist thủ công** (`npm run dev`, mở http://localhost:3000)
1. `/register`: đăng ký khách hàng (nhớ tick Terms), được đưa vào `/dashboard` ("My account").
2. Đăng xuất. `/vendor/register`: đăng ký vendor, được đưa vào `/vendor/pending` ("Your store is under review"). Mở `/vendor/dashboard` sẽ bị đưa lại `/vendor/pending`.
3. Duyệt vendor trong DB (xem lệnh bên dưới). Tải lại `/vendor/pending`: tự chuyển tới `/vendor/dashboard` mà không cần đăng nhập lại.
4. `/admin/login` với `admin@covet.local` và mật khẩu seed: vào `/admin/dashboard`.
5. Đăng nhập bằng khách hàng rồi mở `/vendor/dashboard`, `/admin/dashboard`, `/admin/anything`: đều bị đưa về `/dashboard`.
6. Nhập sai mật khẩu: toast "Invalid email or password". Đăng ký bằng email đã có: "This email is already registered" hiện dưới ô Email.
7. Đăng xuất ở cả 3 role: về đúng `/login`, `/vendor/login`, `/admin/login`.
8. Tải lại trang (F5) khi đang đăng nhập: vẫn giữ session.
9. `http://localhost:3000/login?callbackUrl=https://evil.com`: đăng nhập khách hàng xong về `/dashboard`, không sang evil.com.

**Lệnh duyệt vendor**

Xem vendor hiện có:
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

Hoặc dùng Prisma Studio: chạy `npx prisma studio`, mở bảng **Vendor**, sửa `status` thành `APPROVED`, rồi bấm **Save 1 change**.

**File (bước này)**
- `scripts/verify-auth.ts` (mới)
- `eslint.config.mjs` (thêm ignore `designs/**`)

---

## Việc còn tồn đọng / ghi chú cho các phiên sau
- **Trang dashboard:** `/dashboard`, `/vendor/dashboard`, `/admin/dashboard` mới là trang giữ chỗ. Khi xây trang thật trong các khu vực này, **mỗi page phải gọi guard** (`requireRole` hoặc `requireApprovedVendor`), không chỉ dựa vào layout.
- **Production:** cần `AUTH_SECRET`, cùng `AUTH_TRUST_HOST=true` hoặc `AUTH_URL`. `NEXTAUTH_URL` phải khớp domain/cổng thật.
- **JWT session:** đăng xuất không thu hồi được token đã bị sao chép (hết hạn sau 30 ngày mặc định).
- **Chưa làm (ngoài phạm vi spec):** OAuth, xác minh email, quên mật khẩu, rate limiting, UI admin duyệt vendor.
- **Package:** lucide-react và shadcn/ui chưa cài; icon đang là SVG inline trong `components/icons.tsx`.
- **`npm audit`:** 3 lỗi high trong `deepmerge-ts` (phụ thuộc của Prisma), chưa xử lý.
