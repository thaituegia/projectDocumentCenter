BACKLOG USER STORIES & ACCEPTANCE CRITERIA
WEBSITE KHO TÀI LIỆU & HỌC LIỆU BACNHABOOK
Phiên bản:
 
1.0 |
 
Ngày:
 
11/11/2026 |
 
Release:
 
1 lần bàn giao đầy đủ BR-01–BR-38.
Phạm vi:
 
Các Epic và User Stories dưới đây phục vụ triển khai Dev + AI vibe-coding,
 
không chia MVP nhỏ
. Thứ tự P0/P1/P2 chỉ định dependency/ưu tiên làm trước trong
 
cùng một release
.
Definition of Ready (DoR):
 
BR mapping rõ, AC test được, UX/API/schema có đề xuất, trường hợp ngoại lệ nhận diện, không còn OD chặn coding.
Definition of Done (DoD):
 
Code + migration + unit/integration/E2E test + permission test + audit + logs + docs + review security + UAT pass + staging smoke + production rollback plan.
Tổng cộng: 63 User Stories, 12 Epics.
1. Bản đồ Epic & độ ưu tiên
Epic
Nội dung
Số stories
P0
P1
P2
E01 – Tài khoản & xác thực
Tài khoản & xác thực
7
7
0
0
E02 – Kho & Folder
Kho & Folder
5
4
1
0
E03 – File & Viewer
File & Viewer
9
6
3
0
E04 – ACL & chia sẻ
ACL & chia sẻ
8
8
0
0
E05 – Import Bacnhabook
Import Bacnhabook
3
3
0
0
E06 – Xuất bản & phê duyệt
Xuất bản & phê duyệt
4
3
1
0
E07 – Tìm kiếm & metadata
Tìm kiếm & metadata
5
4
1
0
E08 – Vòng đời & xóa
Vòng đời & xóa
5
3
2
0
E09 – Thông báo & yêu cầu
Thông báo & yêu cầu
3
3
0
0
E10 – Dashboard & Audit
Dashboard & Audit
4
1
2
1
E11 – Bảo mật & vận hành
Bảo mật & vận hành
7
7
0
0
E12 – UX & tích hợp tương lai
UX & tích hợp tương lai
3
1
1
1
E01 – Tài khoản & xác thực
AUTH-01 — Admin Bacnhabook tạo khách hàng
User Story:
 
Là
 
Admin Bacnhabook
, tôi muốn
 
tạo Customer từ email
 
để
 
khách nhận tài khoản và chỉ được dùng học liệu đã cấp
.
Mapping:
 
BR-03,04,05 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given email hợp lệ chưa tồn tại, when Admin tạo khách, then hệ thống tạo user Customer, password ngẫu nhiên được hash, gửi email khởi tạo và đặt must_change_password=true.
Given email đã tồn tại, when tạo lại, then không tạo user trùng/không gửi lại mật khẩu; Admin có đường dẫn cấp quyền bổ sung.
Given Admin Bacnhabook tạo khách, then không có khả năng gán vai trò HCNS hoặc Super Admin.
AUTH-02 — Đổi mật khẩu lần đăng nhập đầu
User Story:
 
Là
 
Customer
, tôi muốn
 
đăng nhập bằng mật khẩu ban đầu và đổi mật khẩu
 
để
 
đảm bảo tài khoản an toàn
.
Mapping:
 
BR-05,06 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
AUTH-01
Acceptance Criteria (Given / When / Then):
Given Customer có must_change_password=true, when login đúng, then điều hướng cưỡng chế sang màn đổi mật khẩu và chặn các API Private khác.
When đổi thành công then hash mới được lưu, mật khẩu cũ vô hiệu, must_change_password=false, tạo audit event.
Given mật khẩu mới không đạt chính sách, then hiển thị lỗi và không xóa cờ bắt buộc.
AUTH-03 — Đăng nhập và khôi phục mật khẩu
User Story:
 
Là
 
Người dùng đã có tài khoản
, tôi muốn
 
đăng nhập/đăng xuất và khôi phục qua email
 
để
 
truy cập hệ thống an toàn
.
Mapping:
 
BR-05,06,29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given email/mật khẩu đúng và account active, then tạo session an toàn và route theo vai trò.
Given mật khẩu sai nhiều lần, then áp dụng rate limit/defense và ghi sự kiện; thông báo không lộ email có tồn tại.
Given yêu cầu quên mật khẩu, then chỉ token khôi phục một lần dùng/hết hạn mới đổi được mật khẩu; token đã dùng bị vô hiệu.
AUTH-04 — HCNS quản lý tài khoản nhân viên
User Story:
 
Là
 
HCNS
, tôi muốn
 
tạo, khóa, mở khóa và cập nhật phòng ban cho Employee
 
để
 
quản lý vòng đời nhân sự
.
Mapping:
 
