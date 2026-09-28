# Xác thực đa vai trò — Covet

Chúng ta đang xây dựng "Covet", một sàn thương mại điện tử nhiều người bán (multi-vendor)
bằng Next.js (App Router) + TypeScript + Tailwind + Prisma + MySQL. Nhiệm vụ lần này:
xây dựng HOÀN CHỈNH hệ thống xác thực đa vai trò (CUSTOMER, VENDOR, ADMIN).

## QUY TẮC LÀM VIỆC (đọc trước tiên)
- Làm lần lượt từng bước THEO ĐÚNG THỨ TỰ.
- Sau mỗi bước: tự chạy phần kiểm tra được ghi ở bước đó, rồi báo cáo
  (1) đã làm gì, (2) kết quả kiểm tra, (3) việc gì tôi phải tự làm thủ công.
  Sau đó DỪNG LẠI và chờ tôi trả lời "continue" rồi mới sang bước tiếp theo.
- Nếu có quyết định nào mơ hồ, DỪNG LẠI và hỏi. Ngoại lệ: nếu thiếu /docs/PRD.md hoặc
  /docs/DESIGN_SYSTEM.md thì tự suy ra từ các file thiết kế và báo cho tôi biết đã
  suy ra những gì (không cần dừng lại vì việc này).
- Nếu thiếu một file BẮT BUỘC (bất kỳ file nào trong 4 file thiết kế bên dưới),
  DỪNG LẠI và hỏi.
- KHÔNG cài thêm package mới khi chưa hỏi tôi.
- Tạo và duy trì file docs/tasks/auth-progress.md. Sau MỖI bước, cập nhật file này với:
  trạng thái từng bước (⬜ chưa làm / 🔄 đang làm / ✅ xong), tóm tắt việc đã làm,
  kết quả kiểm tra, các file đã tạo/sửa, và việc tôi cần làm thủ công.
- Khi bắt đầu một phiên mới hoặc sau khi compact, ĐỌC file này trước tiên để biết
  đang ở bước nào, rồi tiếp tục từ bước đó.

## BƯỚC 0 — Kiểm tra dự án (không sửa code)
Trước khi viết bất cứ thứ gì, báo cáo:
- Phiên bản chính xác đang cài của: next, next-auth, prisma, @prisma/client, tailwindcss.
- Dự án dùng Tailwind v3 (tailwind.config.*) hay v4 (@theme trong CSS).
- Prisma là v7 trở lên (dùng prisma.config.ts) hay bản cũ hơn.
- Next.js là v16 trở lên (dùng proxy.ts thay cho middleware.ts) hay không.
- Cấu trúc thư mục hiện có trong /app, /prisma, /docs, /designs.
- Những file thiết kế nào bên dưới đang tồn tại.
Tạo docs/tasks/auth-progress.md với danh sách Bước 0–8 (tất cả ⬜), ghi kết quả
Bước 0 vào đó và đánh dấu ✅.
Điều chỉnh các bước sau cho phù hợp với các phiên bản này. Chờ "continue".

## BỐI CẢNH
1. Đọc /docs/PRD.md và /docs/DESIGN_SYSTEM.md nếu có.
2. Các file thiết kế (là giao diện CHÍNH XÁC của các trang xác thực):
   - designs/login_dc.html          → đăng nhập khách hàng
   - designs/register_dc.html       → đăng ký khách hàng
   - designs/VendorLogin_dc.html    → đăng nhập người bán
   - designs/VendorRegister_dc.html → đăng ký người bán
   Admin KHÔNG có trang đăng ký — admin được tạo bằng seed.
3. Các file này dùng định dạng "x-dc" của Claude Design (một class DCLogic, binding
   {{ }}, <sc-if>/<sc-for>, style inline với mã màu hex cố định). Chúng KHÔNG phải
   React. Hãy chuyển chúng thành các trang Next.js thật:
   - Chuyển markup sang TSX.
   - Chuyển mọi giá trị hex/px inline sang design token (key trong Tailwind theme /
     biến CSS). TUYỆT ĐỐI không giữ mã hex cố định. Nếu một màu chưa có token tương
     ứng, thêm token đó vào theme (v3: tailwind.config, v4: @theme) và liệt kê trong
     báo cáo.
   - Chuyển state của DCLogic (showPw, copyCreds, v.v.) sang state của React client.
   - Bỏ hộp thông tin đăng nhập demo cố định và các liên kết href tĩnh; thay bằng
     submit form thật và chuyển hướng xác thực thật.
   - Khớp thiết kế CHÍNH XÁC — cùng bố cục, khoảng cách, thành phần.

