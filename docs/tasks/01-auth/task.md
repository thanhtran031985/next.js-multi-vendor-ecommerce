# 01 — Xác thực đa vai trò (auth)

> Quy trình làm việc, quy tắc code và cách chuyển thiết kế x-dc: xem `CLAUDE.md`.
> Tiến độ: `docs/tasks/01-auth/progress.md`.

## Mục tiêu
Xây dựng HOÀN CHỈNH hệ thống xác thực đa vai trò cho Covet: CUSTOMER, VENDOR, ADMIN.

## Thiết kế
Giao diện CHÍNH XÁC của các trang xác thực, nằm trong `designs/` (định dạng x-dc):
- `designs/Login.dc.html`          → đăng nhập khách hàng
- `designs/Register.dc.html`       → đăng ký khách hàng
- `designs/VendorLogin.dc.html`    → đăng nhập người bán
- `designs/VendorRegister.dc.html` → đăng ký người bán
- `designs/AdminLogin.dc.html`     → đăng nhập admin (NẾU có; nếu không thì theo phong
  cách trang đăng nhập khách hàng)
Tên file ở trên là dự kiến. Ở Bước 0, đối chiếu với tên thật trong `designs/` và báo
lại bảng ánh xạ. Nếu không tìm thấy file cho trang nào trong 4 trang đầu: DỪNG và hỏi.
Admin KHÔNG có trang đăng ký — admin được tạo bằng seed.
Chỉ đọc các file thiết kế liên quan đến auth, không đọc các file Admin*/trang khác.

## Môi trường (đã cài sẵn — không cài lại)
- MySQL, database `covetecom` đã được tạo.
- Đã cài: next-auth@beta, bcryptjs, zod, mysql2, react-hot-toast, prisma + @prisma/client.
  (@auth/prisma-adapter đã cài nhưng KHÔNG dùng — xem bên dưới.)
- Tạo hoặc bổ sung `.env.example` với các biến dưới đây, rồi nói tôi copy sang `.env`
  và điền giá trị (không tự đọc `.env`):
  ```
  DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/covetecom"
  AUTH_SECRET=""            # tạo bằng lệnh: npx auth secret
  ADMIN_EMAIL="admin@covet.local"
  ADMIN_PASSWORD=""         # tối thiểu 12 ký tự
  ```
- `prisma migrate dev` cần shadow database, nên user MySQL phải có quyền CREATE.
  Nếu migration lỗi vì lý do này, dừng lại và báo tôi.

## Quyết định kiến trúc (làm đúng theo)
- MỘT bảng User với enum role: CUSTOMER | VENDOR | ADMIN.
- Một email = một tài khoản = một role. Đăng ký vendor bằng email đã được khách hàng
  dùng (hoặc ngược lại) bị từ chối với thông báo "email đã được đăng ký".
- VENDOR là một User (role=VENDOR) liên kết 1:1 với một bản ghi Vendor (cửa hàng).
- NextAuth v5 CHỈ xử lý ĐĂNG NHẬP (Credentials provider). ĐĂNG KÝ là server action riêng:
  validate, hash mật khẩu (bcryptjs) và tạo user.
- Session JWT. KHÔNG dùng database adapter (Credentials + JWT không cần; PrismaAdapter
  áp đặt schema User riêng). Không tạo model Account/Session/VerificationToken.
- Tách cấu hình NextAuth (để middleware/proxy không bao giờ import Prisma hoặc bcrypt):
  - `auth.config.ts` — an toàn cho edge: pages, callbacks (jwt/session/authorized),
    KHÔNG có provider đụng tới Prisma/bcrypt, KHÔNG import Prisma.
  - `auth.ts` — spread auth.config và thêm Credentials provider (Prisma + bcrypt).
  - middleware.ts / proxy.ts CHỈ import từ auth.config.ts.
- Trạng thái vendor (PENDING | APPROVED | SUSPENDED):
  - DATABASE là nguồn dữ liệu chuẩn, không phải JWT.
  - Middleware/proxy chỉ kiểm tra role (từ token).
  - Layout của /vendor/dashboard đọc lại Vendor.status từ DB ở mỗi request.
    Không phải APPROVED → chuyển tới /vendor/pending.
  - Callback jwt làm mới vendorStatus từ DB khi `trigger === "update"`.
  - Vendor PENDING và SUSPENDED vẫn đăng nhập được nhưng chỉ thấy /vendor/pending,
    hiển thị thông báo theo trạng thái (đang chờ duyệt / bị khóa). Nếu /vendor/pending
    thấy DB có status=APPROVED, gọi update() và chuyển tới /vendor/dashboard.
- Cả ba role dùng CHUNG logic xác thực và CHUNG session, chỉ khác trang chuyển hướng sau
  đăng nhập. Đăng nhập ở "sai" trang (vd khách hàng ở /vendor/login) vẫn được phép,
  chỉ chuyển hướng về khu vực của chính user đó.