BR-13,14,32 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given HCNS tạo nhân viên, then email unique, gán đúng phòng ban và có trạng thái tài khoản rõ ràng.
Given Employee bị khóa, then session hiện có mất hiệu lực và các API Private trả từ chối.
Given HCNS đổi phòng ban, then hệ thống tính lại ACL theo membership mà không giữ Allow phòng ban cũ vô điều kiện.
AUTH-05 — Super Admin gán vai trò và phạm vi
User Story:
 
Là
 
Super Admin
, tôi muốn
 
gán vai trò quản lý kho, Admin Bacnhabook, HCNS
 
để
 
phân cấp vận hành
.
Mapping:
 
BR-02,11,32 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Super Admin chỉ định Department Manager cho một Repository, then người đó chỉ quản lý scope được gán.
When thu hồi role/scope, then quyền quản trị tương ứng mất hiệu lực ngay trong API.
Given non-Super Admin gọi API gán Super Admin, then nhận 403 và ghi audit.
AUTH-06 — Giới hạn thiết bị, phiên và idle timeout
User Story:
 
Là
 
Super Admin
, tôi muốn
 
cấu hình tối đa thiết bị, phiên đồng thời và timeout
 
để
 
giảm chia sẻ tài khoản
.
Mapping:
 
BR-29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given thiết lập tối đa phiên/thiết bị, when vượt hạn mức, then áp dụng chính sách từ chối/revoke được cấu hình và phản hồi dễ hiểu.
Given phiên idle quá ngưỡng, then không còn quyền gọi API; người dùng cần login lại.
Given user đăng xuất thiết bị, then token/refresh token của phiên đó bị vô hiệu.
AUTH-07 — Xác thực hai lớp cho Admin
User Story:
 
Là
 
HCNS/Quản lý kho/Admin
, tôi muốn
 
bật xác thực 2 lớp
 
để
 
giảm nguy cơ lộ tài khoản quản trị
.
Mapping:
 
BR-29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Admin hợp lệ, when đăng nhập, then hệ thống yêu cầu bước MFA được cấu hình trước khi truy cập Admin.
Given MFA sai/hết hạn, then không tạo admin session và ghi sự kiện.
Given cần reset MFA, then chỉ Super Admin hoặc quy trình khôi phục đủ điều kiện được thực hiện và có audit.
E02 – Kho & Folder
FOLD-01 — Duyệt cây kho, Folder và file
User Story:
 
Là
 
Guest/Employee/Customer
, tôi muốn
 
xem cây thư mục đa cấp theo giao diện vai trò
 
để
 
tìm nội dung nhanh
.
Mapping:
 
BR-07,09,11,21 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given người dùng mở Repository, then thấy breadcrumbs, Folder con, file trong Folder và bộ lọc.
Given file Private không có VIEW, then tên file vẫn hiển thị theo BR-09 nhưng không trả preview nội dung hoặc metadata nhạy cảm.
Given Folder đã xóa, then biến mất khỏi danh sách thường và chỉ xuất hiện trong Recycle Bin đúng scope.
FOLD-02 — Tạo/sửa/xóa/di chuyển Folder
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
quản lý cấu trúc Folder trong scope
 
để
 
tổ chức kho dễ dàng
.
Mapping:
 
BR-11,32 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given manager có MANAGE trên Folder cha, then có thể tạo Folder con.
Given manager không quản lý repository, then gọi trực tiếp API sửa/move/xóa trả 403.
Given move Folder, then hệ thống từ chối move vào chính nó hoặc descendants và ghi audit.
FOLD-03 — Thiết lập người quản lý kho
User Story:
 
Là
 
Super Admin
, tôi muốn
 
ủy quyền phạm vi theo Repository/Folder
 
để
 
mỗi phòng ban tự quản lý
.
Mapping:
 
BR-32,33 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Super Admin chỉ định manager của phòng ban, then manager được upload, quản lý file và grant tài liệu scope đó.
Given manager A truy cập Repository B không được giao, then không đọc/ghi/approve bằng API.
When thu hồi scope, then editor và grant editor bị vô hiệu ngay.
FOLD-04 — Upload nguyên Folder giữ cấu trúc
User Story:
 
Là
 
Admin/Quản lý kho
, tôi muốn
 
chọn Folder trên PC/mobile và upload
 
để
 
đưa bộ học liệu lên nhanh
.
Mapping:
 
BR-23,27 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
FOLD-02,FILE-01
Acceptance Criteria (Given / When / Then):
Given cây Folder nhiều cấp, when upload, then tạo đúng hierarchy và giữ relative path từng file.
Given một file thất bại, then job thể hiện success/fail per-file và hỗ trợ retry file lỗi không duplicate file đã thành công.
Given tệp có định dạng bất kỳ, then nhận upload qua pipeline an toàn, không tự giải nén ZIP thành Folder.
FOLD-05 — Kế thừa cấu hình Folder
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
thiết lập chính sách mặc định tại Folder cha
 
để
 
giảm cấu hình lặp
.
Mapping:
 
