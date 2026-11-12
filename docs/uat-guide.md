# Bộ dữ liệu dùng thử Bác Nhã Books / ThanhmaiHSK

Đây là bộ dữ liệu giả lập để các bên thử chức năng và gửi phản hồi. Không phải học liệu thương mại, hồ sơ nhân sự thật hoặc quy định đã ban hành. Tất cả PDF đều có dòng “DỮ LIỆU MẪU UAT”. Không nhập thông tin cá nhân hoặc hồ sơ công ty thật trong bản demo.

## Chuẩn bị

1. Chờ Render deploy bản có dữ liệu mẫu. Website quản trị/nội bộ: https://bacnhabook-demo.onrender.com/. Website học viên: dùng URL Render của service `bacnhabook-hoc-lieu` do chủ dự án cung cấp.
2. Chủ dự án giao tài khoản đúng vai trò từ bảng thông tin đăng nhập đã nhận riêng. Gói dữ liệu này không chứa mật khẩu. Nếu đang ở phiên đăng nhập mẫu, đăng xuất trước khi dùng email/mật khẩu được giao.
3. Đổi mật khẩu ở lần đăng nhập đầu. Dùng profile trình duyệt hoặc cửa sổ riêng cho mỗi người thử. Không dùng đồng thời cùng một tài khoản để tránh xung đột phiên, mật khẩu hoặc thao tác phê duyệt.
4. Tìm thư mục có chữ “dùng thử” hoặc “giả lập”. Dữ liệu gốc nhỏ của dự án vẫn được giữ lại.

## Dữ liệu được chuẩn bị

| Nhóm | Số PDF | Tình huống chính |
|---|---:|---|
| Học liệu HSK 1–4, văn hóa | 30 | Công khai, Private, chỉ xem, tải được, Deny, gửi yêu cầu quyền |
| Tài liệu chung công ty | 10 | Hội nhập, quy trình, bản nháp, duyệt, phục hồi |
| HCNS | 10 | Hồ sơ hoàn toàn hư cấu, chính sách, hiệu lực, phân quyền |
| Marketing | 10 | Chiến dịch, biểu mẫu, phiên bản, phạm vi phòng ban |

Tổng cộng 60 PDF trong 12 thư mục con. Có 6 tài liệu chờ duyệt, 6 bản nháp, 3 tài liệu hết hiệu lực, 2 tài liệu có hiệu lực sau 30 ngày, 2 tài liệu trong thùng rác và 4 tài liệu có hai phiên bản. Các nhóm có thể chồng nhau; không cộng các trạng thái như các tập riêng biệt. Có hai yêu cầu truy cập mẫu đang chờ xử lý. Ngày hiệu lực được tính theo thời điểm khởi tạo dữ liệu trên từng môi trường.

## Kịch bản theo vai trò