## Các bước

### Bước 0 — Kiểm tra dự án (không sửa code)
Báo cáo:
- Phiên bản chính xác của: next, next-auth, prisma, @prisma/client, tailwindcss.
- Tailwind v3 (tailwind.config.*) hay v4 (@theme trong CSS).
- Prisma v7+ (prisma.config.ts) hay bản cũ hơn.
- Next.js v16+ (proxy.ts thay cho middleware.ts) hay không.
- Cấu trúc thư mục hiện có trong /app, /prisma, /docs.
- Bảng ánh xạ: trang auth → tên file thiết kế thật trong `designs/` (chỉ liệt kê tên,
  chưa cần đọc nội dung).
Điều chỉnh các bước sau theo các phiên bản này. Ghi kết quả vào progress.md.

### Bước 1 — Prisma schema
- Các model:
  - User: id, name, email (@unique), passwordHash, role (enum, mặc định CUSTOMER),
    createdAt, updatedAt, vendor Vendor?
  - Vendor: id, userId (@unique, quan hệ tới User, onDelete: Cascade), storeName,
    slug (@unique), status (enum, mặc định PENDING), createdAt, updatedAt.
- Chạy `npx prisma migrate dev --name auth_init` và `npx prisma generate`.
- Kiểm tra: migration thành công và `npx prisma migrate status` sạch.

### Bước 2 — Seed admin
- `prisma/seed.ts` upsert MỘT User admin (role=ADMIN), mật khẩu hash bcrypt (cost 12),
  đọc ADMIN_EMAIL / ADMIN_PASSWORD từ env.
- Nếu ADMIN_PASSWORD trống: development → tạo mật khẩu ngẫu nhiên và in ra một lần;
  production → throw lỗi. Không bao giờ in chuỗi hash.
- Khai báo lệnh seed đúng chỗ theo phiên bản Prisma
  (Prisma 7+: prisma.config.ts; bản cũ: "prisma.seed" trong package.json).
- Kiểm tra: chạy seed hai lần (phải idempotent), truy vấn xác nhận có đúng một dòng ADMIN.

### Bước 3 — Cấu hình NextAuth v5
- auth.config.ts và auth.ts như phần Quyết định kiến trúc.
- authorize(): validate bằng Zod, tìm user theo email, xác minh bằng bcrypt.compare.
  Mọi thất bại trả về null với CÙNG thông báo chung ("Email hoặc mật khẩu không đúng").
  Vẫn chạy bcrypt khi user không tồn tại (so với hash giả) để tránh chênh lệch thời gian.
- callbacks.jwt: khi đăng nhập, gắn id, role, vendorId, vendorStatus.
  Khi trigger === "update": đọc lại vendorStatus từ DB (trong ngữ cảnh auth.ts, không
  phải cấu hình edge).
- callbacks.session: đưa id, role, vendorId, vendorStatus vào session.user.
- Export handlers, auth, signIn, signOut. Tạo app/api/auth/[...nextauth]/route.ts.
- Module augmentation (next-auth và next-auth/jwt) để các trường có kiểu.
- Kiểm tra: `npx tsc --noEmit` không lỗi.

### Bước 4 — Đăng ký (server actions)
- Zod schema dùng chung:
  - name: 2–80 ký tự; email: hợp lệ, chữ thường + cắt khoảng trắng;
  - password: tối thiểu 8 ký tự, ít nhất một chữ cái và một chữ số;
  - riêng vendor: storeName 2–80 ký tự.
- Đăng ký khách hàng: validate → kiểm tra email → hash → tạo User(role=CUSTOMER)
  → signIn("credentials", { redirectTo: "/dashboard" }).
- Đăng ký vendor: tạo User(role=VENDOR) + Vendor(status=PENDING) trong một
  prisma.$transaction. Slug từ storeName (slugify; trùng thì thêm -2, -3, …).
  signIn với redirectTo "/vendor/pending".
- QUAN TRỌNG: signIn() throw một redirect. Chỉ bắt AuthError / lỗi đã biết, throw lại
  mọi lỗi khác.
- Bắt lỗi Prisma P2002 → "email đã được đăng ký" (phòng race condition).
- Trả lỗi dạng { fieldErrors, formError }.
- Kiểm tra: `npx tsc --noEmit` không lỗi.

### Bước 5 — Các trang (chuyển từ thiết kế)
Dùng bảng ánh xạ đã xác nhận ở Bước 0:
- /register        (khách hàng) ← thiết kế đăng ký khách hàng
- /login           (khách hàng) ← thiết kế đăng nhập khách hàng
- /vendor/register (người bán)  ← thiết kế đăng ký người bán
- /vendor/login    (người bán)  ← thiết kế đăng nhập người bán
- /admin/login     (admin)      ← thiết kế admin login nếu có, nếu không thì theo phong
  cách login; không có link đăng ký
