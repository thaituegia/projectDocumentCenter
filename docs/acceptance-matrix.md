# Đối chiếu 63 story / 189 acceptance criteria

Giữ nguyên toàn bộ phạm vi một release. Bản phát triển hiện tại chưa đạt toàn bộ AC và chưa đủ điều kiện production/UAT. “PASS (dev)” chỉ xác nhận phần có assertion hoặc kiểm chứng cụ thể trong môi trường local; không đồng nghĩa một story/release hoàn tất.

Ký hiệu: **DEV CHECK PASS** = kiểm chứng local nêu trong evidence; **PARTIAL / CHƯA NGHIỆM THU** = có một phần code nhưng chưa đủ bằng chứng; **BLOCKED** = cần triển khai/dịch vụ/OD còn thiếu. Không gắn PASS cho integration chưa chạy.

## AUTH-01 — Admin Bacnhabook tạo khách hàng

BR: BR-03,04,05. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-01.1 | PARTIAL / CHƯA NGHIỆM THU | Given email hợp lệ chưa tồn tại, when Admin tạo khách, then hệ thống tạo user Customer, password ngẫu nhiên được hash, gửi email khởi tạo và đặt must_change_password=true. |
| AUTH-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given email đã tồn tại, when tạo lại, then không tạo user trùng/không gửi lại mật khẩu; Admin có đường dẫn cấp quyền bổ sung. |
| AUTH-01.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Admin Bacnhabook tạo khách, then không có khả năng gán vai trò HCNS hoặc Super Admin. |

## AUTH-02 — Đổi mật khẩu lần đăng nhập đầu

BR: BR-05,06. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-02.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Customer có must_change_password=true, when login đúng, then điều hướng cưỡng chế sang màn đổi mật khẩu và chặn các API Private khác. |
| AUTH-02.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | When đổi thành công then hash mới được lưu, mật khẩu cũ vô hiệu, must_change_password=false, tạo audit event. |
| AUTH-02.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given mật khẩu mới không đạt chính sách, then hiển thị lỗi và không xóa cờ bắt buộc. |

## AUTH-03 — Đăng nhập và khôi phục mật khẩu

BR: BR-05,06,29. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-03.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given email/mật khẩu đúng và account active, then tạo session an toàn và route theo vai trò. |
| AUTH-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given mật khẩu sai nhiều lần, then áp dụng rate limit/defense và ghi sự kiện; thông báo không lộ email có tồn tại. |
| AUTH-03.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given yêu cầu quên mật khẩu, then chỉ token khôi phục một lần dùng/hết hạn mới đổi được mật khẩu; token đã dùng bị vô hiệu. |

## AUTH-04 — HCNS quản lý tài khoản nhân viên

BR: BR-13,14,32. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-04.1 | PARTIAL / CHƯA NGHIỆM THU | Given HCNS tạo nhân viên, then email unique, gán đúng phòng ban và có trạng thái tài khoản rõ ràng. |
| AUTH-04.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Employee bị khóa, then session hiện có mất hiệu lực và các API Private trả từ chối. |
| AUTH-04.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given HCNS đổi phòng ban, then hệ thống tính lại ACL theo membership mà không giữ Allow phòng ban cũ vô điều kiện. |

## AUTH-05 — Super Admin gán vai trò và phạm vi

BR: BR-02,11,32. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-05.1 | PARTIAL / CHƯA NGHIỆM THU | Given Super Admin chỉ định Department Manager cho một Repository, then người đó chỉ quản lý scope được gán. |
| AUTH-05.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | When thu hồi role/scope, then quyền quản trị tương ứng mất hiệu lực ngay trong API. |
| AUTH-05.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given non-Super Admin gọi API gán Super Admin, then nhận 403 và ghi audit. |

## AUTH-06 — Giới hạn thiết bị, phiên và idle timeout

BR: BR-29. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-06.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given thiết lập tối đa phiên/thiết bị, when vượt hạn mức, then áp dụng chính sách từ chối/revoke được cấu hình và phản hồi dễ hiểu. |
| AUTH-06.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given phiên idle quá ngưỡng, then không còn quyền gọi API; người dùng cần login lại. |
| AUTH-06.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user đăng xuất thiết bị, then token/refresh token của phiên đó bị vô hiệu. |

## AUTH-07 — Xác thực hai lớp cho Admin

BR: BR-29. Evidence: `tests/api.test.js: tài khoản, mật khẩu, khóa và phiên`.

Giới hạn: MFA chưa triển khai; khóa admin login production.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUTH-07.1 | BLOCKED | Given Admin hợp lệ, when đăng nhập, then hệ thống yêu cầu bước MFA được cấu hình trước khi truy cập Admin. |
| AUTH-07.2 | BLOCKED | Given MFA sai/hết hạn, then không tạo admin session và ghi sự kiện. |
| AUTH-07.3 | BLOCKED | Given cần reset MFA, then chỉ Super Admin hoặc quy trình khôi phục đủ điều kiện được thực hiện và có audit. |

