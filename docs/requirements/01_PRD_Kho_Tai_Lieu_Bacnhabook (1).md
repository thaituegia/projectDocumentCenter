PRODUCT REQUIREMENTS DOCUMENT (PRD)
WEBSITE KHO TÀI LIỆU & HỌC LIỆU BACNHABOOK – NỘI BỘ DOANH NGHIỆP
Phiên bản:
 
1.0 – Baseline nghiệp vụ |
 
Ngày tổng hợp:
 
11/11/2026
Trạng thái:
 
Phạm vi chức năng được xác nhận theo BR-01 đến BR-39; các tham số vận hành nêu ở phần Open Decisions chưa chốt.
Đối tượng:
 
Ban lãnh đạo, Product/BA, UI/UX, FE, BE, QA, DevOps và AI coding agents.
Nguồn:
 
Chuỗi phỏng vấn nghiệp vụ trong cuộc trao đổi hiện tại; các đề xuất kỹ thuật được ghi rõ và không tự động coi là yêu cầu khách hàng đã phê duyệt.
Quy ước:
 
[CHỐT]
 
= người yêu cầu đã xác nhận;
 
[ĐỀ XUẤT]
 
= gợi ý BA/kỹ thuật cần duyệt;
 
[CHƯA CHỐT]
 
= còn thiếu quyết định. Mọi thay đổi so với baseline phải đi qua change request.
1. Tóm tắt sản phẩm
1.1 Bài toán
Doanh nghiệp cần một
 
website độc lập
 
để quản lý hai nhóm tài sản số: (1) học liệu Bacnhabook (slide, video, audio, tài liệu đi kèm sách) cho khách được cấp tài khoản theo email; (2) kho tài liệu công ty, bao gồm tài liệu chung, hồ sơ HCNS/quyết toán và kho riêng của các phòng ban. File do doanh nghiệp upload và quản lý trên
 
Cloudflare R2
, không dùng URL Google Drive, YouTube hoặc kho bên ngoài làm nguồn tài liệu.
1.2 Mục tiêu
Người được cấp quyền có thể tìm kiếm, xem và tải tài liệu theo chính sách; tài liệu Public truy cập không cần đăng nhập.
Quản lý phân quyền chi tiết đến
 
Folder, file, phòng ban, cá nhân, Allow/Deny, thời hạn
; người quản trị kho chỉ được thao tác trong phạm vi của mình.
Tạo tài khoản khách Bacnhabook thủ công hoặc Excel; bắt buộc đổi mật khẩu lần đầu.
Quản trị vòng đời tài liệu: upload hàng loạt Folder, phiên bản, metadata linh hoạt, phê duyệt, hết hiệu lực, thùng rác, sao lưu, nhật ký.
Vận hành ổn định trên PC/Mobile ở quy mô tham chiếu 1.000–10.000 tài khoản, 100–500 truy cập đồng thời, tối đa khoảng 50.000 file.
1.3 Nguyên tắc sản phẩm
Một website, nhiều trải nghiệm theo vai trò:
 
khách Bacnhabook, nhân viên, HCNS, quản lý kho phòng ban, Admin Bacnhabook, Super Admin.
Zero trust với file Private:
 
UI không phải lớp bảo mật; mọi API, stream, preview, download đều kiểm tra quyền server-side.
Không nhầm lẫn ba trạng thái:
 
quyền truy cập (Public/Private), xuất bản (Draft/Pending/Published) và hiệu lực (Scheduled/Active/Expired/Archived).
Một lần bàn giao đầy đủ:
 
BR-01…BR-38 nằm trong release đầu tiên; có thể phát triển qua nhiều sprint và môi trường test, nhưng không chủ động cắt thành MVP khác.
2. Đối tượng và quyền hạn
Vai trò
Nhu cầu
Phạm vi chính
Guest / Khách vãng lai
Duyệt tài liệu Public, xem danh sách tài liệu Private, nhận cảnh báo không có quyền
Danh mục được phép hiển thị; không xem nội dung Private
Customer Bacnhabook
Đăng nhập và sử dụng học liệu được cấp
Học liệu Public và ACL cấp theo email
Employee
Tra cứu tài liệu công ty
Quyền cá nhân + phòng ban, có Deny
HR Admin / HCNS
Tạo/khóa tài khoản nhân viên, quản lý hồ sơ HCNS
Tài khoản nội bộ và tài liệu HCNS được giao; không mặc nhiên xem toàn bộ hồ sơ mật
Department Manager
Upload, quản lý, duyệt/cấp quyền trong kho phòng ban
Folder/file được Super Admin chỉ định; có thể cấp cho người thuộc phòng khác
Bacnhabook Admin
Tạo/import khách, quản lý học liệu, phân quyền và báo cáo
Kho Bacnhabook
Super Admin
Quản trị cấu hình, người dùng, Folder, quota cảnh báo, backup, nhật ký
Toàn hệ thống
[ĐỀ XUẤT]
 
