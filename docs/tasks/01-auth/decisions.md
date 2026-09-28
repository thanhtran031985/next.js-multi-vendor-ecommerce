# Quyết định — 01-auth

<!-- Mỗi quyết định thêm một mục:
### <ngày> — <tiêu đề>
- Bối cảnh:
- Quyết định:
- Lý do:
- Ảnh hưởng:
-->

### 2026-09-28 — Tổng kết: khác biệt so với `task.md` gốc
Task hoàn thành, chủ dự án đã test thủ công. Những điểm khác `task.md` (chi tiết ở các mục bên dưới):

**Đã thêm hoặc sửa sau rà soát**
- Guard đọc lại user từ DB mỗi request, và có route `/auth/session-ended`. User bị xóa hoặc đổi role mất quyền ngay, không chờ token hết hạn.
- Tạo `.env.example`, kèm hướng dẫn `AUTH_TRUST_HOST`/`AUTH_URL` cho production. Thêm `!.env.example` vào `.gitignore`.

**Đã có từ lần làm đầu, ngoài `task.md`**
- Page được bảo vệ cũng gọi guard, không chỉ layout.
- `loginAction` phát hiện lỗi cấu hình của Auth.js.
- Mật khẩu tối đa 72 byte; có `confirmPassword`.
- `scripts/verify-auth.ts` được giữ lại để chạy lại.
- ESLint bỏ qua thư mục `designs/`.

**Khác biệt được chấp nhận, không sửa**
- Thông báo lỗi tiếng Anh.
- Augment `@auth/core/jwt`.
- Lệch thiết kế có chủ đích ở các trang auth.
- Layout đặt theo route group.
- Nhánh git là `feat/multi-role-auth`, không phải `feat/01-auth` như quy ước mới (nhánh đã được tạo trước khi có quy ước).

### 2026-09-28 — Thông báo lỗi bằng tiếng Anh
- **Bối cảnh:** `task.md` (Bước 3, 4) ghi thông báo tiếng Việt: "Email hoặc mật khẩu không đúng", "email đã được đăng ký".
- **Quyết định:** dùng "Invalid email or password" và "This email is already registered" (`lib/auth/messages.ts`).
- **Lý do:** UI của mockup bằng tiếng Anh. Đây là lựa chọn của chủ dự án ở lần làm đầu.
- **Ảnh hưởng:** chỉ khác nội dung chữ. Logic "một thông báo chung cho mọi lỗi đăng nhập" vẫn giữ.
- **Rà soát (Giai đoạn A, mục 3):** **KHÔNG SỬA**, chủ dự án đồng ý ngày 2026-09-28. Lý do: toàn bộ UI bằng tiếng Anh; không có rủi ro.

### 2026-09-28 — Augment `@auth/core/jwt` thay cho `next-auth/jwt`
- **Bối cảnh:** `task.md` Bước 3 yêu cầu augment `next-auth/jwt`.
- **Quyết định:** `types/next-auth.d.ts` dòng 25 augment `@auth/core/jwt`.
- **Lý do:** `next-auth/jwt` chỉ là `export * from "@auth/core/jwt"`, và TypeScript không merge interface qua `export *`. Đã thử và tsc báo lỗi; kiểu chỉ có hiệu lực khi augment đúng module gốc.
- **Ảnh hưởng:** không có. `import type { JWT } from "next-auth/jwt"` vẫn nhận đủ các trường.
- **Rà soát (Giai đoạn A, mục 4):** **KHÔNG SỬA**, chủ dự án đồng ý ngày 2026-09-28.
  - Lý do: làm đúng như `task.md` (augment `next-auth/jwt`) khiến tsc báo lỗi kiểu, vì các trường không được nhận.
  - Cách hiện tại cho đúng kết quả `task.md` mong muốn.
  - Chỉ ảnh hưởng tới kiểm tra kiểu lúc biên dịch, không ảnh hưởng runtime hay bảo mật.

### 2026-09-28 — Lệch thiết kế có chủ đích ở các trang auth
- **Bối cảnh:** `task.md` yêu cầu khớp thiết kế chính xác.
- **Quyết định:**
  - Bỏ nút Google/Facebook, link "Forgot password", checkbox "Remember me" (ngoài phạm vi: không OAuth, không đặt lại mật khẩu).
  - Bỏ hộp demo credentials ở VendorLogin.
  - Form đăng ký vendor: bỏ Phone; thêm Full name và Store name (bắt buộc để tạo Vendor); nút "Create store" thay cho "Proceed To Next".
  - Checkbox Terms ở trang đăng ký khách hàng bắt buộc tick và mặc định **không** tick.
  - Header storefront ghi "Hello, Guest / Sign in"; giỏ hàng tĩnh ($0.00).
  - FAQ #1 sửa nội dung cho khớp form mới.
  - Mega-menu, giỏ hàng và tìm kiếm là khung tĩnh, chưa hoạt động.
