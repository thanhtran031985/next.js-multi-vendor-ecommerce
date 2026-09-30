# 04 — Bỏ thanh icon dọc khỏi khung dashboard ADMIN (remove-icon-rail)

> Quy trình làm việc và quy tắc code: xem `CLAUDE.md`.
> Tiến độ: `docs/tasks/04-remove-icon-rail/progress.md`.
> Phụ thuộc: `02-role-dashboards` (khung `DashboardShell`, `lib/dashboard/nav.ts`).
> Đọc `docs/tasks/02-role-dashboards/decisions.md` trước khi làm.

## Mục tiêu
Bỏ THANH ICON DỌC MÀU TỐI ở ngoài cùng bên trái, CHỈ trong khung của ADMIN
(`/admin/*`). Đưa logo lên đầu cột menu trắng của admin, không làm mất đường điều
hướng tới bất kỳ mục menu admin nào. Khung của vendor và khách hàng GIỮ NGUYÊN.

## Phần cần bỏ (chỉ phần này, chỉ ở admin)
Cột hẹp nền tối sát mép trái màn hình, gồm:
- Logo giỏ hàng nền tím ở trên cùng.
- Dãy icon bên dưới: home, hộp, túi, máy bay giấy, loa, biểu đồ, người dùng,
  thanh trượt.

## Phần GIỮ NGUYÊN (không sửa)
- **Khung của vendor (`/vendor/*`) và khách hàng (`/dashboard`)**: không thay đổi gì
  về giao diện, kể cả nếu chúng cũng có thanh icon.
- Cột menu trắng của admin: tiêu đề "Home", nhóm OVERVIEW (Dashboard, POS), nhóm
  ORGANIZATION (Brand Setup), thẻ "Setup Guide" (chỉ thêm logo ở đầu).
- Thanh trên: nút back, breadcrumb, ô "Search Menu…", các icon thông báo, menu
  người dùng.
- Toàn bộ nội dung các trang.
- Nút tròn chữ "N" ở góc dưới bên trái: đây là công cụ dev của Next.js (chỉ hiện khi
  chạy `npm run dev`), KHÔNG thuộc giao diện dự án. Không đụng tới.
- Các file trong `designs/`.
- Logic auth và guard.

## Quyết định (xác nhận lại ở Bước 0)
- **Phạm vi: CHỈ ADMIN.**
- **Khung dùng chung:** nếu `DashboardShell` và thanh icon được dùng chung cho cả
  3 role, KHÔNG xóa component thanh icon. Thay vào đó cho khung một tùy chọn rõ ràng
  (vd prop `showIconRail`, hoặc cấu hình theo role trong `lib/dashboard/`), mặc định
  giữ hành vi cũ; chỉ layout admin tắt thanh icon. Không dùng CSS ẩn theo đường dẫn.
  Nếu thanh icon chỉ admin dùng → được xóa hẳn component.
- **Logo (chỉ admin):** chuyển lên đầu cột menu trắng, phía trên tiêu đề "Home",
  giữ kích thước và token màu hiện tại. Bấm logo → `/admin/dashboard`.
- **Điều hướng:** nếu icon trên thanh đang chuyển nhóm menu hiển thị trong cột trắng
  (hoặc là đường vào duy nhất tới mục admin nào đó), phải có phương án thay thế trong
  cột trắng của admin TRƯỚC khi bỏ. Bước 0 đề xuất phương án; không tự chọn.
- Chỉ dùng design token.

## Các bước

### Bước 0 — Kiểm tra (không sửa code)
Báo cáo:
- File và dòng code render thanh icon; `DashboardShell` và thanh icon đang được dùng
  bởi layout nào (admin / vendor / khách hàng).
- Chức năng từng icon trên thanh ở khung admin: chỉ trang trí, là link, hay đang
  chuyển nhóm menu trong cột trắng. Mục nào trong `lib/dashboard/nav.ts` (phần admin)
  phụ thuộc vào thanh này.
- Hiển thị trên mobile hiện tại của khung admin (drawer gồm những gì).
- Cách tắt thanh icon chỉ cho admin (prop/cấu hình) mà vendor và khách hàng không
  bị ảnh hưởng.
- Phương án điều hướng thay thế nếu cần; nếu có nhiều phương án, nêu ưu nhược điểm.
- Danh sách file sẽ sửa (và file sẽ xóa, nếu có).
Ghi vào progress.md. DỪNG, chờ tôi xác nhận.

### Bước 1 — Thực hiện
- Thêm tùy chọn tắt thanh icon cho khung (hoặc xóa hẳn nếu chỉ admin dùng), theo
  phương án đã duyệt ở Bước 0.
- Layout admin: tắt thanh icon, chuyển logo lên đầu cột menu trắng.
- Cột trắng của admin dịch sát mép trái; vùng nội dung giãn ra lấp chỗ trống, không
  để khoảng trống thừa.
- Mobile (admin): drawer vẫn mở/đóng bình thường và có logo.
- Kiểm tra: `npx tsc --noEmit`, `npm run build` không lỗi.

### Bước 2 — Kiểm tra tổng và ghi lại
Tự động (chạy và dán kết quả):
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `scripts/verify-auth.ts` vẫn đạt toàn bộ.
- HTTP: mỗi role vào dashboard của mình → 200 (khung không lỗi).

Ghi lại:
- Thêm vào `docs/tasks/02-role-dashboards/decisions.md` một mục "Lệch thiết kế có chủ
  đích: bỏ thanh icon ở khung admin" (bối cảnh, quyết định, lý do, ảnh hưởng), dẫn
  chiếu sang task 04.

Checklist thủ công cho tôi (ghi vào progress.md):
- `/admin/dashboard`, `/admin/brands`: không còn thanh icon; logo ở đầu cột trắng;
  bấm logo về `/admin/dashboard`.
- Mọi mục menu admin vẫn bấm được và đánh dấu đúng mục đang mở.
- Không còn khoảng trống thừa bên trái; nội dung giãn đúng.
- `/vendor/dashboard` và `/dashboard`: giao diện Y NHƯ TRƯỚC (so với commit trước task).
- Màn hình 375px (admin): drawer mở/đóng được, có logo, không cuộn ngang toàn trang.

## Phạm vi
- Được sửa: `components/dashboard/**` (thêm tùy chọn tắt thanh icon), layout admin
  đang gắn `DashboardShell`, `lib/dashboard/nav.ts` (chỉ phần admin, chỉ khi phương án
  điều hướng ở Bước 0 cần), theme token.
- KHÔNG làm: thay đổi giao diện vendor và khách hàng; thay đổi nội dung cột trắng ngoài
  việc thêm logo và phương án điều hướng đã duyệt; đổi màu/phong cách khung; sửa trang
  nội dung; sửa logic auth; cài thư viện.

## Tiêu chí hoàn thành
- Mọi bước trong progress.md là ✅.
- Phần tự động ở Bước 2 không lỗi; `verify-auth.ts` vẫn đạt.
- Giao diện vendor và khách hàng không đổi.
- `decisions.md` của task 02 đã ghi lệch thiết kế.
- Checklist thủ công đã ghi vào progress.md.
