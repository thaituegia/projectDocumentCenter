# Hai website riêng: Học liệu và Quản trị / Nội bộ

Thay đổi theo yêu cầu mới của người dùng: tách website dành cho khách/học viên Bác Nhã Book khỏi website admin + nhân viên nội bộ. Đây là thay đổi so với baseline một website/nhiều vai trò; dùng chung dữ liệu tài liệu và ACL để admin cập nhật có hiệu lực ngay.

## Website học liệu (`SITE_MODE=customer`)

- Giao diện thương hiệu Bác Nhã Book, navigation học liệu, bộ sưu tập HSK, tìm kiếm, xem/tải đúng quyền, tài liệu đã lưu, yêu cầu và thông báo cá nhân.
- Guest xem học liệu Public; đăng nhập chỉ dành cho CUSTOMER. Demo chỉ có tài khoản học viên, không có menu đổi vai trò quản trị.
- Không có kho công ty, HCNS, Marketing; không cung cấp user management, grants, upload, audit, settings, approval hoặc backup APIs.
- Có process HTTP và origin riêng. Gateway chỉ chuyển tiếp allowlist API học viên sang namespace `/api/customer` của server dữ liệu; không cho client chọn URL upstream hoặc chuyển thêm header quyền.
- Cookie `bacnha_customer_session`, host-only. Role được backend kiểm tra lại; không chấp nhận chuyển cookie admin sang cookie học viên.

## Website quản trị + nội bộ (`SITE_MODE=internal`, mặc định)

- Đăng nhập riêng; chỉ SUPER_ADMIN, BOOK_ADMIN, HR_ADMIN, MANAGER và EMPLOYEE.
- Admin vận hành theo scope; nhân viên tra cứu kho nội bộ theo ACL. Customer không đăng nhập website này.
- Database, objects, worker và các thao tác quản trị nằm tại service này; cookie `bacnha_internal_session` tách biệt.
- `/api/customer` là API học liệu đã giới hạn độc lập ở server; biết URL backend không nâng được quyền hoặc đọc tài liệu nội bộ.

## Dữ liệu dùng chung

Chỉ service internal giữ SQLite/objects. Service customer không seed/copy database, tránh trường hợp admin cập nhật một nơi còn học viên thấy dữ liệu khác. Khi deploy production vẫn cần PostgreSQL/R2/worker và các điều kiện nghiệm thu đã ghi; việc tách website không tự hoàn tất các blocker đó.

## Chạy local

```bash
# Terminal 1: dữ liệu + quản trị/nội bộ, cổng 3000
npm run dev
# Terminal 2: website học liệu, cổng 3003, proxy đến service trên
npm run dev:customer
```

Bản build:

```bash
npm run build
npm run preview
# Terminal 2
SITE_MODE=customer PORT=3003 INTERNAL_API_URL=http://127.0.0.1:3000 SERVE_BUILD=true node server/launch.js
```

## Hai URL Render

`render.yaml` khai báo hai Web Service free tại Singapore:

- `bacnhabook-demo`: giữ service cũ làm website quản trị/nội bộ và nơi lưu dữ liệu demo.
- `bacnhabook-hoc-lieu`: website học viên mới.

Khi Sync/Apply Blueprint, nhập `INTERNAL_API_URL` cho service học liệu bằng **URL HTTPS Render thực tế của service quản trị hiện tại**. Biến này không phải secret nhưng không được đoán hostname. Cấu hình dùng HTTPS công khai của backend để không phụ thuộc khả năng nhận private traffic của gói Free. Backend vẫn kiểm tra namespace học liệu, phiên, role, ACL và CSRF trên mọi request. Chỉ redeploy service cũ không tạo được service học liệu mới; cần Apply/Sync Blueprint.

Dữ liệu demo tạm mất khi container bị thay; hai service free có thể ngủ. Nếu URL backend thay đổi, cập nhật `INTERNAL_API_URL` trên service học liệu rồi redeploy. Chưa có URL Render thực tế để xác minh HTTPS trong phiên này.

## Sửa font tiếng Việt

Bỏ Libre Caslon Display Latin-only. Tiêu đề dùng Noto Serif gồm Latin + Vietnamese, cả regular và italic; giao diện dùng Be Vietnam Pro gồm Latin + Vietnamese. Font được bundle nội bộ, không phụ thuộc CDN. Chuỗi JSX được chuẩn hóa NFC; line-height phù hợp dấu tiếng Việt. Kiểm tra các từ “Mở”, “chạm”, “đến”, “trời”, “học liệu”, “quản trị” trên desktop/mobile và screenshot.