- **Lý do:** phạm vi task, và dữ liệu bắt buộc của model (name, storeName).
- **Ảnh hưởng:** bố cục, khoảng cách và token vẫn theo mockup.
- **Rà soát (Giai đoạn A, mục 5):** **KHÔNG SỬA**, chủ dự án đồng ý ngày 2026-09-28. Lý do: khớp đúng mockup sẽ đòi các tính năng ngoài phạm vi (OAuth, đặt lại mật khẩu) hoặc bỏ trường bắt buộc của model.

### 2026-09-28 — Ràng buộc bổ sung ngoài `task.md`
- **Quyết định:**
  - Mật khẩu tối đa 72 byte (giới hạn của bcrypt).
  - Ô password khi đăng nhập chỉ bắt buộc có giá trị, không áp chính sách độ mạnh.
  - Form vendor có `confirmPassword`.
- **Lý do:** tránh bcrypt cắt mật khẩu mà người dùng không biết; không để lộ chính sách mật khẩu qua form đăng nhập; thiết kế vendor có ô xác nhận mật khẩu.
- **Rà soát (Giai đoạn A, mục 6):** **KHÔNG SỬA**, chủ dự án đồng ý ngày 2026-09-28. Lý do: nếu bỏ, bcrypt sẽ âm thầm cắt mật khẩu dài hơn 72 byte.

### 2026-09-28 — Vị trí file layout theo route group
- **Bối cảnh:** `task.md` Bước 6 ghi `app/dashboard/layout.tsx`, `app/vendor/dashboard/layout.tsx`.
- **Quyết định:** đặt ở `app/(account)/dashboard/`, `app/(seller)/vendor/dashboard/`, `app/(admin)/admin/(protected)/`.
- **Lý do:** quy ước route group của dự án. URL không đổi.

### 2026-09-28 — Page cũng gọi guard, không chỉ layout
- **Bối cảnh:** tài liệu Next 16 (guide authentication, "Layouts and auth checks"): layout không render lại khi điều hướng phía client.
- **Quyết định:** mỗi page được bảo vệ cũng gọi `requireRole` hoặc `requireApprovedVendor` (bọc React `cache`, không query lặp).
- **Ảnh hưởng:** các trang mới trong `/dashboard`, `/vendor/dashboard`, `/admin/*` phải làm tương tự.

### 2026-09-28 — Guard đọc lại user từ DB mỗi request
- **Bối cảnh:** rà soát Giai đoạn A, mục 1. JWT không thu hồi được. Trước đây guard chỉ tin token, nên user bị xóa hoặc đổi role vẫn giữ quyền cũ tới khi token hết hạn (mặc định 30 ngày).
- **Quyết định:**
  - `getVerifiedSession()` đọc lại user theo id trong token, mỗi request 1 query nhờ `cache`.
  - Role và trạng thái vendor lấy từ DB.
  - Token lệch với DB thì chuyển tới `/auth/session-ended`. Route này đăng xuất rồi đưa về trang login của khu vực cũ.
- **Lý do:**
  - Thu hồi quyền có hiệu lực ngay ở các trang được bảo vệ.
  - Phải xóa cookie bằng route handler: server component không set cookie được, và chỉ redirect về login thì proxy (vẫn thấy token cũ) sẽ đẩy ngược lại, gây vòng lặp.
  - Route chỉ đăng xuất khi session thật sự cũ, để chặn việc bị ép đăng xuất qua link từ site khác.
- **Ảnh hưởng:**
  - Mỗi request tới trang được bảo vệ thêm 1 query nhỏ theo khóa chính.
  - Proxy vẫn chỉ kiểm tra role từ token, đúng spec. Lớp DB nằm ở layout và page.
  - Thời hạn session (30 ngày) giữ nguyên.

### 2026-09-28 — `.env.example` và `.gitignore`
- **Bối cảnh:** `task.md` (mục Môi trường) yêu cầu `.env.example`. Lúc rà soát thì chưa có. `.gitignore` có dòng `.env*`, dòng này chặn cả `.env.example`.
- **Quyết định:**
  - Tạo `.env.example` với 4 biến của `task.md`.
  - Thêm dạng chú thích `AUTH_TRUST_HOST` và `AUTH_URL`.
  - Thêm `!.env.example` vào `.gitignore`.
- **Lý do:**
  - Không có một trong hai biến trên thì `next start` hoặc bản deploy bị lỗi UntrustedHost và không đăng nhập được (đã gặp khi test).
  - Không có ngoại lệ trong `.gitignore` thì file mẫu không commit được.
- **Ảnh hưởng:** `.env` và các biến thể `.env.*` khác vẫn bị gitignore.

### 2026-09-28 — Gia cố `loginAction` khi Auth.js lỗi cấu hình
- **Bối cảnh:** thiếu `AUTH_SECRET` hoặc host chưa được tin thì `signIn(redirect:false)` không throw, mà trả về URL trang lỗi.
- **Quyết định:** kiểm tra URL trả về. Nếu đó là trang lỗi thì báo "We couldn't sign you in right now" và ghi log server.
- **Lý do:** tránh redirect như thể đã đăng nhập trong khi không có session.