## FOLD-01 — Duyệt cây kho, Folder và file

BR: BR-07,09,11,21. Evidence: `tests/api.test.js: folder CRUD/scope/cycle/subtree; tests/browser/workflows.spec.js: tạo thư mục`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FOLD-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given người dùng mở Repository, then thấy breadcrumbs, Folder con, file trong Folder và bộ lọc. |
| FOLD-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given file Private không có VIEW, then tên file vẫn hiển thị theo BR-09 nhưng không trả preview nội dung hoặc metadata nhạy cảm. |
| FOLD-01.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Folder đã xóa, then biến mất khỏi danh sách thường và chỉ xuất hiện trong Recycle Bin đúng scope. |

## FOLD-02 — Tạo/sửa/xóa/di chuyển Folder

BR: BR-11,32. Evidence: `tests/api.test.js: folder CRUD/scope/cycle/subtree; tests/browser/workflows.spec.js: tạo thư mục`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FOLD-02.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given manager có MANAGE trên Folder cha, then có thể tạo Folder con. |
| FOLD-02.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given manager không quản lý repository, then gọi trực tiếp API sửa/move/xóa trả 403. |
| FOLD-02.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given move Folder, then hệ thống từ chối move vào chính nó hoặc descendants và ghi audit. |

## FOLD-03 — Thiết lập người quản lý kho

BR: BR-32,33. Evidence: `tests/api.test.js: folder CRUD/scope/cycle/subtree; tests/browser/workflows.spec.js: tạo thư mục`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FOLD-03.1 | PARTIAL / CHƯA NGHIỆM THU | Given Super Admin chỉ định manager của phòng ban, then manager được upload, quản lý file và grant tài liệu scope đó. |
| FOLD-03.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given manager A truy cập Repository B không được giao, then không đọc/ghi/approve bằng API. |
| FOLD-03.3 | PARTIAL / CHƯA NGHIỆM THU | When thu hồi scope, then editor và grant editor bị vô hiệu ngay. |

## FOLD-04 — Upload nguyên Folder giữ cấu trúc

BR: BR-23,27. Evidence: `tests/api.test.js: folder CRUD/scope/cycle/subtree; tests/browser/workflows.spec.js: tạo thư mục`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FOLD-04.1 | PARTIAL / CHƯA NGHIỆM THU | Given cây Folder nhiều cấp, when upload, then tạo đúng hierarchy và giữ relative path từng file. |
| FOLD-04.2 | PARTIAL / CHƯA NGHIỆM THU | Given một file thất bại, then job thể hiện success/fail per-file và hỗ trợ retry file lỗi không duplicate file đã thành công. |
| FOLD-04.3 | PARTIAL / CHƯA NGHIỆM THU | Given tệp có định dạng bất kỳ, then nhận upload qua pipeline an toàn, không tự giải nén ZIP thành Folder. |

## FOLD-05 — Kế thừa cấu hình Folder

BR: BR-07,08,34,35. Evidence: `tests/api.test.js: folder CRUD/scope/cycle/subtree; tests/browser/workflows.spec.js: tạo thư mục`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FOLD-05.1 | PARTIAL / CHƯA NGHIỆM THU | Given Folder con không override, then nhận giá trị config được kế thừa từ parent. |
| FOLD-05.2 | PARTIAL / CHƯA NGHIỆM THU | Given Folder con override người duyệt hoặc metadata policy, then chỉ áp dụng override tại subtree tương ứng. |
| FOLD-05.3 | PARTIAL / CHƯA NGHIỆM THU | When parent đổi cấu hình, then cây con không override được tính lại đúng và có audit. |

## FILE-01 — Upload file lên R2 Private

BR: BR-10,27. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

Giới hạn: Upload hiện qua server; chưa presigned multipart/checksum R2 thực.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-01.1 | BLOCKED | Given tài khoản có MANAGE, when bắt đầu upload, then backend tạo upload job và signed upload chỉ đúng object key, TTL ngắn. |
| FILE-01.2 | BLOCKED | Given upload hoàn tất, then backend xác minh object tồn tại/size/checksum được cấu hình trước khi publish metadata. |
| FILE-01.3 | BLOCKED | Given object chưa scan hoặc thất bại kiểm tra, then file không có URL xem/tải cho end-user. |

## FILE-02 — Đặt metadata cơ bản và download policy