BR-07,08,34,35 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Folder con không override, then nhận giá trị config được kế thừa từ parent.
Given Folder con override người duyệt hoặc metadata policy, then chỉ áp dụng override tại subtree tương ứng.
When parent đổi cấu hình, then cây con không override được tính lại đúng và có audit.
E03 – File & Viewer
FILE-01 — Upload file lên R2 Private
User Story:
 
Là
 
Admin/Quản lý kho
, tôi muốn
 
upload file mọi định dạng
 
để
 
lưu dữ liệu tập trung
.
Mapping:
 
BR-10,27 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given tài khoản có MANAGE, when bắt đầu upload, then backend tạo upload job và signed upload chỉ đúng object key, TTL ngắn.
Given upload hoàn tất, then backend xác minh object tồn tại/size/checksum được cấu hình trước khi publish metadata.
Given object chưa scan hoặc thất bại kiểm tra, then file không có URL xem/tải cho end-user.
FILE-02 — Đặt metadata cơ bản và download policy
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
chỉnh tên, mô tả, Public/Private, is_downloadable
 
để
 
quản lý file linh hoạt
.
Mapping:
 
BR-08,09,10 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given có quyền quản lý, when sửa metadata, then thông tin lưu và có audit.
Given is_downloadable=false, then user VIEW không lấy được original qua download API.
Given chuyển Public→Private, then URL truy cập cũ không còn cấp nội dung ngoài hạn TTL đã phát hành; mọi request mới cần ACL.
FILE-03 — Preview popup tài liệu
User Story:
 
Là
 
Người dùng có VIEW
, tôi muốn
 
xem nhanh tài liệu không rời danh sách
 
để
 
tiết kiệm thao tác
.
Mapping:
 
BR-22 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given file có preview ready, when bấm xem nhanh, then modal hiển thị nội dung và controls đúng định dạng.
Given thiếu VIEW, then modal thông báo không có quyền, không fetch preview bytes.
Given preview chưa xử lý hoặc định dạng không hỗ trợ, then hiển thị trạng thái/fallback mà không lỗi giao diện.
FILE-04 — Trang Viewer riêng, responsive
User Story:
 
Là
 
Người dùng có VIEW
, tôi muốn
 
mở trang đọc/xem toàn màn hình
 
để
 
học và tra cứu hiệu quả
.
Mapping:
 
BR-22,30 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given PDF/PPT/ảnh, then viewer zoom/đổi trang/toàn màn hình theo khả năng định dạng.
Given audio/video, then có play/pause/seek/tốc độ/toàn màn hình khi phù hợp.
Given viewport mobile, then controls không bị tràn và touch input hoạt động.
FILE-05 — Tải original đúng quyền
User Story:
 
Là
 
Người dùng có VIEW và DOWNLOAD
, tôi muốn
 
tải tài liệu được cho phép
 
để
 
sử dụng ngoại tuyến khi được phép
.
Mapping:
 
BR-08,29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given downloadable=true và effective ACL DOWNLOAD Allow, then endpoint cấp file original/URL TTL ngắn.
Given downloadable=false hoặc Deny DOWNLOAD, then endpoint 403 kể cả gọi thủ công.
Given Admin quản lý file, then có action lấy original để sửa offline theo quyền MANAGE riêng.
FILE-06 — Watermark động trên bản xem
User Story:
 
Là
 
Khách hàng/Nhân viên
, tôi muốn
 
xem tài liệu với watermark định danh
 
để
 
răn đe rò rỉ học liệu
.
Mapping:
 
BR-29 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given viewer mở file có watermark policy, then email định danh/giá trị cho phép hiển thị trên lớp xem.
Given user chưa có VIEW, then không cấp nội dung dù có watermark.
Given chuyển trang/seek/fullscreen, then watermark vẫn xuất hiện theo cấu hình; không tuyên bố chống chụp màn hình tuyệt đối.
FILE-07 — Ghi đè tài liệu
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
upload bản mới thay bản hiện tại
 
để
 
cập nhật nhanh
.
Mapping:
 
BR-12,28 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given lựa chọn overwrite, then current file object ref cập nhật sau khi scan thành công, không thêm version UI mới.
Given update không thành công, then current file cũ vẫn hoạt động.
When overwrite thành công, then preview/index được regenerate và audit chứa actor/time.
FILE-08 — Tạo và khôi phục phiên bản
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
lưu V1/V2 và phục hồi
 
để
 
theo dõi thay đổi quan trọng
.
Mapping:
 
BR-12 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given chọn new version, then phiên bản cũ được giữ, version_number tăng tuần tự.
Given chọn restore version cũ, then current content đúng version được chọn, quyền và metadata được bảo toàn theo policy.
Given user thiếu quyền MANAGE, then không xem object original của version hoặc restore.
FILE-09 — Pipeline scan/convert/index
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
scan file và chuyển định dạng xem trước, lấy fulltext
 
để
 
phục vụ preview và search an toàn
.
Mapping:
 
BR-17,22,27 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given upload mới, then tạo processing job có trạng thái queued/processing/ready/failed và retry.
Given PDF/Office chứa văn bản đọc được, then text được trích xuất và lập chỉ mục đúng document ID.
Given file nguy hiểm/không hợp lệ, then đánh dấu quarantined và không phân phối qua preview/download.
E04 – ACL & chia sẻ
ACL-01 — Cấp quyền trực tiếp theo user/file
User Story:
 