Mô hình cho phép
 
một người sở hữu nhiều vai trò
 
và quyền theo scope, thay vì tạo tài khoản trùng khi nhân viên đồng thời là người quản lý kho. Super Admin gán quản lý kho; HCNS quản lý tài khoản nhân viên. Việc quản lý danh tính không tự trao quyền đọc tài liệu nhạy cảm.
3. Phạm vi và ngoài phạm vi
3.1 Trong phạm vi release đầu
Tài khoản email/mật khẩu, mật khẩu ngẫu nhiên gửi email khi Admin Bacnhabook tạo khách; ép đổi mật khẩu lần đầu; quên mật khẩu; bảo vệ đăng nhập.
Kho Public/Private; cấp và thu hồi quyền theo tài khoản, phòng ban, file, Folder, thời hạn;
 
Deny ưu tiên Allow
.
Folder nhiều tầng, upload nguyên Folder giữ cấu trúc; mọi định dạng file lưu lên Cloudflare R2; không lưu link ngoài làm học liệu.
Preview Popup + trang tài liệu; PDF/PPT/Office/ảnh/video/audio khi có khả năng chuyển đổi; file nén/định dạng không thể render hiển thị metadata.
Cấu hình tải file từng tài liệu; phiên bản overwrite hoặc save-new-version; tìm kiếm metadata và fulltext Word/Excel/PPT/PDF có text; custom metadata.
Công khai/dự thảo/gửi duyệt, người phê duyệt theo Folder, kế thừa Folder con, lịch sử phê duyệt.
Vòng đời hiệu lực và liên kết tài liệu thay thế; thùng rác retention cấu hình; audit log; Dashboard; thông báo email và in-app; cấp quyền qua link + yêu cầu quyền.
Gói bảo mật Level B; sao lưu DB + R2 độc lập, phục hồi; báo cáo R2 và cảnh báo; tối ưu cả PC và mobile.
3.2 Ngoài phạm vi release đầu
Đồng bộ HRM tự động
: đã thống nhất là hướng tương lai, không nằm trong release đầu, dù tài khoản nội bộ cần thiết kế sẵn khóa liên kết nhân viên để tích hợp sau.
Tích hợp đặt hàng/thanh toán Bacnhabook tự cấp học liệu; quy trình hiện tại do Admin tạo thủ công/Excel.
Chỉnh sửa Word/Excel/PPT online; người quản trị sửa offline rồi upload lại.
Lưu URL ngoài làm tài liệu; tìm kiếm lời nói bên trong video/audio bằng ASR; AI hỏi đáp RAG; PWA/offline; DRM chuyên dụng video (chưa được chọn).
Cơ chế phát sinh theo BR-40 (deadline) chưa được cung cấp.
4. Danh sách baseline yêu cầu BR-01 – BR-39
Mã
Nội dung đã chốt
BR-01
Website hoạt động độc lập
BR-02
Vai trò Guest, nhân viên, HCNS, Admin Bacnhabook, Super Admin; bổ sung quản lý kho phòng ban tại BR-32
BR-03
Khách được truy cập học liệu Private theo email tài khoản đã cấp quyền
BR-04
Admin Bacnhabook chủ động tạo tài khoản khách
BR-05
Email + mật khẩu ngẫu nhiên do hệ thống sinh và gửi email
BR-06
Bắt buộc đổi mật khẩu trong lần đăng nhập đầu
BR-07
Cấp quyền trực tiếp cho file hoặc cả Folder, hỗ trợ Folder con
BR-08
Admin cấu hình quyền download riêng trên từng file
BR-09
Hiển thị tên file chưa có quyền; click hiển thị không có quyền
BR-10
Chỉ upload/lưu file nội bộ; không lưu link học liệu bên ngoài
BR-11
Super Admin quản lý tổng; Admin từng kho tự tạo Folder trong phạm vi được giao
BR-12
Khi cập nhật cho phép ghi đè hoặc tạo version mới
BR-13
HCNS quản lý tài khoản nhân viên trong giai đoạn đầu; HRM đồng bộ tương lai
BR-14
ACL theo phòng ban kết hợp từng cá nhân
BR-15
Deny thắng Allow khi xung đột
BR-16
Cấp quyền vĩnh viễn hoặc có thời hạn do Admin chọn
BR-17
Full-text Search (file có text) + bộ lọc nâng cao
BR-18
Thùng rác, số ngày lưu do Super Admin cấu hình
BR-19
Audit Log đầy đủ và Dashboard thống kê
BR-20
Upload → chọn Nháp / Chờ duyệt / Xuất bản ngay (tùy thẩm quyền)
BR-21
UI riêng theo từng vai trò
BR-22
Preview Popup và trang Viewer riêng
BR-23
Upload cả Folder giữ cây Folder con
BR-24
Tạo khách thủ công + import Excel, gán quyền hàng loạt
BR-25
Copy link; người nhận chưa có quyền gửi request cấp quyền cho Admin
BR-26
Email + thông báo trên website
BR-27
Mọi định dạng file, lưu Cloudflare R2, không áp hạn mức cố định theo loại file ở nghiệp vụ
BR-28
Sửa file offline rồi upload lại
BR-29
Gói bảo mật Level B: private R2, signed links, kiểm soát download, watermark, giới hạn thiết bị/phiên, auto logout, bảo vệ login, audit
BR-30
Responsive tối ưu đầy đủ PC và Mobile
BR-31
Dashboard dung lượng R2, thống kê, cảnh báo khi vượt ngưỡng; cảnh báo không chặn upload
BR-32
Mỗi phòng ban có người quản lý kho riêng
BR-33
Quản lý kho được cấp quyền cho nhân viên khác phòng, chỉ trong tài liệu mình quản lý
BR-34
Người duyệt cấu hình theo Folder và kế thừa xuống Folder con
BR-35
Custom metadata fields theo kho/Folder; người dùng chọn C,
 