BR: BR-08,09,10. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-02.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given có quyền quản lý, when sửa metadata, then thông tin lưu và có audit. |
| FILE-02.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given is_downloadable=false, then user VIEW không lấy được original qua download API. |
| FILE-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given chuyển Public→Private, then URL truy cập cũ không còn cấp nội dung ngoài hạn TTL đã phát hành; mọi request mới cần ACL. |

## FILE-03 — Preview popup tài liệu

BR: BR-22. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-03.1 | PARTIAL / CHƯA NGHIỆM THU | Given file có preview ready, when bấm xem nhanh, then modal hiển thị nội dung và controls đúng định dạng. |
| FILE-03.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given thiếu VIEW, then modal thông báo không có quyền, không fetch preview bytes. |
| FILE-03.3 | PARTIAL / CHƯA NGHIỆM THU | Given preview chưa xử lý hoặc định dạng không hỗ trợ, then hiển thị trạng thái/fallback mà không lỗi giao diện. |

## FILE-04 — Trang Viewer riêng, responsive

BR: BR-22,30. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

Giới hạn: Viewer text đã có; PDF fidelity, Office/image/media players chưa hoàn tất.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-04.1 | BLOCKED | Given PDF/PPT/ảnh, then viewer zoom/đổi trang/toàn màn hình theo khả năng định dạng. |
| FILE-04.2 | BLOCKED | Given audio/video, then có play/pause/seek/tốc độ/toàn màn hình khi phù hợp. |
| FILE-04.3 | BLOCKED | Given viewport mobile, then controls không bị tràn và touch input hoạt động. |

## FILE-05 — Tải original đúng quyền

BR: BR-08,29. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-05.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given downloadable=true và effective ACL DOWNLOAD Allow, then endpoint cấp file original/URL TTL ngắn. |
| FILE-05.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given downloadable=false hoặc Deny DOWNLOAD, then endpoint 403 kể cả gọi thủ công. |
| FILE-05.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Admin quản lý file, then có action lấy original để sửa offline theo quyền MANAGE riêng. |

## FILE-06 — Watermark động trên bản xem

BR: BR-29. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-06.1 | PARTIAL / CHƯA NGHIỆM THU | Given viewer mở file có watermark policy, then email định danh/giá trị cho phép hiển thị trên lớp xem. |
| FILE-06.2 | PARTIAL / CHƯA NGHIỆM THU | Given user chưa có VIEW, then không cấp nội dung dù có watermark. |
| FILE-06.3 | PARTIAL / CHƯA NGHIỆM THU | Given chuyển trang/seek/fullscreen, then watermark vẫn xuất hiện theo cấu hình; không tuyên bố chống chụp màn hình tuyệt đối. |

## FILE-07 — Ghi đè tài liệu

BR: BR-12,28. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-07.1 | PARTIAL / CHƯA NGHIỆM THU | Given lựa chọn overwrite, then current file object ref cập nhật sau khi scan thành công, không thêm version UI mới. |
| FILE-07.2 | PARTIAL / CHƯA NGHIỆM THU | Given update không thành công, then current file cũ vẫn hoạt động. |
| FILE-07.3 | PARTIAL / CHƯA NGHIỆM THU | When overwrite thành công, then preview/index được regenerate và audit chứa actor/time. |

## FILE-08 — Tạo và khôi phục phiên bản

BR: BR-12. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-08.1 | PARTIAL / CHƯA NGHIỆM THU | Given chọn new version, then phiên bản cũ được giữ, version_number tăng tuần tự. |
| FILE-08.2 | PARTIAL / CHƯA NGHIỆM THU | Given chọn restore version cũ, then current content đúng version được chọn, quyền và metadata được bảo toàn theo policy. |
| FILE-08.3 | PARTIAL / CHƯA NGHIỆM THU | Given user thiếu quyền MANAGE, then không xem object original của version hoặc restore. |

## FILE-09 — Pipeline scan/convert/index

BR: BR-17,22,27. Evidence: `tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload`.

Giới hạn: Worker có fail-closed; scanner/LibreOffice thật chưa cấu hình/kiểm chứng.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| FILE-09.1 | BLOCKED | Given upload mới, then tạo processing job có trạng thái queued/processing/ready/failed và retry. |
| FILE-09.2 | BLOCKED | Given PDF/Office chứa văn bản đọc được, then text được trích xuất và lập chỉ mục đúng document ID. |
| FILE-09.3 | BLOCKED | Given file nguy hiểm/không hợp lệ, then đánh dấu quarantined và không phân phối qua preview/download. |

## ACL-01 — Cấp quyền trực tiếp theo user/file

BR: BR-03,07,08,33. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-01.1 | PARTIAL / CHƯA NGHIỆM THU | Given Admin có quyền GRANT trong scope, then có thể tạo Allow trên file cho employee/customer phù hợp. |
| ACL-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Admin chọn file thuộc kho khác, then API trả 403. |
| ACL-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given grant mới, then audit lưu subject, target, action, effect và người cấp. |