## MÔI TRƯỜNG (đã cài đặt sẵn — không cài lại)
- DB: MySQL, database "covetecom", đã được tạo.
- Đã cài: next-auth@beta, bcryptjs, zod, mysql2, react-hot-toast,
  prisma + @prisma/client. (@auth/prisma-adapter đã cài nhưng KHÔNG dùng — xem bên dưới.)
- File .env phải có các biến dưới đây. Nếu .env chưa có hoặc thiếu biến, tạo mới/
  bổ sung giá trị giữ chỗ và nói rõ cho tôi cần điền gì:
  ```
  DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/covetecom"
  AUTH_SECRET=""            # tạo bằng lệnh: npx auth secret
  ADMIN_EMAIL="admin@covet.local"
  ADMIN_PASSWORD=""         # tối thiểu 12 ký tự
  ```
- Lưu ý: `prisma migrate dev` cần shadow database, nên user MySQL phải có quyền
  CREATE. Nếu migration lỗi vì lý do này, dừng lại và báo tôi.

## QUYẾT ĐỊNH KIẾN TRÚC (làm đúng theo)
- MỘT bảng User với enum role: CUSTOMER | VENDOR | ADMIN.
- Một email = một tài khoản = một role. Đăng ký vendor bằng email đã được khách hàng
  dùng (hoặc ngược lại) sẽ bị từ chối với thông báo "email đã được đăng ký".
- VENDOR là một User (role=VENDOR) liên kết 1:1 với một bản ghi Vendor (cửa hàng).
- NextAuth v5 CHỈ xử lý ĐĂNG NHẬP (Credentials provider). ĐĂNG KÝ là một server action
  riêng: validate, hash mật khẩu (bcryptjs) và tạo user.
- Dùng chiến lược session JWT. KHÔNG dùng database adapter: Credentials + JWT không
  cần adapter, và PrismaAdapter sẽ áp đặt schema User riêng của nó. Không tạo các
  model Account/Session/VerificationToken.
- Tách cấu hình NextAuth (bắt buộc, để middleware/proxy không bao giờ import Prisma
  hoặc bcrypt):
  - `auth.config.ts` — an toàn cho edge: pages, callbacks (jwt/session/authorized),
    KHÔNG có provider nào đụng tới Prisma/bcrypt, KHÔNG import Prisma.
  - `auth.ts` — spread auth.config và thêm Credentials provider (Prisma + bcrypt).
  - middleware.ts / proxy.ts CHỈ import từ auth.config.ts.
- Trạng thái vendor (PENDING | APPROVED | SUSPENDED):
  - DATABASE là nguồn dữ liệu chuẩn cho trạng thái vendor, không phải JWT.
  - Middleware/proxy chỉ kiểm tra role (từ token).
  - Layout của /vendor/dashboard đọc lại Vendor.status từ DB ở mỗi request.
    Nếu không phải APPROVED → chuyển hướng tới /vendor/pending.
  - Callback jwt cũng làm mới vendorStatus từ DB khi `trigger === "update"`, để phía
    client có thể gọi `update()` sau khi được duyệt.
  - Vendor PENDING và SUSPENDED vẫn đăng nhập được nhưng chỉ thấy /vendor/pending,
    trang này hiển thị thông báo theo trạng thái (đang chờ duyệt / bị khóa). Nếu
    /vendor/pending thấy DB có status=APPROVED, nó gọi update() và chuyển hướng tới
    /vendor/dashboard.
- Cả ba role dùng CHUNG logic xác thực và CHUNG session. Chỉ khác nhau ở trang chuyển
  hướng sau khi đăng nhập. Đăng nhập ở "sai" trang (ví dụ khách hàng đăng nhập ở
  /vendor/login) vẫn được phép, chỉ đơn giản là chuyển hướng về khu vực của chính
  user đó.

## BƯỚC 1 — Prisma schema
- Các model:
  - User: id, name, email (@unique), passwordHash, role (enum, mặc định CUSTOMER),
    createdAt, updatedAt, vendor Vendor?
  - Vendor: id, userId (@unique, quan hệ tới User, onDelete: Cascade), storeName,
    slug (@unique), status (enum, mặc định PENDING), createdAt, updatedAt.
- Chạy `npx prisma migrate dev --name auth_init` và `npx prisma generate`.
- Kiểm tra: migration chạy thành công và `npx prisma migrate status` sạch.

## BƯỚC 2 — Seed admin
- prisma/seed.ts upsert MỘT User admin (role=ADMIN) với mật khẩu hash bằng bcrypt
  (cost 12), đọc ADMIN_EMAIL / ADMIN_PASSWORD từ env.