Là
 
Admin/Quản lý kho
, tôi muốn
 
chọn email và action VIEW/DOWNLOAD
 
để
 
cấp đúng nội dung
.
Mapping:
 
BR-03,07,08,33 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Admin có quyền GRANT trong scope, then có thể tạo Allow trên file cho employee/customer phù hợp.
Given Admin chọn file thuộc kho khác, then API trả 403.
Given grant mới, then audit lưu subject, target, action, effect và người cấp.
ACL-02 — Cấp quyền theo Folder và kế thừa
User Story:
 
Là
 
Admin/Quản lý kho
, tôi muốn
 
cấp truy cập toàn bộ Folder
 
để
 
không phải cấp từng file
.
Mapping:
 
BR-07,11 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Allow VIEW trên Folder, then user được VIEW các file hiện có và file mới ở mọi cấp con.
Given thu hồi quyền Folder, then các quyền kế thừa mất hiệu lực; grant trực tiếp ở file khác vẫn được kiểm tra độc lập.
Given folder bị move, then test recompute ancestor ACL và không leak grant cũ.
ACL-03 — Cấp quyền theo phòng ban và cá nhân
User Story:
 
Là
 
HCNS/Quản lý kho
, tôi muốn
 
gán phòng ban và email cá nhân
 
để
 
phục vụ nhiều nhóm khác nhau
.
Mapping:
 
BR-14,33 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Allow cho phòng ban, then nhân viên active trong phòng ban được hưởng quyền.
Given Allow cá nhân ở ngoài phòng ban, then user đó được truy cập nếu không có Deny.
Given đổi phòng ban, then kết quả quyền đổi theo membership hiện hành.
ACL-04 — Deny luôn thắng Allow
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
tính đúng ưu tiên hiệu lực
 
để
 
không bị vượt chính sách chặn
.
Mapping:
 
BR-15 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Allow trên Folder và Deny cá nhân trên file, then VIEW file bị từ chối.
Given Deny trên Folder cha và Allow trên file con, then vẫn từ chối.
Given tất cả grant Deny hết hạn hoặc bị thu hồi, then tính lại grant đang hiệu lực; không cache quyền quá hạn.
ACL-05 — Grant có thời hạn
User Story:
 
Là
 
Admin/Quản lý kho
, tôi muốn
 
đặt valid_from/valid_until hoặc vĩnh viễn
 
để
 
quản trị quyền tạm thời
.
Mapping:
 
BR-16 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given grant bắt đầu tương lai, then trước valid_from API trả không đủ quyền.
Given current time qua valid_until, then quyền Allow tự hết hiệu lực không cần xóa file.
Given gia hạn, then lưu lịch sử và quyền có hiệu lực theo thời điểm mới.
ACL-06 — Hiển thị tài liệu chưa có quyền
User Story:
 
Là
 
Guest/Employee/Customer
, tôi muốn
 
thấy tên file nhưng không mở được
 
để
 
biết nội dung kho tồn tại
.
Mapping:
 
BR-09 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Private chưa có quyền, then có tên file trong listing, hiển thị dấu khóa.
When click, then trả thông báo không có quyền với lựa chọn gửi yêu cầu, API preview trả 403.
Then search không lộ text snippet hay dữ liệu nội dung chưa được cấp quyền.
ACL-07 — Chia sẻ URL và yêu cầu quyền
User Story:
 
Là
 
Người dùng
, tôi muốn
 
sao chép link và yêu cầu truy cập
 
để
 
chuyển tài liệu cho đồng nghiệp đúng quy trình
.
Mapping:
 
BR-25 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given user copy link, then URL chỉ tham chiếu tài liệu, không đính kèm grant bí mật.
Given người nhận thiếu VIEW, then tạo access request có requester/target/reason.
Given Admin phê duyệt, then cấp grant có thời hạn theo chính sách và gửi notification; Deny vẫn được tôn trọng.
ACL-08 — Xử lý quyền cho nhân viên khác phòng
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
cấp quyền từ kho mình cho bất kỳ employee
 
để
 
tăng phối hợp liên phòng ban
.
Mapping:
 
BR-32,33 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Department Manager quản lý repo Marketing, then cấp VIEW cho Employee phòng Sales được.
Given user đó chọn file repo Finance ngoài scope, then không thể cấp quyền.
When grant được thu hồi, then người nhận mất quyền khi không còn grant Allow khác.
E05 – Import Bacnhabook
BULK-01 — Nhập danh sách khách bằng Excel
User Story:
 
Là
 
Admin Bacnhabook
, tôi muốn
 
import Excel mẫu
 
để
 
tạo hàng trăm account nhanh
.
Mapping:
 