## ACL-02 — Cấp quyền theo Folder và kế thừa

BR: BR-07,11. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given Allow VIEW trên Folder, then user được VIEW các file hiện có và file mới ở mọi cấp con. |
| ACL-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given thu hồi quyền Folder, then các quyền kế thừa mất hiệu lực; grant trực tiếp ở file khác vẫn được kiểm tra độc lập. |
| ACL-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given folder bị move, then test recompute ancestor ACL và không leak grant cũ. |

## ACL-03 — Cấp quyền theo phòng ban và cá nhân

BR: BR-14,33. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-03.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Allow cho phòng ban, then nhân viên active trong phòng ban được hưởng quyền. |
| ACL-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given Allow cá nhân ở ngoài phòng ban, then user đó được truy cập nếu không có Deny. |
| ACL-03.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given đổi phòng ban, then kết quả quyền đổi theo membership hiện hành. |

## ACL-04 — Deny luôn thắng Allow

BR: BR-15. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-04.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Allow trên Folder và Deny cá nhân trên file, then VIEW file bị từ chối. |
| ACL-04.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Deny trên Folder cha và Allow trên file con, then vẫn từ chối. |
| ACL-04.3 | PARTIAL / CHƯA NGHIỆM THU | Given tất cả grant Deny hết hạn hoặc bị thu hồi, then tính lại grant đang hiệu lực; không cache quyền quá hạn. |

## ACL-05 — Grant có thời hạn

BR: BR-16. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-05.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given grant bắt đầu tương lai, then trước valid_from API trả không đủ quyền. |
| ACL-05.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given current time qua valid_until, then quyền Allow tự hết hiệu lực không cần xóa file. |
| ACL-05.3 | PARTIAL / CHƯA NGHIỆM THU | Given gia hạn, then lưu lịch sử và quyền có hiệu lực theo thời điểm mới. |

## ACL-06 — Hiển thị tài liệu chưa có quyền

BR: BR-09. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-06.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Private chưa có quyền, then có tên file trong listing, hiển thị dấu khóa. |
| ACL-06.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | When click, then trả thông báo không có quyền với lựa chọn gửi yêu cầu, API preview trả 403. |
| ACL-06.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Then search không lộ text snippet hay dữ liệu nội dung chưa được cấp quyền. |

## ACL-07 — Chia sẻ URL và yêu cầu quyền

BR: BR-25. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-07.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user copy link, then URL chỉ tham chiếu tài liệu, không đính kèm grant bí mật. |
| ACL-07.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given người nhận thiếu VIEW, then tạo access request có requester/target/reason. |
| ACL-07.3 | PARTIAL / CHƯA NGHIỆM THU | Given Admin phê duyệt, then cấp grant có thời hạn theo chính sách và gửi notification; Deny vẫn được tôn trọng. |

## ACL-08 — Xử lý quyền cho nhân viên khác phòng

