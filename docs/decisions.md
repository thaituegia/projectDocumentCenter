# Nghiên cứu tài liệu và các quyết định còn mở

**Cập nhật theo yêu cầu trực tiếp mới của người dùng:** tách website học liệu Bác Nhã Book và website quản trị + nội bộ thành hai địa chỉ Render. Hai website dùng chung dữ liệu qua API nhưng phiên, role và giao diện riêng; thay thế quyết định một website nhiều vai trò trước đây. Chi tiết tại `two-websites.md`.

Đã đọc PRD v1.0, backlog DOCX, implementation pack và JSON 63 story / 189 AC. PRD quy định một release đầy đủ BR-01–BR-38; P0/P1/P2 chỉ là thứ tự dependency, không phải quyền cắt phạm vi. Hướng dẫn trong implementation pack được xem là đề xuất kỹ thuật, phân biệt với yêu cầu trực tiếp của người dùng là dựng website. Người dùng đã xác nhận có R2/email và sẽ cấu hình sau.

## Cách diễn giải đang thực thi trong bản dev

1. Ba trục độc lập: `access` PUBLIC/PRIVATE, `publication`, lifecycle tính theo thời gian. Hết hiệu lực không xóa tài liệu.
2. Private listing chỉ hiện tên/cấp thư mục/thời gian và nhãn quyền; không trả description/snippet/object key cho người thiếu VIEW.
3. Thu thập grants hiện tại từ cả file và ancestor. Grant đang hoạt động của user hoặc department, có DENY đúng action → từ chối. ADMIN/MANAGE không được mặc nhiên bypass VIEW.
4. DOWNLOAD yêu cầu flag cho tải, ACL DOWNLOAD và VIEW. Bản gốc để sửa offline dùng endpoint MANAGE riêng, không cho file chưa scan.
5. Preview seed là bản text riêng. Upload thực không tự scan giả hoặc tự xuất bản. Scanner lỗi/mất cấu hình → không phát hành. File định dạng khác chưa render được có fallback.
6. Share link chỉ là route; người nhận không được thêm quyền. Access requests chấp thuận không vô hiệu Deny.
7. Development/demo chỉ tồn tại khi NODE_ENV khác production, được ghi rõ ở workspace và footer. Không dùng demo như luồng production.

## Open Decisions — chưa được Product Owner phê duyệt

| OD | Nội dung | Cách xử lý bản phát triển; không xem là đã chốt production |
|---|---|---|
| 01 | Deadline/ngân sách/team | Không cam kết ngày bàn giao hoặc SLA |
| 02 | Tên hồ sơ HCNS | Giữ BR-09 trong scope, tách kho theo vai trò; không gửi snippets thiếu VIEW |
| 03 | Mật khẩu qua email | Hash bcrypt + encrypted outbox, must-change; TTL mật khẩu tạm chưa hoàn tất |
| 04 | Download flag + ACL | Dùng AND của flag, VIEW, DOWNLOAD; cần PO xác nhận rule |
| 05 | Xung đột path, move, restore | Từ chối tên trùng, từ chối cross-repo move; chưa có UI Skip/Rename/Merge |
| 06 | Số bước duyệt/self-approval | Dev 1 bước, chỉ người được chỉ định, chặn tự duyệt; cần duyệt chính sách |
| 07 | Metadata migration | Kế thừa schema/key, kiểm tra type/required; thay đổi schema có giá trị chưa có migration đầy đủ |
| 08 | Backup RPO/RTO/retention | Chỉ rehearsal local, chưa có lịch và off-site restore test |
| 09 | Media compatibility | Text PDF/Office sau scan; ảnh/audio/video player chưa được bảo đảm |
| 10 | Giới hạn phiên/watermark/MFA | Dev 3 phiên, idle 30 phút, watermark email; admin production bị khóa chờ MFA |
| 11 | Chi phí R2 | Hiển thị dung lượng metadata DB, không ghi là hóa đơn/actual billing |
| 12 | Upload kỹ thuật | Dev max 50 file/request, 100MB/file có env override; chưa multipart/resume |
| 13 | Email nhân viên | Dev dùng mật khẩu tạm/must-change giống Customer; cần duyệt quy trình |
| 14 | Retention pháp lý | Có legal_hold; purge tự động chưa bật, không tự xóa theo số ngày mặc định |
| 15 | Public hết hiệu lực | Dev vẫn hiện nhãn hết hiệu lực/cảnh báo viewer; cần PO xác nhận policy |

## Điểm còn thiếu của release

Không coi các adapter hoặc màn hình cấu hình là đã đáp ứng AC kết nối thật. Các blocker production bao gồm MFA, PostgreSQL/queue, rendering fidelity và media, scan/convert sandbox, multipart/resume, expired credentials policy, independent off-site backups, alerts/scheduler/email event đầy đủ, security review, load/UAT/staging/rollback rehearsal. Mỗi AC có trạng thái riêng trong acceptance matrix. Không tự đổi yêu cầu để gọi bản này là release hoàn tất.