- /vendor/pending  (người bán)  ← trang đơn giản cùng phong cách
Bỏ hộp thông tin đăng nhập demo trong thiết kế. Ảnh cần dùng từ `designs/uploads/`
→ copy sang `public/`.
Mỗi form: client component, useActionState (hoặc tương đương), nút vô hiệu hóa +
loading khi đang gửi, lỗi Zod dưới từng trường, react-hot-toast khi có formError.
<Toaster /> chỉ mount một lần (root layout nếu chưa có).
User đã đăng nhập vào trang login/register → chuyển về khu vực của họ.
- Kiểm tra: `npm run build` không lỗi; liệt kê mọi token đã thêm hoặc ánh xạ.

### Bước 6 — Bảo vệ route (middleware/proxy + layout)
- middleware.ts (Next ≤15) hoặc proxy.ts (Next 16+), CHỈ import auth.config.
- Quy tắc:
  - /dashboard/*        → role=CUSTOMER
  - /vendor/dashboard/* → role=VENDOR (trạng thái kiểm tra trong layout)
  - /vendor/pending     → role=VENDOR
  - /admin/*            → role=ADMIN, trừ /admin/login
  - Công khai: /login, /register, /vendor/login, /vendor/register, /admin/login
- Chuyển hướng:
  - Chưa đăng nhập → trang đăng nhập của khu vực đó, kèm callbackUrl.
  - Sai role → dashboard CỦA CHÍNH HỌ.
- callbackUrl: chỉ chấp nhận đường dẫn tương đối bắt đầu bằng "/" (không phải "//") và
  thuộc khu vực của role đó; nếu không thì dùng trang mặc định của role.
- Kiểm tra phía server ở từng layout được bảo vệ (phòng thủ nhiều lớp):
  app/dashboard/layout.tsx, app/vendor/dashboard/layout.tsx (+ kiểm tra trạng thái
  trong DB), app/admin/(protected)/layout.tsx (hoặc cách nhóm tương đương).

### Bước 7 — Chuyển hướng sau đăng nhập + đăng xuất
- Helper `getRoleHome(user)`: CUSTOMER → /dashboard; VENDOR → /vendor/dashboard nếu
  APPROVED, ngược lại /vendor/pending; ADMIN → /admin/dashboard.
- Dùng sau đăng nhập, trong chuyển hướng sai role, và trên các trang xác thực.
- Nút đăng xuất (server action) xóa session, chuyển về trang đăng nhập của role đó.
- Trang giữ chỗ tối giản cho /dashboard, /vendor/dashboard, /admin/dashboard CHỈ KHI
  chưa tồn tại (tiêu đề + nút đăng xuất).

### Bước 8 — Kiểm tra tổng
Tự động (chạy và dán kết quả):
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Script nhỏ (tsx/ts-node, không cài thêm thư viện trừ khi tôi đồng ý) kiểm tra logic
  server: đăng ký khách hàng, đăng ký vendor (Vendor là PENDING, slug duy nhất), email
  trùng bị từ chối, mật khẩu yếu bị từ chối, authorize() sai mật khẩu trả thông báo
  chung. Dọn dữ liệu test sau khi chạy.

Checklist thủ công cho tôi (ghi vào progress.md):
- Đăng ký khách hàng → vào /dashboard
- Đăng ký vendor → /vendor/pending → không mở được /vendor/dashboard
- Duyệt vendor trong DB (đưa lệnh SQL/Prisma chính xác) → tải lại /vendor/pending →
  vào /vendor/dashboard mà không cần đăng nhập lại
- Admin đã seed → /admin/dashboard
- Khách hàng không vào được /vendor/dashboard hay /admin/* (về /dashboard)
- Sai mật khẩu báo lỗi gọn; email trùng bị từ chối
- Đăng xuất đúng với cả ba role, quay về đúng trang đăng nhập
- Tải lại trang vẫn giữ session
- callbackUrl giả mạo (vd ?callbackUrl=https://evil.com) bị bỏ qua

Sửa mọi lỗi ở phần tự động trước khi báo hoàn thành.

## Phạm vi
- Được tạo/sửa: schema Prisma (User, Vendor), seed, cấu hình NextAuth, server action
  đăng ký, các trang xác thực, middleware/proxy, layout được bảo vệ, dashboard giữ chỗ,
  theme token, `.env.example`.
- KHÔNG làm trong task này: OAuth, xác minh email, đặt lại mật khẩu, rate limiting,
  giao diện admin duyệt vendor.

## Tiêu chí hoàn thành
- Mọi bước trong progress.md là ✅.
- Phần kiểm tra tự động ở Bước 8 không lỗi.
- Checklist thủ công đã được ghi vào progress.md để tôi kiểm tra.