BR-24 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given file .xlsx hợp lệ, then hệ thống validate email từng dòng, hiển thị preview kết quả trước khi commit.
Given email trùng hoặc sai định dạng, then report trạng thái per-row và không tạo duplicate.
Given commit, then upload job trạng thái có số success/fail và cho tải báo cáo lỗi.
BULK-02 — Gán quyền hàng loạt
User Story:
 
Là
 
Admin Bacnhabook
, tôi muốn
 
cấp một hay nhiều Folder/file cho nhiều email
 
để
 
giảm thao tác thủ công
.
Mapping:
 
BR-24,07,16 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given danh sách email và grant config hợp lệ, then hệ thống tạo quyền per-user idempotent.
Given một user đã có grant tương đương, then không phát sinh grant trùng.
Given grant có hạn, then tất cả user nhận valid_until đúng theo batch.
BULK-03 — Gửi email khởi tạo hàng loạt
User Story:
 
Là
 
Admin Bacnhabook
, tôi muốn
 
gửi thông tin truy cập cho tài khoản mới
 
để
 
khách bắt đầu học
.
Mapping:
 
BR-05,24,26 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given batch tạo user mới, then email chứa mật khẩu random được xếp hàng gửi một lần cho mỗi tài khoản mới.
Given gửi lỗi, then hiển thị email delivery status và retry có kiểm soát, không log mật khẩu thô.
Given tài khoản tồn tại, then không gửi lại mật khẩu khởi tạo.
E06 – Xuất bản & phê duyệt
PUB-01 — Lưu nháp và xuất bản ngay
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
chọn Draft hoặc Published
 
để
 
tự quyết định công bố
.
Mapping:
 
BR-20 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given user có MANAGE, then có thể lưu Draft; người không quản trị không thấy nội dung Draft.
Given có quyền PUBLISH, then chọn Publish làm Published và áp dụng ACL Public/Private.
Given thiếu PUBLISH, then nút Publish bị ẩn và gọi API trực tiếp trả 403.
PUB-02 — Cấu hình người duyệt theo Folder
User Story:
 
Là
 
Super Admin/người được ủy quyền
, tôi muốn
 
chọn approver cho từng Folder
 
để
 
đưa tài liệu đúng người duyệt
.
Mapping:
 
BR-34 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Folder con không cấu hình approver, then kế thừa từ cha.
Given Folder con có override, then request gửi người duyệt tại Folder con.
Given người không có thẩm quyền sửa approval config, then 403 và ghi audit.
PUB-03 — Gửi duyệt, duyệt và từ chối
User Story:
 
Là
 
Người upload/Người duyệt
, tôi muốn
 
gửi và xử lý phê duyệt
 
để
 
xuất bản có kiểm soát
.
Mapping:
 
BR-20,34 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given tài liệu Draft, when Submit, then trạng thái PENDING_APPROVAL, tạo inbox notification cho approver theo Folder.
Given người duyệt hợp lệ Approve, then Published; Reject, then trạng thái REJECTED kèm lý do.
Given người ngoài danh sách duyệt gọi approve API, then 403; nhật ký có actor/time/decision.
PUB-04 — Thông báo quá trình phê duyệt
User Story:
 
Là
 
Admin/Người upload
, tôi muốn
 
được nhắc khi có tài liệu chờ duyệt/kết quả
 
để
 
không bỏ sót yêu cầu
.
Mapping:
 
BR-20,26,34 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given submit, then email/in-app gửi đúng approver, không lộ tài liệu nhạy cảm cho người ngoài.
Given approval/reject, then uploader nhận notification và xem được trạng thái/lý do.
Given email thất bại, then in-app vẫn thể hiện và outbox có trạng thái retry.
E07 – Tìm kiếm & metadata
META-01 — Tạo custom metadata schema
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
khai báo trường theo Repo/Folder
 
để
 
phân loại tài liệu đặc thù
.
Mapping:
 
BR-35 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given có quyền cấu hình, then tạo trường text/number/date/select/boolean có key duy nhất trong scope.
Given required=true, then save metadata thiếu trường trả lỗi có thể hiểu.
Given Folder con chưa override, then nhận schema định nghĩa ở Folder cha.
META-02 — Gắn và sửa metadata theo file
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
nhập các field động
 
để
 
tìm kiếm dễ hơn
.
Mapping:
 
BR-35 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given file thuộc Folder có schema, then form hiển thị đúng kiểu dữ liệu và validation.
Given save hợp lệ, then metadata có giá trị mới và audit.
Given user VIEW nhưng không MANAGE, then không sửa Metadata qua UI/API.
SEARCH-01 — Tìm theo tên, Folder, metadata và bộ lọc
User Story:
 
Là
 
Guest/Employee/Customer
, tôi muốn
 
tìm kiếm file nhanh
 
để
 
giảm thời gian tra cứu
.
Mapping:
 
BR-17 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given keyword, then trả document match tên/file/path và filter type/repository/date/department/metadata khi có.
Given user thiếu VIEW, then tên theo listing policy có thể hiện nhưng kết quả không có protected fields.
Given phân trang và sắp xếp, then kết quả ổn định không duplicate khi chuyển trang.
SEARCH-02 — Fulltext bên trong PDF/Office
User Story:
 