không tự đưa Tag thành tính năng bắt buộc
BR-36
Ngày hiệu lực/hết hiệu lực, tự đổi trạng thái, liên kết tài liệu thay thế
BR-37
Backup Database và file R2 sang vùng lưu trữ độc lập, có khả năng khôi phục
BR-38
Thiết kế cho 1.000–10.000 users, 100–500 concurrent, tối đa khoảng 50.000 file
BR-39
Gộp tất cả BR-01…BR-38 trong
 
một giai đoạn bàn giao sản phẩm
BR-40 – [CHƯA CHỐT]:
 
Deadline/khung thời gian triển khai chưa được người yêu cầu xác nhận; không tự suy diễn 1–2 hoặc 3–4 tháng.
5. Quy tắc nghiệp vụ chi tiết
5.1 Danh tính và tạo tài khoản
Admin Bacnhabook tạo Customer theo
 
email duy nhất, chuẩn hóa
; cũng có thể import .xlsx theo mẫu. HCNS tạo, khóa và quản trị tài khoản nhân viên; Super Admin có thể can thiệp mọi scope.
Khi tạo khách mới, hệ thống phát sinh mật khẩu ngẫu nhiên an toàn,
 
gửi email ngay
 
theo yêu cầu, chỉ lưu
 
hash
; đánh dấu
 
must_change_password=true
. Không ghi mật khẩu thô vào log, response API, Excel export hoặc Database.
Tài khoản mới không được gọi API tài liệu Private cho tới khi đổi mật khẩu thành công. Email bị trùng thì
 
không tạo lại mật khẩu/không gửi mật khẩu mới
; cho phép cập nhật grant sau khi Admin xác nhận.
Quên mật khẩu qua email có token ngắn hạn, một lần dùng
 
[ĐỀ XUẤT]
; bảo vệ brute-force; Admin được cấp MFA/2FA theo BR-29.
Login email/password là phương thức xác thực đã chốt. Không tự thêm Google SSO hoặc OTP-only thành yêu cầu bắt buộc.
5.2 Phân quyền & quyền hiển thị
Access type:
 
PUBLIC | PRIVATE
 
ở mức file; Folder có thể cung cấp mặc định theo chính sách quản trị.
Permission nghiệp vụ:
 
VIEW
,
 
DOWNLOAD
; quyền quản lý riêng gồm
 
MANAGE
,
 
GRANT
,
 
PUBLISH
,
 
APPROVE
 
theo vai trò/scope.
Grant có
 