- Nếu ADMIN_PASSWORD trống: ở môi trường development, tạo mật khẩu ngẫu nhiên và in ra
  một lần; ở production, throw lỗi. Không bao giờ in ra chuỗi hash.
- Khai báo lệnh seed đúng chỗ theo phiên bản Prisma đang cài
  (Prisma 7+: prisma.config.ts; bản cũ hơn: "prisma.seed" trong package.json).
- Kiểm tra: chạy seed hai lần (phải idempotent) và truy vấn xác nhận có đúng một
  dòng ADMIN.

## BƯỚC 3 — Cấu hình NextAuth v5
- auth.config.ts và auth.ts như mô tả ở trên.
- authorize(): validate input bằng Zod, tìm user theo email, xác minh bằng
  bcrypt.compare. Mọi trường hợp thất bại đều trả về null với CÙNG một thông báo
  chung ("Email hoặc mật khẩu không đúng") — không để lộ email nào đã tồn tại.
  Vẫn chạy bcrypt ngay cả khi user không tồn tại (so với một hash giả) để tránh
  chênh lệch thời gian phản hồi.
- callbacks.jwt: khi đăng nhập, gắn id, role, vendorId, vendorStatus.
  Khi trigger === "update": đọc lại vendorStatus từ DB (việc này nằm trong ngữ cảnh
  auth.ts, không phải cấu hình edge — tổ chức code cho phù hợp).
- callbacks.session: đưa id, role, vendorId, vendorStatus vào session.user.
- Export handlers, auth, signIn, signOut. Tạo app/api/auth/[...nextauth]/route.ts.
- Thêm module augmentation (next-auth và next-auth/jwt) để các trường này có kiểu.
- Kiểm tra: `npx tsc --noEmit` chạy không lỗi.

## BƯỚC 4 — Đăng ký (server actions)
- Các Zod schema dùng chung trong một file, dùng cho cả server action lẫn form phía
  client:
  - name: 2–80 ký tự; email: hợp lệ, chuyển chữ thường + cắt khoảng trắng;
  - password: tối thiểu 8 ký tự, có ít nhất một chữ cái và một chữ số;
  - riêng vendor: storeName 2–80 ký tự.
- Đăng ký khách hàng: validate → kiểm tra email chưa bị dùng → hash → tạo
  User(role=CUSTOMER) → signIn("credentials", { redirectTo: "/dashboard" }).
- Đăng ký vendor: tương tự, nhưng tạo User(role=VENDOR) + Vendor(status=PENDING)
  trong một prisma.$transaction duy nhất. Sinh slug từ storeName (slugify; nếu trùng
  thì thêm -2, -3, …). Sau đó signIn với redirectTo "/vendor/pending".
- QUAN TRỌNG: signIn() sẽ throw một redirect. Không được nuốt lỗi này: chỉ bắt
  AuthError / các lỗi đã biết, và throw lại mọi lỗi khác.
- Bắt thêm lỗi unique constraint của Prisma (P2002) và báo "email đã được đăng ký"
  (phòng trường hợp race condition).
- Trả lỗi dạng { fieldErrors, formError } để phía client hiển thị.
- Kiểm tra: `npx tsc --noEmit` chạy không lỗi.

## BƯỚC 5 — Các trang (chuyển từ thiết kế)
- /register        (khách hàng) ← register_dc.html
- /login           (khách hàng) ← login_dc.html
- /vendor/register (người bán)  ← VendorRegister_dc.html
- /vendor/login    (người bán)  ← VendorLogin_dc.html
- /admin/login     (admin)      ← theo phong cách thiết kế login, không có link đăng ký
- /vendor/pending  (người bán)  ← trang đơn giản cùng phong cách giao diện
Mỗi form: client component, dùng useActionState (hoặc tương đương), nút bị vô hiệu
hóa + trạng thái loading khi đang gửi, lỗi Zod hiển thị ngay dưới từng trường,
react-hot-toast khi có formError.
Đảm bảo <Toaster /> chỉ được mount một lần (trong root layout nếu chưa có).
User đã đăng nhập mà vào bất kỳ trang login/register nào sẽ được chuyển về khu vực
của chính họ.
- Kiểm tra: `npm run build` chạy không lỗi; liệt kê mọi token đã thêm hoặc ánh xạ.

