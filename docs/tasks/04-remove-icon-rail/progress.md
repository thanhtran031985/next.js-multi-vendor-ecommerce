# Tiến độ — 04-remove-icon-rail

Trạng thái chung: ✅ · Cập nhật lần cuối: 2026-09-30

| Bước | Tên | Trạng thái | Ghi chú |
|------|-----|------------|---------|
| 0 | Kiểm tra (không sửa code) | ✅ | Chờ chủ dự án chọn phương án (mục P1–P3) |
| 1 | Thực hiện | ✅ | P1–P3 theo đề xuất (decisions.md) |
| 2 | Kiểm tra tổng và ghi lại | ✅ | Tự động đạt; checklist thủ công chờ chủ dự án |

## Nhật ký
<!-- Mỗi bước thêm một mục:
### Bước N — <tên> (<ngày>)
- Đã làm:
- File tạo/sửa:
- Kết quả kiểm tra:
- Việc tôi cần làm thủ công:
-->

### Bước 0 — Kiểm tra (2026-09-30)
- Đã làm: đọc code khung dashboard, không sửa code. Nhánh `feat/04-remove-icon-rail` tạo từ `main` (d2a295d).
- File tạo/sửa: `docs/tasks/README.md` (04 → 🔄), file này.

**Ai render thanh icon, ai dùng**
| Mục | Vị trí |
|---|---|
| Logo giỏ hàng (`bg-iris-500`, `size-9.5`, `CartIcon 20`, `aria-hidden`, KHÔNG phải link) + dãy icon `SidebarNav variant="rail"` | `components/dashboard/DashboardShell.tsx:36-43` (biến `rail`) |
| Cột nền tối (`w-16 bg-ink`) chứa `rail`, đặt trước `<aside>` trắng | `components/dashboard/ShellFrame.tsx:52` |
| Kiểu icon rail, tooltip | `components/dashboard/SidebarNav.tsx` (`variant="rail"`, `entryClass.rail`) |
| Dữ liệu icon | `lib/dashboard/nav.ts`: `railFor(root)`; `ShellNav.rail` |
- `DashboardShell` dùng chung cho **admin** (`app/(admin)/admin/(protected)/layout.tsx:21`, `variant="admin"`) và **vendor**
  (`app/(seller)/vendor/dashboard/layout.tsx:13`, `variant="seller"`). Khách hàng dùng `AccountShell`, không có thanh icon.
  → Thanh icon dùng chung admin + vendor, nên **KHÔNG xóa** component, phải thêm tùy chọn (theo task.md).

**Chức năng từng icon ở khung admin** (`railFor("/admin/dashboard")`)
| Icon | Nhãn (suy ra) | Đích | Trạng thái |
|---|---|---|---|
| home | Home | `/admin/dashboard` | link thật (trùng với mục "Dashboard" ở cột trắng) |
| hộp | Products | `/admin/dashboard/products` (chưa có trang) | "Coming soon" (`enabled: false`) |
| túi | Orders | `/admin/dashboard/orders` (chưa có) | "Coming soon" |
| máy bay giấy | Messages | `/admin/dashboard/messages` (chưa có) | "Coming soon" |
| loa | Promotions | `/admin/dashboard/promotions` (chưa có) | "Coming soon" |
| biểu đồ | Reports | `/admin/dashboard/reports` (chưa có) | "Coming soon" |
| người dùng | Customers | `/admin/dashboard/customers` (chưa có) | "Coming soon" |
| thanh trượt | Settings | `/admin/dashboard/settings` (chưa có) | "Coming soon" |
- Không icon nào **chuyển nhóm menu** trong cột trắng: cột trắng luôn hiển thị cùng các nhóm (`nav.groups`), không phụ thuộc icon nào đang sáng.
- Mục admin nào phụ thuộc thanh icon? **Không mục nào.** "Dashboard" (`/admin/dashboard`) và "Brand Setup" (`/admin/brands`) đều nằm ở cột
  trắng; icon Home chỉ trùng với "Dashboard". Bỏ thanh icon **không làm mất đường vào** trang nào.
  Các icon còn lại chưa có trang (chỉ trang trí + tooltip "Coming soon"), sẽ mất theo.

**Mobile hiện tại (admin)**
- Dưới `md`, `ShellFrame` biến khối `fixed inset-y-0 left-0` (rail `w-16` + sidebar `w-59`) thành drawer, mở bằng nút menu trên topbar
  (`useDrawer`); nút "Close menu" (X) ở góc trên phải sidebar; có lớp phủ bấm để đóng. Drawer hiện = rail (logo + 8 icon) + sidebar (Home, Overview,
  Organization, Setup Guide).
- Từ `md` trở lên: nút trên topbar thu gọn/mở cả rail + sidebar (`collapsed` → `md:hidden`).