subject_type = USER | DEPARTMENT
,
 
target_type = FILE | FOLDER
,
 
effect = ALLOW | DENY
,
 
valid_from
,
 
valid_until
 
(null = vĩnh viễn), audit author.
Khi cấp trên Folder, quyền
 
kế thừa cho thư mục con và file mới trong Folder
, trừ khi bị Deny áp dụng.
Với mọi request, lấy toàn bộ grant có hiệu lực trên node hiện tại và ancestor; một Deny trùng hành động là
 
từ chối
; nếu không Deny nhưng có Allow hợp lệ thì cho phép; còn lại từ chối. Super Admin có quyền quản trị break-glass theo audit
 
[ĐỀ XUẤT]
, không tự bypass kiểm soát bảo mật khi chưa có đặc tả.
Public: Guest được xem nội dung đã
 
Published
 
và đang hiệu lực theo chính sách; Private phải đăng nhập và có
 
VIEW
. Download phải kiểm tra cấu hình
 
is_downloadable=true
 
và quyền tải tương ứng.
BR-09 [CHỐT]:
 
Danh sách tài liệu Private vẫn hiển thị tên; nhấn vào khi không có quyền nhận thông báo.
 
[RỦI RO/CHƯA CHỐT]:
 
tên hồ sơ HCNS có thể là dữ liệu nhạy cảm. Đề xuất bổ sung
 
listing_visibility = PUBLIC_METADATA | RESTRICTED_METADATA
 
áp dụng theo kho; hiện chưa được chấp thuận để thay đổi BR-09. Không đưa snippet fulltext, preview, metadata nhạy cảm vào kết quả tìm kiếm của người chưa có VIEW.
Share URL chỉ chứa identifier/route; không cấp đặc quyền. Request-access được chuyển đúng người quản trị scope, tránh gửi tên hồ sơ nhạy cảm ra ngoài.
5.3 Quyền download và điều kiện render
Không có quyền VIEW → không được lấy preview bytes, text trích xuất, media playlist, poster nhạy cảm hoặc original URL.
VIEW nhưng
 
is_downloadable=false
 
→ chỉ cấp bản render/preview hoặc media stream có xác thực;
 
không cung cấp original file
 
thông qua endpoint download.
VIEW và
 
is_downloadable=true
 
+ quyền DOWNLOAD → được tải file gốc; quyền quản trị file được xử lý riêng.
Browser luôn nhận dữ liệu cần để hiển thị nên không thể đảm bảo 100% chống sao chép hoặc ghi màn hình; watermark giúp truy vết/răn đe. ZIP/RAR và định dạng không preview được chỉ hiện thông tin và tải nếu được cấp quyền.
5.4 Upload, phiên bản và Folder
Cho phép upload
 
mọi định dạng
 
vào luồng kiểm tra an toàn; file độc hại bị cách ly, không phân phối cho người dùng dù đã upload thành công ở tầng lưu trữ.
Folder upload tạo đúng cấu trúc node; report tiến độ và lỗi từng file; không tự giải nén ZIP để tạo Folder (không chọn BR-23 E).
Ghi đè cập nhật file hiện hành (không có phiên bản trong
 
lịch sử tài liệu UI
); tạo version mới thì lưu V1…Vn và hỗ trợ restore. BR-37 backup phải độc lập với lịch sử version ở UI.
Khi cập nhật, giữ ACL và metadata trừ khi Admin chỉnh rõ. Preview/index cần rebuild sau upload, restore, move, update.
Tên trùng, di chuyển Folder chứa grant, quyền khi thư mục bị chuyển sang kho khác: cần quy tắc trong Open Decisions trước khi coding production.
5.5 Quy trình xuất bản và hiệu lực
publication_status
:
 
DRAFT
,
 
PENDING_APPROVAL
,
 
PUBLISHED
,
 
REJECTED
 
(REJECTED có thể đưa về DRAFT khi sửa). Chỉ người có quyền PUBLISH được xuất bản ngay.
Folder cấu hình danh sách người duyệt, Folder con kế thừa hoặc override; approve/reject ghi lịch sử và lý do từ chối. Cấu hình số bước duyệt/chính sách tự duyệt là
 
[CHƯA CHỐT]
.
lifecycle_status
 
tính từ
 
effective_from
,
 
effective_until
:
 
SCHEDULED
,
 
ACTIVE
,
 
EXPIRED
;
 
ARCHIVED
 
