# Triển khai hai website trải nghiệm trên Render

Cấu hình hiện tại thay thế mô hình website gộp trước đây bằng **hai Web Service** trong `render.yaml`. Xem [chi tiết kiến trúc và cách chạy local](two-websites.md).

1. Trong Render, mở Blueprint đã kết nối repository `thaituegia/projectDocumentCenter`, nhánh `main`.
2. Chọn Sync/Apply để cập nhật service `bacnhabook-demo` làm website **quản trị + nội bộ** và tạo `bacnhabook-hoc-lieu` làm website **học viên**.
3. Nhập `INTERNAL_API_URL` cho service học liệu bằng URL HTTPS Render thực tế của service quản trị. Không nhập URL website học liệu vào biến này; gateway cần kết nối service giữ database.
4. Chờ cả hai health checks thành công. Render cấp hai URL HTTPS riêng; không tự suy đoán hostname từ tên service.
5. Mở website học liệu để duyệt Public hoặc dùng tài khoản học viên mẫu. Mở website quản trị để dùng tài khoản quản trị/nhân viên minh họa.

## Dữ liệu và tài khoản

Hai service dùng chung dữ liệu qua API: chỉ backend quản trị giữ DB/objects. Bản demo dùng `NODE_ENV=development`, `SERVE_BUILD=true`; không dùng Vite dev server trên hosting. Demo có tài khoản dùng thử công khai; không upload hồ sơ thật hoặc gắn R2/email production. Cookie, vai trò, phạm vi API và giao diện hai website đã tách biệt.

Cả hai service khai báo gói Free, không tạo disk/database trả phí. `/tmp/bacnhabook-demo` là dữ liệu tạm và có thể mất khi redeploy; Free có thể ngủ. Chỉ một instance backend. Upload vẫn chờ scan; dịch vụ R2/email/media/MFA và các blocker production giữ nguyên trạng thái chưa nghiệm thu.

## Docker và TLS

Docker multi-stage Node 24 đã được build/kiểm chứng trong cloud. Runtime chạy bằng user `node`. Proxy CA khi build cloud được mount tạm bằng BuildKit, không copy vào image; TLS verification không bị tắt. Container production mặc định không seed/cho đăng nhập demo; Render demo bật qua cấu hình riêng.

Khi backend URL đổi, sửa `INTERNAL_API_URL` trên frontend và redeploy. Domain tùy chỉnh có thể thêm sau; hiện dùng URL Render. Chưa có quyền kết nối tài khoản Render trong phiên nên chưa thể tự apply Blueprint hoặc xác nhận URL công khai.