**Cách tắt thanh icon chỉ cho admin**
- Thêm prop `showIconRail?: boolean` (mặc định `true`) vào `DashboardShell`; admin layout truyền `showIconRail={false}`. Khi `false`,
  `DashboardShell` không tạo `rail` và `ShellFrame` không render cột `w-16`. `ShellFrame` đổi `rail` thành prop tùy chọn. Vendor không đổi
  dòng nào (mặc định `true`). Không dùng CSS ẩn theo đường dẫn.

**Logo (admin)**
- Khi tắt rail, `DashboardShell` render logo (giữ `size-9.5`, `bg-iris-500`, `CartIcon 20`) ở đầu cột trắng, phía trên hàng "Home", bọc trong `Link`
  tới `/admin/dashboard` (`aria-label` "Covet dashboard"). Vendor giữ logo trong rail như cũ.

**Phương án điều hướng thay thế: không cần** (xem trên). Các phương án thân thiện nhưng không bắt buộc:
- P1 (đề xuất): không thêm gì. Home = logo + "Dashboard"; các icon "Coming soon" bỏ hẳn.
- P2: thêm các mục "Coming soon" đó vào cột trắng khi từng trang ra đời (mỗi task tự thêm), không làm ngay.

**Việc cần chủ dự án chốt**
- P1. Dữ liệu rail của admin (`adminNav.rail`, 8 mục): (a) giữ nguyên, chỉ không hiển thị (ít sửa nhất); (b) cho `ShellNav.rail` tùy chọn và
  bỏ khỏi `adminNav` (gọn, tránh dữ liệu chết, sửa `nav.ts` phần admin). Đề xuất (b).
- P2. Vị trí logo trong cột trắng: hàng riêng phía trên "Home" (đề xuất, đúng task.md) hay cạnh tiêu đề "Home".
- P3. Trên mobile, nút "Close menu" (`top-5 right-3`) nằm cùng vùng logo/tiêu đề; nếu chồng lên nhau thì đệm bên phải cho hàng logo. Xác nhận cách xử lý này.

**File sẽ sửa:** `components/dashboard/DashboardShell.tsx` (prop `showIconRail`, logo ở sidebar admin), `components/dashboard/ShellFrame.tsx` (`rail`
tùy chọn), `app/(admin)/admin/(protected)/layout.tsx` (truyền `showIconRail={false}`), `lib/dashboard/nav.ts` (chỉ nếu chọn P1-b).
**File xóa:** không.
- Kết quả kiểm tra: không sửa code, không chạy lệnh ghi.
- Việc tôi cần làm thủ công: chốt P1–P3.

### Bước 1 — Thực hiện (2026-09-30)
- Đã làm (theo đề xuất P1-b, P2 hàng riêng, P3 — bạn trả lời "continue" không chọn khác, xem decisions.md):
  - `DashboardShell`: prop `showIconRail` (mặc định `true`). Khi `false` (hoặc `nav.rail` không có) không tạo rail; logo (cùng
    `size-9.5`, `bg-iris-500`, `CartIcon 20`) chuyển lên đầu cột trắng, phía trên "Home", là `Link` tới `/admin/dashboard`
    (`aria-label="Covet dashboard"`, có hover/focus ring theo token).
  - `ShellFrame`: `rail` tùy chọn; không có rail thì không render cột `w-16`, cột trắng sát mép trái, nội dung (`flex-1`) giãn ra.
  - `lib/dashboard/nav.ts`: `ShellNav.rail` tùy chọn, `adminNav` bỏ `rail`; `vendorNav` giữ nguyên.
  - Admin layout truyền `showIconRail={false}`. Vendor layout không đổi.
  - Drawer mobile (admin): chỉ còn cột trắng (`w-59`), có logo ở đầu; logo nằm bên trái còn nút X bên phải nên không chồng nhau.
  - `scripts/verify-dashboards.ts`: thêm kiểm tra vendor còn `aria-label="Sections"` (rail), admin có `aria-label="Covet dashboard"` và KHÔNG có rail.
- File sửa: `components/dashboard/DashboardShell.tsx`, `components/dashboard/ShellFrame.tsx`, `lib/dashboard/nav.ts`,
  `app/(admin)/admin/(protected)/layout.tsx`, `scripts/verify-dashboards.ts`.
- Kết quả kiểm tra: `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi. Dev server: `verify-dashboards.ts` ALL CHECKS PASSED
  (kèm 3 ca mới), `verify-auth.ts` ALL CHECKS PASSED, `verify-brands.ts` All checks passed (admin frame không ảnh hưởng trang Brands).
  Chưa kiểm được bằng máy: hình ảnh (khoảng trống, mobile 375px) → checklist thủ công ở Bước 2.
- Việc tôi cần làm thủ công: mở `/admin/dashboard` xem thanh icon đã biến mất và logo ở đầu cột trắng.

### Bước 2 — Kiểm tra tổng và ghi lại (2026-09-30)
- Đã làm: chạy kiểm tra tổng; thêm mục "Lệch thiết kế có chủ đích: bỏ thanh icon ở khung admin" vào
  `docs/tasks/02-role-dashboards/decisions.md` (dẫn chiếu task 04).
- File sửa: `docs/tasks/02-role-dashboards/decisions.md`.
- Kết quả kiểm tra (chạy sau thay đổi code cuối cùng):
  - `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi.
  - `verify-auth.ts`: ALL CHECKS PASSED.
  - HTTP (`verify-dashboards.ts`, dev server): mỗi role vào dashboard của mình → 200 (customer, vendor, admin), ALL CHECKS PASSED;
    vendor vẫn có rail (`aria-label="Sections"`), admin có logo link (`aria-label="Covet dashboard"`) và không có rail.
  - `verify-brands.ts`: All checks passed (trang admin khác vẫn trong khung mới).