dùng khi được quản trị lưu trữ. Không nhầm trạng thái này với
 
publication_status
.
Tài liệu hết hiệu lực vẫn có thể tra cứu lịch sử khi có quyền theo cấu hình, hiển thị nhãn cảnh báo và link tài liệu thay thế. Hết hiệu lực không tự xóa.
5.6 Thùng rác, backup, audit
Soft delete file/Folder, giữ nguyên parent tree và thông tin phục hồi; khi restore kiểm tra xung đột vị trí và quyền.
Super Admin cấu hình retention (ví dụ 30/60/90 ngày –
 
đề xuất
, không phải mặc định đã chốt). Dữ liệu có retention pháp lý không xóa theo lịch thường.
Backup
 
Database + objects R2
 
tại vùng lưu trữ độc lập; cần cơ chế snapshot consistency và restore thử nghiệm. RPO/RTO/chu kỳ và lưu giữ backup là Open Decisions.
Mọi thay đổi tài khoản, quyền, duyệt, file, tải, thất bại ACL, backup đều phát sinh audit event (actor, target, action, timestamp, result, request_id; IP/device nếu phù hợp luật/quy chế).
6. Luồng người dùng (User Journeys)
J1 – Khách Bacnhabook sử dụng học liệu được cấp quyền
Admin tạo Customer theo email → chọn file/Folder và thời hạn → hệ thống gửi email chứa mật khẩu ngẫu nhiên.
Khách login → bị điều hướng đến đổi mật khẩu lần đầu → login/phiên mới an toàn.
Khách xem thư viện theo UI Bacnhabook; với file Private không có quyền: click hiện thông báo và nút yêu cầu quyền.
Với file có quyền: popup preview hoặc mở trang Viewer; watermark theo tài khoản; download chỉ nếu file cho tải và quyền cho phép.
Khách có thể copy link; người nhận chưa có quyền chỉ được gửi yêu cầu quyền, không dùng link như vé truy cập.
J2 – HCNS onboard nhân viên và cấp quyền nội bộ
HCNS tạo Employee, gán phòng ban → gửi thông tin tài khoản theo quy trình cấu hình.
HCNS cấp quyền theo phòng ban và/hoặc cá nhân; grant thời hạn hoặc vĩnh viễn.
Nhân viên đăng nhập, thấy UI kho nội bộ → tìm tài liệu theo tên, nội dung được phép, metadata → xem/tải.
Khi chuyển phòng ban hoặc nghỉ việc, HCNS chủ động cập nhật/khóa account ở release đầu (tự đồng bộ HRM là tương lai).
J3 – Quản lý kho xuất bản bộ tài liệu
Department Manager mở kho được giao → upload Folder nhiều cấp → hệ thống đưa file lên R2 và chạy background preview/index/scan.
Quản lý gán custom metadata, Access type, download policy, thời hạn hiệu lực; chọn overwrite/new version khi cập nhật.
Chọn Draft/Submit/Publish theo thẩm quyền → người duyệt cấp Folder nhận notification → approve/reject.
Sau Published, người dùng được phép tra cứu; mọi event ghi Audit.
J4 – Xử lý yêu cầu quyền
User thấy tài liệu Private chưa có quyền → bấm yêu cầu truy cập, điền lý do.
Request được chuyển đúng Admin Bacnhabook/HCNS/Department Manager có quyền grant.
Người duyệt xem request → cấp quyền có thời hạn hoặc từ chối; thông báo in-app + email.
Hệ thống kiểm tra lại Deny từ mọi cấp, không tự bypass Deny.
J5 – Xử lý dữ liệu hết hạn hoặc sự cố
Job đánh dấu hết hiệu lực, gửi thông báo; admin gán tài liệu thay thế, vẫn giữ lịch sử cũ.
Nếu xóa nhầm → khôi phục từ Recycle Bin trong thời hạn; nếu mất/hỏng dữ liệu → quy trình restore backup DB + R2.
Tất cả thao tác đều được ghi Audit và thể hiện trong Dashboard scope tương ứng.
7. Giao diện và sitemap
/                              Trang public + tìm kiếm danh mục
/login                         Đăng nhập email/mật khẩu
/change-password-first-login   Đổi mật khẩu bắt buộc
/forgot-password               Khôi phục qua email
/library                       Thư viện theo vai trò
/library/folders/:folderId     Cây Folder + file
/library/files/:fileId         Document Viewer
/requests                      Các yêu cầu quyền của tôi
/notifications                 Trung tâm thông báo
/bacnhabook                    Trang chủ học liệu cho Customer
/admin/bacnhabook              Quản trị học liệu + khách hàng
/admin/hr                      Tài khoản nhân viên + kho HCNS
/admin/departments/:id         Quản lý kho phòng ban
/admin/system                  Super Admin – User/Role/Storage/Logs/Backup
Bộ component UI chính:
 