Là
 
Người dùng
, tôi muốn
 
tìm từ khóa xuất hiện trong file có text
 
để
 
tra cứu chính xác
.
Mapping:
 
BR-17 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given PDF/DOCX/XLSX/PPTX có text parse được, then index text sau file xử lý xong.
Given user có VIEW, then có thể tìm theo từ khóa trong text, preview snippet chỉ trong phạm vi quyền.
Given user không có VIEW, then không nhận đoạn trích của file đó; không yêu cầu ASR/OCR trong scope.
SEARCH-03 — Tái lập chỉ mục khi file thay đổi
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
refresh index khi update/delete/permission
 
để
 
không trả kết quả lỗi thời
.
Mapping:
 
BR-12,17,18 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given overwrite/new version, then text index thay thế current content sau conversion.
Given soft delete/expire policy, then search visibility phản ánh trạng thái tương ứng.
Given queue fail, then có retry và dashboard xử lý lỗi.
E08 – Vòng đời & xóa
LIFE-01 — Cấu hình hiệu lực tài liệu
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
đặt start/end effective dates
 
để
 
quản lý hiệu lực
.
Mapping:
 
BR-36 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given ngày future, then hiện trạng thái Scheduled trước ngày hiệu lực.
Given qua ngày hết hiệu lực, then hệ thống tự gắn Expired và cảnh báo khi người có quyền xem.
Given range ngày không hợp lệ, then API validation trả 400.
LIFE-02 — Liên kết tài liệu thay thế
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
chỉ định file mới thay thế file cũ
 
để
 
dẫn đến phiên bản chính xác
.
Mapping:
 
BR-36 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given tài liệu Expired, then viewer hiển thị banner và link replacement khi có.
Given replacement thuộc scope user không có VIEW, then click link tiếp tục qua ACL, không bypass.
Given replacement bị xóa, then không sinh dead link và dashboard cảnh báo broken reference.
TRASH-01 — Soft delete Folder và file
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
xóa nhầm vẫn cứu được
 
để
 
tránh mất dữ liệu
.
Mapping:
 
BR-18 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given xóa một Folder, then Folder và descendants chuyển trạng thái deleted, không xuất hiện trong danh mục thường.
Given user không MANAGE, then delete API trả 403.
Given delete thành công, then log người xóa/time, file R2 chưa xóa vật lý ngay.
TRASH-02 — Khôi phục từ thùng rác
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
restore một file hoặc Folder
 
để
 
khôi phục thao tác sai
.
Mapping:
 
BR-18 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given tài liệu còn trong retention, then Admin thuộc scope restore được.
Given path gốc không còn hoặc có xung đột tên, then yêu cầu giải quyết conflict, không overwrite âm thầm.
Given restore thành công, then metadata/ACL/version/history được giữ và preview/search tái lập nếu cần.
TRASH-03 — Retention cấu hình và dọn thùng rác
User Story:
 
Là
 
Super Admin
, tôi muốn
 
đặt thời gian lưu deleted objects
 
để
 
quản lý vòng đời lưu trữ
.
Mapping:
 
BR-18 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given retention đã cấu hình, then scheduler chỉ purge dữ liệu quá hạn và không thuộc legal hold.
Given purge, then audit có lượng object/counter và kết quả.
Given object backup độc lập còn trong retention backup, then không phá bản backup bởi purge trên primary.
E09 – Thông báo & yêu cầu
NOTI-01 — Trung tâm thông báo trên website
User Story:
 
Là
 
Tất cả user
, tôi muốn
 
xem thông báo, đánh dấu đã đọc
 
để
 
theo dõi yêu cầu và tài liệu
.
Mapping:
 
BR-26 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given sự kiện được gửi cho user, then notification xuất hiện theo tài khoản, hiển thị unread count.
When click, then điều hướng đến tài nguyên, API tài nguyên kiểm tra ACL lại.
Given tài khoản khác, then không được xem notification của user hiện tại.
NOTI-02 — Email sự kiện quan trọng
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
gửi email tạo account, grant/revoke, approval, expiry
 
để
 
nhắc người dùng đúng lúc
.
Mapping:
 
BR-26 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given event cần email, then email được đưa vào outbox và gửi async, có retry và trạng thái.
Given event chứa dữ liệu HCNS, then template không gửi nội dung nhạy cảm cho người không đủ quyền.
Given resend, then không tạo notification/email duplicate khi cùng idempotency key.
NOTI-03 — Inbox yêu cầu cấp quyền
User Story:
 
Là
 
Quản lý kho
, tôi muốn
 
duyệt/từ chối các yêu cầu xem tài liệu
 
để
 
vận hành nhanh
.
Mapping:
 
BR-25,26,33 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given access request tới tài liệu thuộc scope, then chỉ Admin có quyền GRANT tương ứng được thấy trong inbox.
Given Approve, then tạo grant hợp lệ và notification kết quả cho requester.
Given Reject, then lưu lý do và thông báo; không tạo grant.
E10 – Dashboard & Audit
AUD-01 — Audit Log mọi hành động quan trọng
User Story:
 
