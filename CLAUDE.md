# Covet — Hướng dẫn cho Claude

## Dự án
Covet là sàn thương mại điện tử nhiều người bán (multi-vendor).
- Stack: Next.js (App Router) + TypeScript + Tailwind + Prisma + MySQL (database `covetecom`).
- Xác thực: NextAuth v5 (Credentials, JWT), bcryptjs. Validate: Zod. Thông báo: react-hot-toast.
- Tài liệu sản phẩm: `docs/PRD.md`, `docs/DESIGN_SYSTEM.md` (nếu có).
- Thiết kế giao diện: `designs/` — xuất từ Claude Design (định dạng x-dc, file `*.dc.html`),
  để PHẲNG, không chia thư mục con theo task. Mỗi `task.md` tự liệt kê file thiết kế nó dùng.

## Cấu trúc task
```
docs/tasks/
├── README.md            ← bảng tổng tất cả task + trạng thái
├── _template/           ← mẫu cho task mới (task.md, progress.md, decisions.md)
└── NN-slug/             ← mỗi task một thư mục, NN = số thứ tự 2 chữ số
    ├── task.md          ← yêu cầu của task (do tôi viết, KHÔNG tự sửa)
    ├── progress.md      ← tiến độ, Claude cập nhật sau mỗi bước
    ├── plan.md          ← kế hoạch đã duyệt từ Plan mode
    ├── decisions.md     ← quyết định đã chốt, vấn đề phát sinh
    └── _archive/        ← bản cũ của task.md (nếu có)
```
Quy ước đặt tên:
- Thư mục task: `NN-slug`, slug viết thường, kebab-case, tiếng Anh, ngắn (vd `01-auth`, `02-vendor-approval`).
- Nhánh git tương ứng: `feat/NN-slug`.
- Task xong vẫn giữ nguyên thư mục, chỉ đổi trạng thái trong README. Không di chuyển, không xóa.

## Khi tôi yêu cầu tạo task mới
1. Đọc `docs/tasks/README.md`, lấy số lớn nhất hiện có + 1 làm NN.
2. Đề xuất slug, hỏi tôi xác nhận nếu tên chưa rõ.
3. Copy `docs/tasks/_template/` sang `docs/tasks/NN-slug/`, điền tiêu đề và ngày.
4. Nếu tôi đưa nội dung yêu cầu thì ghi vào `task.md`; nếu chưa thì để khung trống.
5. Thêm một dòng vào bảng trong `docs/tasks/README.md` (trạng thái ⬜, phụ thuộc nếu có).
6. Nếu task có giao diện: liệt kê các file `designs/*.dc.html` liên quan trong mục
   "Thiết kế" của `task.md` (hỏi tôi nếu không chắc file nào thuộc task).
Không bắt đầu làm task khi tôi chưa yêu cầu.

## Quy trình khi làm một task
- Khi bắt đầu, khi mở phiên mới, hoặc sau khi compact: ĐỌC theo thứ tự
  `docs/tasks/README.md` → `task.md` → `progress.md` → `decisions.md` của task đó,
  rồi tiếp tục từ bước đang dở. Không làm lại bước đã ✅.
- Làm lần lượt từng bước theo đúng thứ tự trong `task.md`.
- Sau MỖI bước:
  1. Tự chạy phần "Kiểm tra" của bước đó.
  2. Cập nhật `progress.md` (bảng trạng thái + nhật ký của bước).
  3. Báo cáo ngắn: đã làm gì, kết quả kiểm tra, việc tôi cần làm thủ công.
  4. Đề xuất commit message dạng `NN-slug: step N — <mô tả>`. Chỉ commit khi tôi đồng ý.
  5. DỪNG và chờ tôi trả lời "continue".
- Khi tôi duyệt một kế hoạch ở Plan mode: lưu kế hoạch đó vào `plan.md` của task.
- Khi có quyết định mới hoặc thay đổi so với `task.md`: ghi vào `decisions.md`.
- Khi task hoàn thành: đổi trạng thái trong `docs/tasks/README.md` thành ✅.
- Quyết định mơ hồ → DỪNG và hỏi. Thiếu `PRD.md`/`DESIGN_SYSTEM.md` → tự suy ra từ
  thiết kế và báo cho tôi đã suy ra gì (không cần dừng).
- KHÔNG cài package mới khi chưa hỏi tôi.

## Quy tắc code (áp dụng cho mọi task)
- Mọi thao tác ghi DB đều validate bằng Zod. Schema Zod dùng chung giữa server và client.
- Mật khẩu luôn hash bằng bcrypt; không bao giờ lưu, log hay trả về dạng văn bản thuần.
- Không có secret hay import Prisma trong client component.
- Chỉ dùng design token — không dùng mã màu hex/px cố định. Nếu thiếu token, thêm vào
  theme (Tailwind v3: `tailwind.config`, v4: `@theme`) và liệt kê trong báo cáo.
- Chỉ sửa trong phạm vi của task đang làm. Không tự thêm tính năng ngoài `task.md`.
- Trước khi báo hoàn thành một task: `npx tsc --noEmit`, `npm run lint`, `npm run build`
  đều phải chạy không lỗi.

## Chuyển thiết kế x-dc sang Next.js
Quy tắc cho thư mục `designs/`:
- KHÔNG di chuyển, đổi tên hay sửa bất kỳ file nào trong `designs/` (kể cả `uploads/`
  và `.thumbnail`). Đây là bản xuất từ Claude Design; các file tham chiếu lẫn nhau và
  tới `uploads/` bằng đường dẫn tương đối, và có thể bị xuất đè lại.
- Chỉ ĐỌC các file `*.dc.html` mà task đang làm cần. Bỏ qua `.thumbnail`.
- Ảnh/tài nguyên trong `designs/uploads/` mà trang cần dùng: COPY sang `public/`
  (vd `public/images/`) và tham chiếu từ đó. Không tham chiếu trực tiếp `designs/`.

Các file trong `designs/` dùng định dạng x-dc (class DCLogic, binding `{{ }}`,
`<sc-if>`/`<sc-for>`, style inline với màu hex). Chúng KHÔNG phải React. Khi chuyển:
- Chuyển markup sang TSX.
- Chuyển mọi giá trị hex/px inline sang design token.
- Chuyển state của DCLogic sang state của React client component.
- Bỏ dữ liệu demo cố định và các liên kết href tĩnh; thay bằng dữ liệu và điều hướng thật.
- Khớp thiết kế CHÍNH XÁC: bố cục, khoảng cách, thành phần.

## Bảo mật môi trường
- KHÔNG đọc file `.env`. Danh sách biến môi trường nằm trong `.env.example`
  (giá trị giữ chỗ, không có secret thật). Khi cần biến mới: thêm vào `.env.example`
  và nói tôi điền vào `.env`.

## Lệnh thường dùng
- `npx prisma migrate dev --name <tên>` · `npx prisma generate` · `npx prisma db seed`
- `npx tsc --noEmit` · `npm run lint` · `npm run build` · `npm run dev`