Header + Search, Sidebar Folder, file grid/list, breadcrumbs, preview modal, file detail page, metadata form động, quyền file/Folder dạng ACL editor, request permission modal, upload job panel, Approval Inbox, notification drawer, Dashboard cards/charts.
Tính tương thích:
 
Desktop/Tablet/Mobile; bảng quản trị dùng responsive table/card; viewer cho chạm, tua, phóng to; upload file từ điện thoại. Không lấy UI ẩn làm bằng chứng phân quyền.
8. Mô hình dữ liệu khái niệm (đề xuất cho Dev/AI)
Entity
Trường chính / mục đích
User
id, email unique, password_hash, status, must_change_password, last_login
Role / UserRole
role_code, user_id, scope_type, scope_id
Department
id, name, code, parent_id?
DepartmentMembership
user_id, department_id, active_from, active_until
Repository
id, type (BACNHABOOK/HR/DEPARTMENT/COMMON), owner_department_id?, name
Folder
id, repository_id, parent_id, name, path_cache, deleted_at
Document
id, folder_id, filename, mime_type, size, object_key, access_type, downloadable, publication_status, deleted_at
DocumentVersion
id, document_id, version_number, object_key, created_by, checksum, created_at
PreviewAsset
document_version_id, preview_object_key, preview_type, processing_status
ACLGrant
id, subject_type, subject_id, target_type, target_id, action, effect, valid_from, valid_until, granted_by
ApprovalConfig
folder_id, approver_user_id, order?, inherit_from_parent
ApprovalRequest
document_id, requester_id, status, approver_id, reason, decided_at
AccessRequest
requester_id, target_type, target_id, reason, status, reviewer_id, decided_at
MetadataDefinition
repository_id/folder_id, key, label, data_type, required, choices_json, inherited
MetadataValue
document_id, definition_id, value_json
DocumentLifecycle
document_id, effective_from, effective_until, replacement_document_id, archived_at
Notification / EmailOutbox
recipient_id, event_type, payload_redacted, sent_at, read_at, status
AuditLog
actor_id, action, entity_type, entity_id, outcome, ip?, user_agent?, request_id, created_at
UploadJob / UploadItem
uploaded_by, folder_destination, relative_path, object_key, state, progress, error
StorageUsageSnapshot
repository_id, measured_at, file_count, bytes_used, estimated_cost?
BackupRun
backup_id, db_ref, object_manifest_ref, status, started_at, finished_at, check_result
DeviceSession
user_id, device_id, session_id, last_active_at, expires_at, revoked_at
[ĐỀ XUẤT]
 
Không lưu raw password.
 
object_key
 
tách khỏi
 
filename
, không dựa vào path hiển thị; sử dụng checksum giúp phát hiện lỗi và đối chiếu backup. Thiết kế FK/partition/index theo Postgres, ACL ancestor expansion phải tối ưu cho 50.000 file.
9. Hệ thống tích hợp & kiến trúc giải pháp (đề xuất, chưa chốt stack)
Web Next.js (Public / Customer / Employee / Admin UI)
               |
      HTTPS + Auth Session
               |
    Backend API (Node.js/NestJS)
       |        |        |         \
  PostgreSQL  Redis   Background Jobs   Search Index
       |                   |                 |
 ACL + Audit     scan / preview / fulltext / email
       |
     Private Cloudflare R2 (original + private previews)
       |
  Independent backup store (DB snapshots + R2 objects/manifest)
Nguyên tắc thiết kế:
FE không tự quyết định quyền; quyền tập trung ở backend/domain service
 
AuthorizationService
.
Upload qua presigned PUT/Multipart với bucket private, backend xác nhận hoàn thành và kiểm tra metadata/chống payload giả mạo. Mọi file trước khi phát hành phải qua pipeline xử lý an toàn.
Preview PDF/PPT/Office qua conversion worker; audio/video dùng streaming có auth; link/token xem và tải ngắn hạn.
Fulltext index chỉ tra cứu/search sau khi truy vấn quyền; không index nội dung lộ cho user unauthorized qua snippet/highlight.
Background Jobs cho: email, import Excel, preview conversion, fulltext, scheduled expiry, R2 usage snapshots, backup, restore.
Metrics/tracing cần có correlation ID; bảo vệ task background khỏi bị thực thi lặp/hỏng trạng thái.
Các API nhóm cần thiết:
 