| Mã | Vai trò | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| UAT-01 | Người học | Mở “Chào hỏi và giới thiệu bản thân.pdf” trong HSK 1 / Bài học dùng thử | Xem được; watermark có hai thương hiệu và email |
| UAT-02 | Người học | Tải PDF trên | Có watermark trong PDF đã tải |
| UAT-03 | Người học | Mở “Số đếm và ngày tháng.pdf” | Xem được; nút tải không khả dụng vì file chỉ cho xem |
| UAT-04 | Người học | Mở “Đọc hiểu chuyến đi cuối tuần.pdf” thuộc HSK 2 | Chưa có quyền; có yêu cầu truy cập mẫu để Admin xét |
| UAT-05 | Người học | Mở “Bài tập nâng cao bị giới hạn.pdf” thuộc HSK 1 / Bài tập | Bị Deny dù đã được cấp quyền thư mục HSK 1 |
| UAT-06 | Người học | Mở trực tiếp đường dẫn/API quản trị | Bị từ chối; không xem được hồ sơ HCNS |
| UAT-07 | Admin Bacnhabook | Xử lý yêu cầu HSK 2 của tài khoản học viên demo | Sau khi cấp quyền, học viên mở được bài đọc HSK 2 |
| UAT-08 | Admin Bacnhabook | Duyệt “Đề luyện tập cuối tuần.pdf” | Tài liệu đang là nháp; có thể sửa/gửi duyệt theo thẩm quyền |
| UAT-09 | Admin Bacnhabook | Mở “Kế hoạch học tập tháng tới.pdf” từ mục phê duyệt | Tài liệu chờ duyệt được xử lý bởi người được giao; người gửi và người duyệt khác nhau |
| UAT-10 | Admin Bacnhabook | Import file `import-hoc-vien-hop-le.xlsx` ở chế độ preview | Hiển thị 12 email `.test` hợp lệ trước khi commit |
| UAT-11 | Admin Bacnhabook | Preview `import-hoc-vien-co-loi.xlsx` | Nhận diện email lỗi/trống và email trùng trong file |
| UAT-12 | Admin HCNS | Mở “Hồ sơ nhân sự mẫu NV-UAT-001.pdf” | Được xem trong kho HCNS; không có watermark |
| UAT-13 | Admin HCNS | Xử lý yêu cầu hồ sơ của nhân viên demo | Yêu cầu được xử lý trong scope HCNS, ghi nhận quyết định |
| UAT-14 | Admin HCNS | Tìm “Quy trình nhân sự đã hết hiệu lực.pdf” | Có nhãn/cảnh báo đã hết hiệu lực; không tự xóa |
| UAT-15 | Quản lý Marketing | Mở “Lịch nội dung bốn tuần.pdf”, xem lịch sử phiên bản | Có V1 và V2; thao tác phục hồi chỉ dành cho người có MANAGE |
| UAT-16 | Quản lý Marketing | Xử lý “Đề xuất chiến dịch cần phê duyệt.pdf” | Có tài liệu chờ phê duyệt trong kho Marketing |
| UAT-17 | Quản lý Marketing | Thử sửa hồ sơ HCNS | Bị từ chối vì ngoài scope |
| UAT-18 | Nhân viên | Mở “Sổ tay hội nhập nhân viên.pdf” | Được xem/tải nếu chính sách cho phép; không có watermark |
| UAT-19 | Nhân viên | Lưu tài liệu và mở mục Đã lưu / Gần đây | Thấy đúng tài liệu đã lưu / đã xem của tài khoản |
| UAT-20 | Nhân viên | Thử vào quản lý người dùng/cài đặt | Không có menu quản trị; đường dẫn/API trực tiếp bị chặn |
| UAT-21 | Super Admin | Xem người dùng, dashboard, nhật ký | Thấy bộ tài khoản demo; sự kiện tạo dữ liệu ghi rõ SAMPLE_DATA_CREATED |
| UAT-22 | Super Admin | Phục hồi “Biểu mẫu cũ cần phục hồi.pdf” từ thùng rác | File trở lại thư mục; quyền và metadata được giữ |
| UAT-23 | Super Admin | Tìm “Chính sách áp dụng từ tháng sau.pdf” | Nhận biết ngày hiệu lực trong tương lai; người chưa có quyền quản lý chưa xem được nội dung |
| UAT-24 | Các vai trò | Thử trên điện thoại 390px và desktop | Không tràn ngang; tìm kiếm, menu, popup và thao tác chính dùng được |

Các thao tác duyệt, cấp quyền, đổi mật khẩu và phục hồi làm thay đổi dữ liệu dùng chung. Chủ dự án nên điều phối thứ tự thử; đây không phải sáu môi trường riêng biệt. Chạy lại seed không đưa dữ liệu đã sửa về trạng thái ban đầu. Nếu Render Free mất database khi redeploy, bộ mẫu có thể được tạo lại; kết quả thử cần ghi ra file phản hồi trước.

## Gửi phản hồi

Mở `phan-hoi-dung-thu.xlsx`, điền Kết quả thực tế, Trạng thái, Mức độ và ghi chú cho từng mã UAT. Trạng thái ban đầu “Chưa chạy” không phải kết quả kiểm thử. Khi báo lỗi, kèm vai trò, tên tài liệu, thao tác, thiết bị/trình duyệt, ảnh chụp và thời điểm. Không gửi mật khẩu trong phiếu phản hồi.

## Giới hạn cần biết

- Các tài liệu mẫu đều là PDF thật; không có Office, audio hoặc video giả gắn đuôi định dạng khác. Bản xem hiện là rendition văn bản riêng.
- File upload mới vẫn phải qua scanner. Nếu chưa cấu hình scanner, pending_scan là kết quả dự kiến; file chưa được phát hành.
- Các email `.test` không nhận thư. File Excel chỉ phục vụ preview/import; chưa có dịch vụ email thật thì không dùng việc gửi thư làm tiêu chí đã đạt.
- Đây là bộ dùng thử chức năng, không phải nghiệm thu toàn bộ PRD hoặc kiểm thử tải/production.

## Tạo bộ mẫu trong môi trường phát triển

Từ `/workspace/projectDocumentCenter`, chạy `npm run seed:sample`. Ở `NODE_ENV=development`, backend tự bổ sung bộ mẫu khi khởi động. `ENABLE_SAMPLE_DATA=false` tắt tự động bổ sung. Production luôn bỏ qua bộ mẫu. Chỉ thêm các ID có tiền tố `uat-`; không ghi đè tài khoản, mật khẩu hoặc tài liệu có sẵn. Gói chia sẻ được tạo bằng `npm run sample:pack`, nằm trong `.data/uat-bacnhabook.zip` và không chứa database, khóa hoặc mật khẩu.