BR: BR-32,33. Evidence: `tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| ACL-08.1 | PARTIAL / CHƯA NGHIỆM THU | Given Department Manager quản lý repo Marketing, then cấp VIEW cho Employee phòng Sales được. |
| ACL-08.2 | PARTIAL / CHƯA NGHIỆM THU | Given user đó chọn file repo Finance ngoài scope, then không thể cấp quyền. |
| ACL-08.3 | PARTIAL / CHƯA NGHIỆM THU | When grant được thu hồi, then người nhận mất quyền khi không còn grant Allow khác. |

## BULK-01 — Nhập danh sách khách bằng Excel

BR: BR-24. Evidence: `tests/api.test.js: Excel preview, idempotency, encrypted outbox`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| BULK-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given file .xlsx hợp lệ, then hệ thống validate email từng dòng, hiển thị preview kết quả trước khi commit. |
| BULK-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given email trùng hoặc sai định dạng, then report trạng thái per-row và không tạo duplicate. |
| BULK-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given commit, then upload job trạng thái có số success/fail và cho tải báo cáo lỗi. |

## BULK-02 — Gán quyền hàng loạt

BR: BR-24,07,16. Evidence: `tests/api.test.js: Excel preview, idempotency, encrypted outbox`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| BULK-02.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given danh sách email và grant config hợp lệ, then hệ thống tạo quyền per-user idempotent. |
| BULK-02.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given một user đã có grant tương đương, then không phát sinh grant trùng. |
| BULK-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given grant có hạn, then tất cả user nhận valid_until đúng theo batch. |

## BULK-03 — Gửi email khởi tạo hàng loạt

BR: BR-05,24,26. Evidence: `tests/api.test.js: Excel preview, idempotency, encrypted outbox`.

Giới hạn: User cấu hình email sau; chưa gửi email thật.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| BULK-03.1 | BLOCKED | Given batch tạo user mới, then email chứa mật khẩu random được xếp hàng gửi một lần cho mỗi tài khoản mới. |
| BULK-03.2 | BLOCKED | Given gửi lỗi, then hiển thị email delivery status và retry có kiểm soát, không log mật khẩu thô. |
| BULK-03.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given tài khoản tồn tại, then không gửi lại mật khẩu khởi tạo. |

## PUB-01 — Lưu nháp và xuất bản ngay

BR: BR-20. Evidence: `tests/api.test.js: publication safety, reviewer membership, self-approval/reject reason`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| PUB-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user có MANAGE, then có thể lưu Draft; người không quản trị không thấy nội dung Draft. |
| PUB-01.2 | PARTIAL / CHƯA NGHIỆM THU | Given có quyền PUBLISH, then chọn Publish làm Published và áp dụng ACL Public/Private. |
| PUB-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given thiếu PUBLISH, then nút Publish bị ẩn và gọi API trực tiếp trả 403. |

## PUB-02 — Cấu hình người duyệt theo Folder

BR: BR-34. Evidence: `tests/api.test.js: publication safety, reviewer membership, self-approval/reject reason`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| PUB-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given Folder con không cấu hình approver, then kế thừa từ cha. |
| PUB-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given Folder con có override, then request gửi người duyệt tại Folder con. |
| PUB-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given người không có thẩm quyền sửa approval config, then 403 và ghi audit. |

## PUB-03 — Gửi duyệt, duyệt và từ chối

BR: BR-20,34. Evidence: `tests/api.test.js: publication safety, reviewer membership, self-approval/reject reason`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| PUB-03.1 | PARTIAL / CHƯA NGHIỆM THU | Given tài liệu Draft, when Submit, then trạng thái PENDING_APPROVAL, tạo inbox notification cho approver theo Folder. |
| PUB-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given người duyệt hợp lệ Approve, then Published; Reject, then trạng thái REJECTED kèm lý do. |
| PUB-03.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given người ngoài danh sách duyệt gọi approve API, then 403; nhật ký có actor/time/decision. |

## PUB-04 — Thông báo quá trình phê duyệt

BR: BR-20,26,34. Evidence: `tests/api.test.js: publication safety, reviewer membership, self-approval/reject reason`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| PUB-04.1 | PARTIAL / CHƯA NGHIỆM THU | Given submit, then email/in-app gửi đúng approver, không lộ tài liệu nhạy cảm cho người ngoài. |
| PUB-04.2 | PARTIAL / CHƯA NGHIỆM THU | Given approval/reject, then uploader nhận notification và xem được trạng thái/lý do. |
| PUB-04.3 | PARTIAL / CHƯA NGHIỆM THU | Given email thất bại, then in-app vẫn thể hiện và outbox có trạng thái retry. |

## META-01 — Tạo custom metadata schema

BR: BR-35. Evidence: `server/authz.js + server/index.js: schema inheritance và type validation; browser edit test`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| META-01.1 | PARTIAL / CHƯA NGHIỆM THU | Given có quyền cấu hình, then tạo trường text/number/date/select/boolean có key duy nhất trong scope. |
| META-01.2 | PARTIAL / CHƯA NGHIỆM THU | Given required=true, then save metadata thiếu trường trả lỗi có thể hiểu. |
| META-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given Folder con chưa override, then nhận schema định nghĩa ở Folder cha. |

## META-02 — Gắn và sửa metadata theo file

BR: BR-35. Evidence: `server/authz.js + server/index.js: schema inheritance và type validation; browser edit test`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| META-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given file thuộc Folder có schema, then form hiển thị đúng kiểu dữ liệu và validation. |
| META-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given save hợp lệ, then metadata có giá trị mới và audit. |
| META-02.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user VIEW nhưng không MANAGE, then không sửa Metadata qua UI/API. |

## SEARCH-01 — Tìm theo tên, Folder, metadata và bộ lọc

BR: BR-17. Evidence: `tests/api.test.js: private fulltext không rò rỉ; browser search/filter`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| SEARCH-01.1 | PARTIAL / CHƯA NGHIỆM THU | Given keyword, then trả document match tên/file/path và filter type/repository/date/department/metadata khi có. |
| SEARCH-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user thiếu VIEW, then tên theo listing policy có thể hiện nhưng kết quả không có protected fields. |
| SEARCH-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given phân trang và sắp xếp, then kết quả ổn định không duplicate khi chuyển trang. |

## SEARCH-02 — Fulltext bên trong PDF/Office

BR: BR-17. Evidence: `tests/api.test.js: private fulltext không rò rỉ; browser search/filter`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| SEARCH-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given PDF/DOCX/XLSX/PPTX có text parse được, then index text sau file xử lý xong. |
| SEARCH-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given user có VIEW, then có thể tìm theo từ khóa trong text, preview snippet chỉ trong phạm vi quyền. |
| SEARCH-02.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user không có VIEW, then không nhận đoạn trích của file đó; không yêu cầu ASR/OCR trong scope. |

## SEARCH-03 — Tái lập chỉ mục khi file thay đổi

BR: BR-12,17,18. Evidence: `tests/api.test.js: private fulltext không rò rỉ; browser search/filter`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| SEARCH-03.1 | PARTIAL / CHƯA NGHIỆM THU | Given overwrite/new version, then text index thay thế current content sau conversion. |
| SEARCH-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given soft delete/expire policy, then search visibility phản ánh trạng thái tương ứng. |
| SEARCH-03.3 | PARTIAL / CHƯA NGHIỆM THU | Given queue fail, then có retry và dashboard xử lý lỗi. |

## LIFE-01 — Cấu hình hiệu lực tài liệu

BR: BR-36. Evidence: `tests/api.test.js: computed lifecycle và date range validation`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| LIFE-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given ngày future, then hiện trạng thái Scheduled trước ngày hiệu lực. |
| LIFE-01.2 | PARTIAL / CHƯA NGHIỆM THU | Given qua ngày hết hiệu lực, then hệ thống tự gắn Expired và cảnh báo khi người có quyền xem. |
| LIFE-01.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given range ngày không hợp lệ, then API validation trả 400. |

## LIFE-02 — Liên kết tài liệu thay thế

BR: BR-36. Evidence: `tests/api.test.js: computed lifecycle và date range validation`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| LIFE-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given tài liệu Expired, then viewer hiển thị banner và link replacement khi có. |
| LIFE-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given replacement thuộc scope user không có VIEW, then click link tiếp tục qua ACL, không bypass. |
| LIFE-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given replacement bị xóa, then không sinh dead link và dashboard cảnh báo broken reference. |

## TRASH-01 — Soft delete Folder và file

BR: BR-18. Evidence: `tests/api.test.js: subtree soft delete/restore/version preservation`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| TRASH-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given xóa một Folder, then Folder và descendants chuyển trạng thái deleted, không xuất hiện trong danh mục thường. |
| TRASH-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user không MANAGE, then delete API trả 403. |
| TRASH-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given delete thành công, then log người xóa/time, file R2 chưa xóa vật lý ngay. |

## TRASH-02 — Khôi phục từ thùng rác

BR: BR-18. Evidence: `tests/api.test.js: subtree soft delete/restore/version preservation`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| TRASH-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given tài liệu còn trong retention, then Admin thuộc scope restore được. |
| TRASH-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given path gốc không còn hoặc có xung đột tên, then yêu cầu giải quyết conflict, không overwrite âm thầm. |
| TRASH-02.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given restore thành công, then metadata/ACL/version/history được giữ và preview/search tái lập nếu cần. |

## TRASH-03 — Retention cấu hình và dọn thùng rác

BR: BR-18. Evidence: `tests/api.test.js: subtree soft delete/restore/version preservation`.

Giới hạn: Chưa bật scheduler purge; OD retention/legal hold chưa chốt.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| TRASH-03.1 | BLOCKED | Given retention đã cấu hình, then scheduler chỉ purge dữ liệu quá hạn và không thuộc legal hold. |
| TRASH-03.2 | BLOCKED | Given purge, then audit có lượng object/counter và kết quả. |
| TRASH-03.3 | BLOCKED | Given object backup độc lập còn trong retention backup, then không phá bản backup bởi purge trên primary. |

## NOTI-01 — Trung tâm thông báo trên website

BR: BR-26. Evidence: `tests/api.test.js: own notifications; browser navigation`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| NOTI-01.1 | PARTIAL / CHƯA NGHIỆM THU | Given sự kiện được gửi cho user, then notification xuất hiện theo tài khoản, hiển thị unread count. |
| NOTI-01.2 | PARTIAL / CHƯA NGHIỆM THU | When click, then điều hướng đến tài nguyên, API tài nguyên kiểm tra ACL lại. |
| NOTI-01.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given tài khoản khác, then không được xem notification của user hiện tại. |

## NOTI-02 — Email sự kiện quan trọng

BR: BR-26. Evidence: `tests/api.test.js: own notifications; browser navigation`.

Giới hạn: Outbox email tài khoản có encryption/retry; email mọi sự kiện chưa nối đầy đủ.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| NOTI-02.1 | BLOCKED | Given event cần email, then email được đưa vào outbox và gửi async, có retry và trạng thái. |
| NOTI-02.2 | BLOCKED | Given event chứa dữ liệu HCNS, then template không gửi nội dung nhạy cảm cho người không đủ quyền. |
| NOTI-02.3 | BLOCKED | Given resend, then không tạo notification/email duplicate khi cùng idempotency key. |

## NOTI-03 — Inbox yêu cầu cấp quyền

BR: BR-25,26,33. Evidence: `tests/api.test.js: own notifications; browser navigation`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| NOTI-03.1 | PARTIAL / CHƯA NGHIỆM THU | Given access request tới tài liệu thuộc scope, then chỉ Admin có quyền GRANT tương ứng được thấy trong inbox. |
| NOTI-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given Approve, then tạo grant hợp lệ và notification kết quả cho requester. |
| NOTI-03.3 | PARTIAL / CHƯA NGHIỆM THU | Given Reject, then lưu lý do và thông báo; không tạo grant. |

## AUD-01 — Audit Log mọi hành động quan trọng

BR: BR-19,29. Evidence: `tests/api.test.js: scoped audit; browser audit page`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| AUD-01.1 | PARTIAL / CHƯA NGHIỆM THU | Given upload/delete/permission/login/download/deny/backup, then tạo event có actor, time, target, outcome. |
| AUD-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user không có quyền log scope, then API log trả 403/đã lọc không lộ dữ liệu kho khác. |
| AUD-01.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given event đã ghi, then Admin thông thường không có chức năng sửa/xóa nội dung Audit. |

## DASH-01 — Dashboard số liệu sử dụng

BR: BR-19. Evidence: `tests/api.test.js: dashboard scope; browser dashboard data`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| DASH-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user là Admin Bacnhabook, then chỉ xem số liệu kho Bacnhabook. |
| DASH-01.2 | PARTIAL / CHƯA NGHIỆM THU | Given date range, then chart/filter phản ánh đúng logs trong khoảng thời gian và định nghĩa chỉ số. |
| DASH-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given dữ liệu không có, then hiển thị 0/empty state không gây lỗi. |

## DASH-02 — R2 usage snapshots và cảnh báo ngưỡng

BR: BR-31. Evidence: `tests/api.test.js: dashboard scope; browser dashboard data`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| DASH-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given job đo dung lượng, then dashboard có tổng bytes và breakdown theo repository/định dạng theo dữ liệu hệ thống. |
| DASH-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given vượt threshold, then gửi cảnh báo email/in-app và không chặn upload. |
| DASH-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given cost chỉ là ước tính, then UI ghi rõ Estimated, không trình bày như số billed actual. |

## DASH-03 — Báo cáo xuất dữ liệu quản trị

BR: BR-19,31. Evidence: `tests/api.test.js: dashboard scope; browser dashboard data`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| DASH-03.1 | PARTIAL / CHƯA NGHIỆM THU | Given người đủ quyền, then có thể export chỉ số đã lọc theo date range. |
| DASH-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given export trong scope, then dữ liệu không chứa audit/record ngoài scope. |
| DASH-03.3 | PARTIAL / CHƯA NGHIỆM THU | Given job lớn, then export async và có trạng thái hoàn tất. |

## SEC-01 — Kho file R2 Private và signed access

BR: BR-27,29. Evidence: `tests/api.test.js: direct HTTP negative tests, fail-closed scanner`.

Giới hạn: R2 adapter chưa kiểm chứng kết nối thật; chưa presigned TTL.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| SEC-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given user thiếu VIEW, then backend không tạo link preview/stream cho đối tượng đó. |
| SEC-01.2 | BLOCKED | Given URL xem/tải đã hết hạn, then không truy cập được, không có bucket public. |
| SEC-01.3 | BLOCKED | Given revoked permission, then request cấp token/link mới bị từ chối; TTL cũ được giảm thiểu trong cấu hình. |

## SEC-02 — Bảo vệ viewer trước download trái phép

BR: BR-08,29. Evidence: `tests/api.test.js: direct HTTP negative tests, fail-closed scanner`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| SEC-02.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given file không downloadable, then API download original trả 403 bất kể URL FE. |
| SEC-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given tài liệu dạng Office/PDF, then viewer dùng bản render bảo vệ quyền thay vì cung cấp original khi không download. |
| SEC-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given media streaming, then mỗi yêu cầu playlist/segment được bảo vệ tương ứng; không hứa ngăn recording hoàn toàn. |

## SEC-03 — Tự động kiểm tra file nguy hiểm

BR: BR-27,29. Evidence: `tests/api.test.js: direct HTTP negative tests, fail-closed scanner`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| SEC-03.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given file định dạng bất kỳ vừa upload, then trạng thái pending_scan trước khi publish. |
| SEC-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given scan unsafe, then quarantine và chặn preview/download; log và thông báo quản trị. |
| SEC-03.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given scanner lỗi, then fail closed và retry, không tự publish file chưa xét. |

## OPS-01 — Backup độc lập DB và R2

BR: BR-37. Evidence: `tests/api.test.js: backup checksum/integrity/count/ACL restore; browser mobile`.

Giới hạn: Chưa có nơi sao lưu off-site/lịch được duyệt; chỉ có rehearsal local.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| OPS-01.1 | BLOCKED | Given lịch backup đã cấu hình, then lưu DB snapshot và R2 object manifest/copy sang vùng độc lập. |
| OPS-01.2 | BLOCKED | Given job backup lỗi, then dashboard cảnh báo và có audit/run status. |
| OPS-01.3 | BLOCKED | Given primary bị xóa/thiếu object, then backup độc lập vẫn có thể truy xuất để phục hồi. |

## OPS-02 — Khôi phục file, Folder hoặc hệ thống

BR: BR-37. Evidence: `tests/api.test.js: backup checksum/integrity/count/ACL restore; browser mobile`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| OPS-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given backup hợp lệ, then có runbook restore 1 file, 1 Folder, full DB+object. |
| OPS-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given restore test staging, then validate checksum/object count/ACL metadata matches. |
| OPS-02.3 | PARTIAL / CHƯA NGHIỆM THU | Given restore production, then yêu cầu quyền cao và audit execution đầy đủ. |

## OPS-03 — Responsive đầy đủ PC/Mobile

BR: BR-30. Evidence: `tests/api.test.js: backup checksum/integrity/count/ACL restore; browser mobile`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| OPS-03.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given viewport desktop/tablet/mobile, then navigation, table, viewer, permission modal hoạt động. |
| OPS-03.2 | PARTIAL / CHƯA NGHIỆM THU | Given mobile, then upload file từ thiết bị và phản hồi tiến độ được. |
| OPS-03.3 | PARTIAL / CHƯA NGHIỆM THU | Given touch navigation, then không có button điều khiển quan trọng bị che/tràn. |

## OPS-04 — Kiểm thử tải và giám sát 500 đồng thời

BR: BR-38. Evidence: `tests/api.test.js: backup checksum/integrity/count/ACL restore; browser mobile`.

Giới hạn: Chưa chạy tải 100–500, chưa metrics/alert production.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| OPS-04.1 | BLOCKED | Given kịch bản 100–500 concurrent users, then chạy load test với hỗn hợp browse/search/stream/upload phân bổ đại diện. |
| OPS-04.2 | BLOCKED | Given lỗi R2/DB/conversion, then có metrics và alert phù hợp. |
| OPS-04.3 | BLOCKED | Given load test, then báo cáo throughput, p95, lỗi, tài nguyên và bottleneck rõ ràng. |

## UX-01 — Giao diện theo từng vai trò

BR: BR-02,21,30. Evidence: `tests/browser/workflows.spec.js: role navigation, mobile, error/empty states`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| UX-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given Customer Bacnhabook, then landing ưu tiên học liệu, không hiện menu HCNS. |
| UX-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given HCNS, then giao diện có quản lý nhân viên, Folder HCNS và yêu cầu được giao. |
| UX-01.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given role chồng lấn, then chỉ hiện chức năng có quyền backend; không thể nâng quyền bằng sửa route. |

## UX-02 — Mô tả trạng thái Empty/Loading/Error

BR: BR-22,23,30. Evidence: `tests/browser/workflows.spec.js: role navigation, mobile, error/empty states`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| UX-02.1 | PARTIAL / CHƯA NGHIỆM THU | Given preview đang convert, then hiển thị processing và retry nếu lỗi. |
| UX-02.2 | PARTIAL / CHƯA NGHIỆM THU | Given upload folder chưa xong, then hiển thị tiến trình từng file. |
| UX-02.3 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given 401/403/404, then hiển thị thông điệp phù hợp, không để trang trắng. |

## INT-01 — Chuẩn bị khả năng đồng bộ HRM

BR: BR-13. Evidence: `server/migrations/001_initial.sql: nullable external_hrm_id; không có automatic sync`.

| AC | Trạng thái | Tiêu chí gốc |
|---|---|---|
| INT-01.1 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given employee hiện hữu, then schema hỗ trợ external HRM identifier nullable, không ảnh hưởng đăng nhập hiện tại. |
| INT-01.2 | DEV CHECK PASS / AC CHƯA NGHIỆM THU | Given release đầu chưa tích hợp HRM, then không chạy sync tự động và không có phụ thuộc bắt buộc vào API HRM. |
| INT-01.3 | PARTIAL / CHƯA NGHIỆM THU | Given account được liên kết HRM tương lai, then có design note về source-of-truth và cách conflict. |