Auth; Users/Departments; Repositories/Folders; Documents/Versions/Preview; Grants/ACL Check; Uploads; Approvals; Access Requests; Metadata Schemas; Search; Notifications; Audit; Dashboard; Storage; Backup. Chi tiết endpoint và hợp đồng API có ở AI Implementation Pack.
10. Yêu cầu phi chức năng và kiểm thử
NFR
Chỉ tiêu / tiêu chí
Quy mô
Tham chiếu BR-38: 1.000–10.000 accounts, 100–500 concurrent users, ~50.000 files
Môi trường
Dev / Staging / Production, cấu hình R2 tách biệt, fake email ở staging
Hiệu năng
[ĐỀ XUẤT]
 
p95 API metadata < 800 ms ở tải tham chiếu; p95 tìm kiếm < 2 s (không tính lúc index chưa sẵn); kiểm thử thực nghiệm
Availability
[CHƯA CHỐT]
 
SLA mong muốn, khung bảo trì và thời gian khôi phục
Upload
Multipart/resume khi file lớn; UI tiến độ theo từng file, retry/idempotency
Security
MFA Admin; rate-limit; CSRF/XSS/CORS; JWT/session an toàn; signed short-lived URL; encryption in transit/at rest; malware scanning
Permission
Test Allow/Deny ở folder ancestor, file, cá nhân, phòng ban, hết hạn, revoked session và share link
Privacy
Không trả text snippet/preview nhạy cảm cho unauthorized; audit truy cập; chính sách retention tối thiểu theo yêu cầu pháp lý nội bộ
Search
Chỉ search nội dung PDF/Office có text; ảnh scan chưa OCR; video/audio chưa ASR
Backup
DB và objects R2 độc lập, restore thử nghiệm; RPO/RTO còn chờ định nghĩa
Mobile
Viewer, bảng, thao tác quyền, upload hoạt động trên viewport mobile; WCAG AA là
 
[ĐỀ XUẤT]
Observability
Theo dõi 5xx, conversion fail, R2 errors, email fail, ACL denials, backup failure
10.1 Nhóm test end-to-end bắt buộc
Guest thấy file Private trong list nhưng mở trả
 
403
, không nhận object URL/preview snippet; file Public Published được xem.
Cấp ALLOW Folder A, upload file mới vào Folder con; Employee được xem; thêm DENY user trên Folder A thì nhận
 
403
 
kể cả có ALLOW file.
ACL hết hạn bị từ chối tự động; cấp lại không cần upload lại file.
Đặt
 
downloadable=false
: không lộ download endpoint trả original; có preview nếu định dạng hỗ trợ.
Import 100 emails gồm trùng/sai format: báo cáo từng dòng, không tạo duplicate, email chỉ gửi tài khoản mới.
Admin Bacnhabook không thể xem/cấp quyền kho HCNS hoặc gọi API admin system dù sửa URL thủ công.
Approval config Folder cha kế thừa xuống Folder con, override nếu khai báo; publish không duyệt khi không có quyền.
Ghi đè vs tạo version mới cho kết quả khác nhau; restore version mới tạo audit + rebuild preview/index.
Recycle Bin restore Folder có cây con và grants; hết retention xóa theo chính sách, không xóa hồ sơ đang hold.
Tìm fulltext text có quyền; user thiếu quyền không nhận excerpt/index private; tài liệu hết hiệu lực có cảnh báo và link thay thế.
Max device/concurrency, idle timeout và login limit hoạt động; session bị revoke không dùng được tài liệu.
Test restore DB + R2 từ backup độc lập vào staging và validate số file/hash/quyền.
11. Vận hành, báo cáo và nghiệm thu
Dashboard theo scope:
 
user active, view/download, request pending, top documents, dung lượng theo kho/định dạng, tăng trưởng dung lượng, cảnh báo ngưỡng, tình trạng backup.
Thông báo:
 
email và in-app cho tạo tài khoản, grant/revoke, yêu cầu quyền, approval, expire-soon, cập nhật version (tùy cấu hình).
Audit:
 
