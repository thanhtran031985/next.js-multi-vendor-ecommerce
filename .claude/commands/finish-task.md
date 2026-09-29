---
description: Rà soát code đã có so với task.md, sửa, kiểm tra và đóng task
argument-hint: <NN-slug, vd 01-auth>
---
Hoàn thành task $ARGUMENTS. Đọc @docs/tasks/$ARGUMENTS/ và docs/tasks/README.md trước.

Code của task này có thể ĐÃ được viết (một phần hoặc toàn bộ), có thể theo bản
yêu cầu cũ (xem _archive/ nếu có). task.md là bản chuẩn hiện tại. KHÔNG code lại
từ đầu — chỉ rà soát, sửa phần khác biệt, kiểm tra và đóng task.

## Dashboard tiến độ (docs/tasks/dashboard.html)
Dashboard được SINH RA từ docs/tasks/README.md và docs/tasks/NN-slug/progress.md
bằng `npm run tasks:dashboard` (scripts/tasks-dashboard.mjs). Đặc tả nằm ở
docs/prompts/dashboard.md.
- Nếu package.json chưa có script "tasks:dashboard": đề xuất tạo dashboard theo
  docs/prompts/dashboard.md (lập kế hoạch, DỪNG chờ duyệt). Không tự tạo khi chưa
  được duyệt. Chưa có script thì bỏ qua các bước chạy dashboard bên dưới.
- KHÔNG sửa tay dashboard.html. Muốn đổi nội dung thì sửa README.md/progress.md
  rồi chạy lại script.
- Giữ progress.md đúng định dạng mà script đọc:
  - Dòng `Trạng thái chung: <ký hiệu> · Cập nhật lần cuối: <ngày>`.
  - Bảng bước là bảng ĐẦU TIÊN có cả cột "Bước" và "Trạng thái" (thêm "Tên",
    "Ghi chú"). Bảng phụ (rà soát, theo dõi mục sửa…) KHÔNG được có đồng thời
    hai cột đó: dùng "Mục", "Đánh giá"… để script không đọc nhầm.
  - Cột trạng thái chỉ dùng: ⬜ chưa làm · 🔄 đang làm · ❓ có code chưa rà soát ·
    ⚠️ khác task.md · ❌ thiếu · ✅ xong. Ký hiệu lạ bị tô xám kèm cảnh báo.
  - "Trạng thái chung" trong progress.md phải khớp cột Trạng thái của task trong
    README.md.
- Sau MỖI lần cập nhật README.md/progress.md: chạy `npm run tasks:dashboard`, đọc
  kết quả in ra. Phải là "Cảnh báo: 0"; nếu có cảnh báo thì sửa file .md cho hết
  rồi chạy lại. Ghi dòng tóm tắt của task (vd "02 slug: 6/6 bước ✅ · README ✅")
  vào báo cáo.
- dashboard.html thay đổi mỗi lần chạy: commit nó cùng các file .md trong cùng
  commit.

## Giai đoạn A — Rà soát (không sửa code)
0. Đánh dấu task đang được rà soát: "Trạng thái chung" trong progress.md và dòng
   của task trong README.md → 🔄. Chạy dashboard.
1. Với từng mục "Quyết định kiến trúc" và từng bước trong task.md, đánh giá
   ✅ đúng / ⚠️ có nhưng khác / ❌ thiếu, kèm bằng chứng (file + dòng).
2. Kiểm tra thêm theo quy tắc code trong CLAUDE.md: validate Zod, không secret
   hay Prisma trong client component, không mã màu hex cố định, xử lý lỗi.
3. Chạy npx tsc --noEmit, npm run lint, npm run build.
4. Cập nhật bảng bước trong progress.md theo kết quả thực tế (ký hiệu + ghi chú).
   Ghi khác biệt vào decisions.md. Chạy dashboard.
5. Đưa danh sách cần sửa, đánh số, xếp theo: bảo mật → lỗi chức năng → khác biệt
   nhỏ. Mỗi mục nêu rủi ro nếu KHÔNG sửa.
DỪNG, chờ tôi chọn mục nào sửa.

## Giai đoạn B — Sửa
- Chỉ sửa các mục tôi chọn, mỗi lần một mục (hoặc một nhóm nhỏ liên quan).
- Sau mỗi mục: chạy tsc, cập nhật progress.md, ghi decisions.md nếu có quyết
  định mới, chạy dashboard (Cảnh báo: 0), đề xuất commit message
  "$ARGUMENTS: fix — <mô tả>". DỪNG chờ "continue".
- Mục tôi quyết định KHÔNG sửa: ghi vào decisions.md kèm lý do.
Nếu Giai đoạn A không có gì cần sửa, sang thẳng Giai đoạn C.

## Giai đoạn C — Kiểm tra
1. npx tsc --noEmit, npm run lint, npm run build — phải không lỗi.
2. Nếu task.md có phần kiểm tra tự động: viết và chạy script tương ứng (không
   cài thêm thư viện nếu chưa hỏi), dọn dữ liệu test sau khi chạy.
3. Ghi checklist test thủ công vào progress.md dưới dạng ô tích [ ], kèm lệnh
   cần thiết (vd SQL/Prisma để tạo dữ liệu test). Chạy dashboard.
DỪNG. Tôi tự test và báo kết quả. Nếu tôi báo lỗi, quay lại Giai đoạn B.

## Giai đoạn D — Đóng task (chỉ khi tôi báo "test ok")
1. progress.md: mọi bước ✅, trạng thái chung ✅, tích hết checklist, mục
   "Bước tiếp theo" ghi "Hoàn thành".
2. docs/tasks/README.md: dòng của task → ✅, nhánh đúng với nhánh thực tế.
3. decisions.md: thêm mục tổng kết ngắn những gì khác với task.md gốc.
4. Chạy npm run tasks:dashboard. Kết quả phải cho task này "x/x bước ✅ · README ✅"
   và "Cảnh báo: 0"; nếu không, sửa progress.md/README.md rồi chạy lại.
5. Đề xuất commit "$ARGUMENTS: complete task" (gồm cả dashboard.html). Chỉ commit
   và push khi tôi đồng ý.
6. Soạn tiêu đề và mô tả Pull Request (tóm tắt tính năng, sửa đổi sau rà soát,
   cách test, biến môi trường cần thiết) để tôi dán lên GitHub. Không tự merge.