Là
 
Super Admin
, tôi muốn
 
tra cứu lịch sử thao tác
 
để
 
phục vụ kiểm soát và điều tra
.
Mapping:
 
BR-19,29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given upload/delete/permission/login/download/deny/backup, then tạo event có actor, time, target, outcome.
Given user không có quyền log scope, then API log trả 403/đã lọc không lộ dữ liệu kho khác.
Given event đã ghi, then Admin thông thường không có chức năng sửa/xóa nội dung Audit.
DASH-01 — Dashboard số liệu sử dụng
User Story:
 
Là
 
Super Admin/Quản lý kho
, tôi muốn
 
xem số lượng file, view/download, người dùng hoạt động
 
để
 
đánh giá sử dụng kho
.
Mapping:
 
BR-19 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given user là Admin Bacnhabook, then chỉ xem số liệu kho Bacnhabook.
Given date range, then chart/filter phản ánh đúng logs trong khoảng thời gian và định nghĩa chỉ số.
Given dữ liệu không có, then hiển thị 0/empty state không gây lỗi.
DASH-02 — R2 usage snapshots và cảnh báo ngưỡng
User Story:
 
Là
 
Super Admin
, tôi muốn
 
theo dõi dung lượng và cảnh báo
 
để
 
kiểm soát vận hành
.
Mapping:
 
BR-31 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given job đo dung lượng, then dashboard có tổng bytes và breakdown theo repository/định dạng theo dữ liệu hệ thống.
Given vượt threshold, then gửi cảnh báo email/in-app và không chặn upload.
Given cost chỉ là ước tính, then UI ghi rõ Estimated, không trình bày như số billed actual.
DASH-03 — Báo cáo xuất dữ liệu quản trị
User Story:
 
Là
 
Super Admin/Quản lý kho
, tôi muốn
 
xuất dữ liệu thống kê/Audit phù hợp scope
 
để
 
phục vụ đối soát
.
Mapping:
 
BR-19,31 |
 
Ưu tiên nội bộ:
 
P2 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given người đủ quyền, then có thể export chỉ số đã lọc theo date range.
Given export trong scope, then dữ liệu không chứa audit/record ngoài scope.
Given job lớn, then export async và có trạng thái hoàn tất.
E11 – Bảo mật & vận hành
SEC-01 — Kho file R2 Private và signed access
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
đảm bảo URL không lộ tài liệu Private
 
để
 
bảo vệ file gốc
.
Mapping:
 
BR-27,29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given user thiếu VIEW, then backend không tạo link preview/stream cho đối tượng đó.
Given URL xem/tải đã hết hạn, then không truy cập được, không có bucket public.
Given revoked permission, then request cấp token/link mới bị từ chối; TTL cũ được giảm thiểu trong cấu hình.
SEC-02 — Bảo vệ viewer trước download trái phép
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
tách original và preview
 
để
 
tôn trọng chính sách không tải
.
Mapping:
 
BR-08,29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given file không downloadable, then API download original trả 403 bất kể URL FE.
Given tài liệu dạng Office/PDF, then viewer dùng bản render bảo vệ quyền thay vì cung cấp original khi không download.
Given media streaming, then mỗi yêu cầu playlist/segment được bảo vệ tương ứng; không hứa ngăn recording hoàn toàn.
SEC-03 — Tự động kiểm tra file nguy hiểm
User Story:
 
Là
 
Hệ thống
, tôi muốn
 
quét và cách ly nội dung độc hại
 
để
 
tránh phát tán mã độc
.
Mapping:
 
BR-27,29 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given file định dạng bất kỳ vừa upload, then trạng thái pending_scan trước khi publish.
Given scan unsafe, then quarantine và chặn preview/download; log và thông báo quản trị.
Given scanner lỗi, then fail closed và retry, không tự publish file chưa xét.
OPS-01 — Backup độc lập DB và R2
User Story:
 
Là
 
DevOps/Super Admin
, tôi muốn
 
sao lưu đủ dữ liệu
 
để
 
phục hồi khi sự cố
.
Mapping:
 
BR-37 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given lịch backup đã cấu hình, then lưu DB snapshot và R2 object manifest/copy sang vùng độc lập.
Given job backup lỗi, then dashboard cảnh báo và có audit/run status.
Given primary bị xóa/thiếu object, then backup độc lập vẫn có thể truy xuất để phục hồi.
OPS-02 — Khôi phục file, Folder hoặc hệ thống
User Story:
 
Là
 
DevOps/Super Admin
, tôi muốn
 
restore file/Folder/DB nhất quán
 
để
 
giảm mất mát dữ liệu
.
Mapping:
 
BR-37 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given backup hợp lệ, then có runbook restore 1 file, 1 Folder, full DB+object.
Given restore test staging, then validate checksum/object count/ACL metadata matches.
Given restore production, then yêu cầu quyền cao và audit execution đầy đủ.
OPS-03 — Responsive đầy đủ PC/Mobile
User Story:
 