không cho Admin Bacnhabook xem log HCNS, người quản lý kho chỉ xem log của kho được giao; sự kiện bảo mật và sửa log không được xóa/sửa qua UI thường.
Tài liệu bàn giao:
 
thiết kế UX/UI responsive, OpenAPI, schema migration, hướng dẫn R2, runbook backup/restore, cấu hình email, kịch bản QA/UAT, hướng dẫn Admin/HCNS, monitoring và kế hoạch rollback.
Điều kiện nghiệm thu:
 
tất cả stories Release 1 đạt AC, không còn lỗi bảo mật nghiêm trọng, có test tải 100–500 concurrent theo workload đại diện, có báo cáo restore thử nghiệm thành công và UAT xác nhận các hành trình J1–J5.
12. Open Decisions / Rủi ro cần phê duyệt trước khi khóa thiết kế kỹ thuật
ID
Chủ đề
Cần quyết định
Khuyến nghị
OD-01
BR-40 Deadline
Ngày bàn giao/ngân sách/team hiện hữu
Estimate theo backlog trước khi commit
OD-02
Tên tài liệu HCNS
BR-09 cho hiển thị tên chưa có quyền; nguy cơ lộ metadata mật
Thêm visibility restricted theo kho nếu được duyệt
OD-03
Email chứa mật khẩu thô
Người dùng yêu cầu random password gửi email
Temp password có TTL ngắn, must-change; gửi link đặt password an toàn hơn nhưng cần CR nếu đổi
OD-04
Rule download
VIEW/Download Boolean và ACL action DOWNLOAD kết hợp thế nào
can_download = allow_download_flag AND effective_ACL(DOWNLOAD)
; ghi rõ trong UI
OD-05
Conflict path/folder
Tên trùng, move giữa kho, restore trùng tên
Preview conflict và chọn Skip/Rename/Merge có audit
OD-06
Duyệt
Một hay nhiều người duyệt? Có chặn self-approval?
1 bước, 1+ approvers; mặc định không tự duyệt trừ quyền riêng
OD-07
Metadata
Override field kế thừa; đổi key/type có migrate dữ liệu cũ không
Không xóa field đang có giá trị, migration có kiểm soát
OD-08
Backup
Chu kỳ backup, số ngày giữ, RPO/RTO, nơi lưu độc lập
Họp DevOps/InfoSec chốt; test restore định kỳ
OD-09
Media
Tập định dạng media/Office preview đảm bảo; video convert HLS?
Tạo compatibility matrix; fallback metadata/download
OD-10
Security Level B
Max devices, concurrent sessions, idle-timeout, watermark vị trí/tần suất
Đưa vào admin config có default được duyệt
OD-11
R2 storage alert
Chi phí từ API/billing thực tế hay ước tính
Phân biệt Estimated và Actual; không gắn sai là hóa đơn
OD-12
Hạn mức upload
BR-27 không giới hạn nghiệp vụ; R2, browser và malware worker có giới hạn kỹ thuật
Tách hạn mức kỹ thuật; hỗ trợ multipart và khả năng resume
OD-13
Employee account email
Quy trình sinh mật khẩu/gửi email cho nhân viên được nêu như đề xuất, chưa chốt bằng user
Dùng cùng flow với customer nếu được duyệt
OD-14
Retention pháp lý
Hồ sơ quyết toán lưu bao lâu, ai được xóa vĩnh viễn
Phân loại hồ sơ và legal hold trước khi triển khai xóa tự động
OD-15
Public status
Có cho PUBLIC đã hết hiệu lực hiển thị ngoài website không?
Hiển thị nhãn hết hiệu lực hoặc ẩn khỏi trang Public theo chính sách
Quản trị thay đổi:
 
Các OD là điểm khóa thiết kế, không được để AI coding agent tự chọn âm thầm và ghi là
 
“
đã chốt
”
.
13. Bản đồ Epics và tài liệu kèm theo
User Stories có mã, persona, mục tiêu, Acceptance Criteria dạng kiểm thử được, phụ thuộc và ưu tiên triển khai nằm trong
 
02_Backlog_User_Stories.md/.docx
. Hướng dẫn cho AI coding agent, API đề xuất, thứ tự triển khai theo Sprint kỹ thuật (không chia release), checklist security nằm trong
 
03_AI_VibeCoding_Implementation_Pack.md
.
Lưu ý:
 
Ưu tiên P0/P1/P2 trong backlog là
 
thứ tự triển khai bên trong một release
, không phải lời đề nghị cắt P1/P2 khỏi phạm vi đã chốt.