- Việc tôi cần làm thủ công — checklist (`npm run dev`):
  - [ ] `/admin/dashboard`, `/admin/brands`: không còn thanh icon; logo chữ "Covet." ở đầu cột trắng; bấm logo về `/admin/dashboard`.
  - [ ] Mọi mục menu admin (Dashboard, POS, Brand Setup) bấm được/đúng trạng thái và đánh dấu đúng mục đang mở.
  - [ ] Không còn khoảng trống thừa bên trái; nội dung giãn đúng; nút thu gọn/mở cột trắng trên topbar vẫn chạy (từ `md` trở lên).
  - [ ] `/vendor/dashboard` và `/dashboard`: giao diện Y NHƯ TRƯỚC (thanh icon của vendor còn nguyên; so với commit trước task).
  - [ ] Màn hình 375px (admin): drawer mở/đóng được, có logo, nút X không chồng logo, không cuộn ngang toàn trang.

### Rà soát theo /finish-task (2026-09-30)
| Mục | Đánh giá | Bằng chứng |
|-----|----------|------------|
| Phạm vi CHỈ ADMIN: vendor và khách hàng không đổi | ✅ | `git diff main`: không sửa `app/(seller)/**`, `AccountShell`; vendor dùng mặc định `showIconRail = true` (`DashboardShell.tsx:50`); `verify-dashboards.ts` kiểm vendor còn `aria-label="Sections"` |
| Khung dùng chung → không xóa component, thêm tùy chọn rõ ràng, không CSS ẩn theo đường dẫn | ✅ | prop `showIconRail` (`DashboardShell.tsx:33,50,58`); admin layout `showIconRail={false}` (`app/(admin)/admin/(protected)/layout.tsx:24`); `ShellFrame.tsx:47` chỉ render cột khi có `rail` |
| Logo (admin) lên đầu cột trắng, phía trên "Home", bấm → `/admin/dashboard` | ⚠️ | có (`DashboardShell.tsx:70-78`) nhưng là chữ "Covet." (`Wordmark`) thay vì icon giỏ hàng, theo yêu cầu của chủ dự án (decisions 2026-09-30) |
| Điều hướng: không mất đường vào mục admin nào | ✅ | không mục nào phụ thuộc thanh icon (Bước 0); Dashboard và Brand Setup vẫn ở cột trắng |
| Cột trắng sát mép trái, nội dung giãn ra | ✅ (code) | `ShellFrame.tsx`: bỏ cột `w-16`, `main` trong cột `flex-1`; hình ảnh chờ checklist thủ công |
| Mobile: drawer mở/đóng, có logo | ✅ (code) | drawer chỉ còn cột trắng, logo căn trái, nút X căn phải; 375px chờ checklist thủ công |
| Chỉ dùng design token | ✅ | grep dòng thêm mới: không hex/`rgba(`/px |
| Không sửa `designs/`, auth, guard; không cài thư viện | ✅ | `git diff main --stat` |
| Ghi lệch thiết kế vào decisions task 02 | ✅ | `docs/tasks/02-role-dashboards/decisions.md` (mục 2026-09-30) |
| Sửa ngoài danh sách phạm vi | ⚠️ | `scripts/verify-dashboards.ts` (3 ca kiểm tra rail), đã ghi decisions |

- `npx tsc --noEmit`, `npm run lint`, `npm run build`: không lỗi (chạy lại 2026-09-30).

### Sửa sau rà soát (2026-09-30)
- Đã làm: `DashboardShell` ném lỗi rõ ràng khi `showIconRail` bật mà `nav.rail` không có (trước đó im lặng không hiện thanh icon).
- File sửa: `components/dashboard/DashboardShell.tsx`.
- Kết quả kiểm tra: `tsc`, `lint`, `build` không lỗi; `verify-dashboards.ts` và `verify-auth.ts` ALL CHECKS PASSED.

### Đóng task (2026-09-30)
- Đóng theo yêu cầu của chủ dự án. Checklist thủ công ở Bước 2 (giao diện, mobile 375px, logo chữ) **chưa được xác nhận từng mục**
  nên để nguyên ô chưa tích; cần xem bằng `npm run dev` khi có dịp.

## Bước tiếp theo
Hoàn thành