## BƯỚC 6 — Bảo vệ route (middleware/proxy + layout)
- Dùng middleware.ts (Next ≤15) hoặc proxy.ts (Next 16+), CHỈ import auth.config.
- Quy tắc:
  - /dashboard/*        → role=CUSTOMER, nếu không thì theo quy tắc chuyển hướng
  - /vendor/dashboard/* → role=VENDOR (trạng thái được kiểm tra trong layout, không
    phải ở đây)
  - /vendor/pending     → role=VENDOR
  - /admin/*            → role=ADMIN, trừ /admin/login
  - Công khai: /login, /register, /vendor/login, /vendor/register, /admin/login
- Quy tắc chuyển hướng:
  - Chưa đăng nhập → trang đăng nhập tương ứng với khu vực đó, kèm callbackUrl.
  - Đã đăng nhập nhưng sai role → dashboard CỦA CHÍNH HỌ (không bao giờ hiện trang
    của role khác).
- An toàn callbackUrl: chỉ chấp nhận đường dẫn tương đối bắt đầu bằng "/" (không phải
  "//"), và chỉ khi đường dẫn thuộc khu vực của role đó; nếu không thì dùng trang mặc
  định của role.
- Kiểm tra phía server ở từng layout được bảo vệ nữa (phòng thủ nhiều lớp):
  app/dashboard/layout.tsx, app/vendor/dashboard/layout.tsx (+ kiểm tra trạng thái
  trong DB), app/admin/(protected)/layout.tsx (hoặc cách nhóm tương đương để loại
  /admin/login ra).

## BƯỚC 7 — Chuyển hướng sau đăng nhập + đăng xuất
- Một hàm helper `getRoleHome(user)`:
  CUSTOMER → /dashboard; VENDOR → /vendor/dashboard nếu APPROVED, ngược lại
  /vendor/pending; ADMIN → /admin/dashboard.
- Dùng hàm này sau khi đăng nhập, trong các chuyển hướng sai role ở middleware/proxy,
  và trên các trang xác thực.
- Nút đăng xuất (server action) xóa session và chuyển hướng về trang đăng nhập của
  role đó (/login, /vendor/login, /admin/login).
- Tạo trang giữ chỗ tối giản cho /dashboard, /vendor/dashboard, /admin/dashboard
  CHỈ KHI chúng chưa tồn tại (tiêu đề + nút đăng xuất, không gì thêm).

## BƯỚC 8 — Kiểm tra
Tự động (chạy và dán kết quả):
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Một script nhỏ (tsx/ts-node, không cài thêm thư viện trừ khi tôi đồng ý) kiểm tra
  trực tiếp logic phía server: đăng ký khách hàng, đăng ký vendor (kiểm tra dòng
  Vendor là PENDING và slug là duy nhất), email trùng bị từ chối, mật khẩu yếu bị từ
  chối, authorize() thất bại khi sai mật khẩu với thông báo chung. Dọn dẹp dữ liệu
  test sau khi chạy xong.

Checklist thủ công cho tôi (viết rõ ràng, tôi sẽ tự test trên trình duyệt):
- Đăng ký khách hàng → vào /dashboard
- Đăng ký vendor → vào /vendor/pending → không mở được /vendor/dashboard
- Duyệt vendor trong DB (đưa tôi lệnh SQL/Prisma chính xác) → tải lại
  /vendor/pending → được chuyển tới /vendor/dashboard mà không cần đăng nhập lại
- Đăng nhập bằng admin đã seed → vào /admin/dashboard
- Khách hàng không vào được /vendor/dashboard hay /admin/* (bị chuyển về /dashboard)
- Sai mật khẩu báo lỗi gọn gàng; email trùng bị từ chối
- Đăng xuất hoạt động với cả ba role và quay về đúng trang đăng nhập
- Tải lại trang vẫn giữ session
- callbackUrl bị giả mạo (ví dụ ?callbackUrl=https://evil.com) bị bỏ qua

Sửa mọi lỗi ở phần tự động trước khi báo hoàn thành.

## QUY TẮC CHUNG
- Mọi thao tác ghi DB đều được validate bằng Zod. Mật khẩu luôn được hash bằng bcrypt;
  không bao giờ lưu, log hay trả về dạng văn bản thuần. Không có secret hay import
  Prisma trong client component.
- Chỉ dùng design token — không dùng màu cố định.
- KHÔNG sửa bất cứ thứ gì ngoài phạm vi xác thực (trừ các dashboard giữ chỗ và theme
  token đã nêu ở trên).
- KHÔNG thêm tính năng ngoài yêu cầu: không OAuth, không xác minh email, không đặt lại
  mật khẩu, không giới hạn tần suất (rate limiting), không giao diện admin duyệt
  vendor — trừ khi tôi yêu cầu.