Là
 
Người dùng tất cả vai trò
, tôi muốn
 
thực hiện thao tác trên cả thiết bị
 
để
 
không phụ thuộc máy tính
.
Mapping:
 
BR-30 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given viewport desktop/tablet/mobile, then navigation, table, viewer, permission modal hoạt động.
Given mobile, then upload file từ thiết bị và phản hồi tiến độ được.
Given touch navigation, then không có button điều khiển quan trọng bị che/tràn.
OPS-04 — Kiểm thử tải và giám sát 500 đồng thời
User Story:
 
Là
 
DevOps/QA
, tôi muốn
 
xác nhận năng lực tải và cảnh báo
 
để
 
đảm bảo vận hành
.
Mapping:
 
BR-38 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given kịch bản 100–500 concurrent users, then chạy load test với hỗn hợp browse/search/stream/upload phân bổ đại diện.
Given lỗi R2/DB/conversion, then có metrics và alert phù hợp.
Given load test, then báo cáo throughput, p95, lỗi, tài nguyên và bottleneck rõ ràng.
E12 – UX & tích hợp tương lai
UX-01 — Giao diện theo từng vai trò
User Story:
 
Là
 
Guest/Customer/Employee/Admin
, tôi muốn
 
thấy điều hướng đúng nghiệp vụ
 
để
 
dễ sử dụng
.
Mapping:
 
BR-02,21,30 |
 
Ưu tiên nội bộ:
 
P0 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given Customer Bacnhabook, then landing ưu tiên học liệu, không hiện menu HCNS.
Given HCNS, then giao diện có quản lý nhân viên, Folder HCNS và yêu cầu được giao.
Given role chồng lấn, then chỉ hiện chức năng có quyền backend; không thể nâng quyền bằng sửa route.
UX-02 — Mô tả trạng thái Empty/Loading/Error
User Story:
 
Là
 
Người dùng
, tôi muốn
 
hiểu hệ thống đang xử lý
 
để
 
giảm nhầm lẫn
.
Mapping:
 
BR-22,23,30 |
 
Ưu tiên nội bộ:
 
P1 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given preview đang convert, then hiển thị processing và retry nếu lỗi.
Given upload folder chưa xong, then hiển thị tiến trình từng file.
Given 401/403/404, then hiển thị thông điệp phù hợp, không để trang trắng.
INT-01 — Chuẩn bị khả năng đồng bộ HRM
User Story:
 
Là
 
HCNS/Dev
, tôi muốn
 
lưu khóa liên kết để tích hợp HRM về sau
 
để
 
giảm chi phí nâng cấp
.
Mapping:
 
BR-13 |
 
Ưu tiên nội bộ:
 
P2 |
 
Phụ thuộc:
 
—
Acceptance Criteria (Given / When / Then):
Given employee hiện hữu, then schema hỗ trợ external HRM identifier nullable, không ảnh hưởng đăng nhập hiện tại.
Given release đầu chưa tích hợp HRM, then không chạy sync tự động và không có phụ thuộc bắt buộc vào API HRM.
Given account được liên kết HRM tương lai, then có design note về source-of-truth và cách conflict.
2. Cross-cutting Definition of Done cho mọi User Story
Chức năng hoạt động với role/scope đúng (test positive + negative); endpoint không rely vào ẩn UI.
Input được validate server-side; lỗi có mã và thông điệp đồng nhất; không leak dữ liệu người khác.
Hành động nhạy cảm ghi Audit với actor/entity/outcome/time/request_id.
FE responsive desktop/mobile, có loading/empty/error states và truy cập bàn phím cơ bản.
Có test unit service + integration API + E2E luồng chính; malware/permission là test release blocker.
Có migration, dữ liệu mẫu, API spec, feature flags nếu cần, retry/idempotency cho background jobs.
Đã code review, không secret hard-coded, không URL R2 bucket public; xử lý lỗi và backup runbook rõ.
QA/UAT xác nhận theo Gherkin; không dùng data nhạy cảm thật trong staging/test.
3. Dependency và cách nhận bàn giao từ AI coding agent
Lớp nền:
 
User/Role/Scope → Repository/Folder → R2 Upload → ACL engine → Viewer/Download.
Dữ liệu nội dung:
 
Version/Preview/Fulltext → Metadata → Search.
Vận hành:
 
Import Excel → Approval → Notification → Lifecycle/Trash → Audit/Dashboard/Storage Alerts → Backup/Restore.
Hardening:
 
Watermark, device session limits, MFA, malware scan, load/security tests.
Ship một release:
 
Chỉ được đưa vào production khi đầy đủ Epics và các test BR-01…BR-38 pass. Trình tự triển khai không đồng nghĩa cắt scope.
Artifact agent phải nộp cho mỗi story:
 
mã story; PR/commit; migration; endpoint list; FE screens; test output; log of security assumptions; known limitations; screenshot/video kiểm thử; checklist AC pass/fail.