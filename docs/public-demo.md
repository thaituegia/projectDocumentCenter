# Đưa bản trải nghiệm lên hosting công khai

Mã nguồn và cấu hình container đã chuẩn bị; chưa có dịch vụ hosting được kết nối hoặc URL đã xuất bản. Không coi việc push GitHub hoặc build thành công là đã deploy.

## Container dùng chung cho Render / Railway / VPS

`Dockerfile` build frontend, cài runtime dependencies theo lockfile, chạy Node 24 bằng user không phải root. Backend và file build cùng một service/port. Đọc `PORT` do hosting cung cấp, có health endpoint `/api/health`.

Mặc định container dùng **production**: không seed, không demo login, admin login vẫn khóa do chưa có MFA. Để trải nghiệm dữ liệu minh họa, cấu hình hosting riêng với:

| Biến | Giá trị cho demo |
|---|---|
| `NODE_ENV` | `development` |
| `SERVE_BUILD` | `true` |
| `DATA_DIR` | `/tmp/bacnhabook-demo` |

Đây là **demo công khai có quyền quản trị minh họa**, ai có link cũng có thể đổi vai trò và sửa dữ liệu mẫu. Không upload hồ sơ thật hoặc cấu hình R2/email production vào service demo này. `/tmp` là dữ liệu tạm: mất/reset khi hosting thay máy/container; phù hợp trải nghiệm, không phải lưu trữ vận hành. Chỉ một instance cho SQLite/worker hiện tại.

Không cần R2/email để mở thư viện, preview tài liệu seed, thử ACL, quản lý user, request, phê duyệt và thùng rác. Upload mới vẫn chờ scanner và không được phát hành. Chạy worker/scan/convert là bước riêng đã nêu ở README.

## Render

Đã có `render.yaml` ở root để dùng **New → Blueprint**: kết nối GitHub, chọn repository và branch `main`, xem lại cấu hình service miễn phí rồi deploy. Blueprint chỉ khai báo một demo dùng dữ liệu tạm, không có tài nguyên/disk trả phí hoặc secret.

Nếu muốn tạo thủ công:

1. Trong Render, kết nối GitHub với repository `thaituegia/projectDocumentCenter`.
2. Tạo **Web Service** từ repository, branch `main`, runtime **Docker** (Dockerfile ở root).
3. Chọn gói theo nhu cầu; bản demo có thể dùng free nếu tài khoản cung cấp. Không cần tạo database/disk trả phí để xem dữ liệu mẫu.
4. Thêm 3 biến demo ở bảng trên, Health Check Path `/api/health`; giữ 1 instance.
5. Deploy. Dùng URL HTTPS được Render cấp sau khi service báo healthy. Không dùng địa chỉ loopback từ máy cloud làm link công khai.

Free service có thể ngủ khi không hoạt động và khởi động lại chậm. Mất dữ liệu minh họa sau redeploy là hành vi dự kiến của cấu hình tạm này.

## Railway

1. Tạo service từ GitHub repository và branch `main`, để Railway nhận Dockerfile.
2. Thêm 3 biến demo ở trên; service đọc `PORT` được cấp tự động. Health check `/api/health`.
3. Trong Networking tạo public domain, deploy và mở URL HTTPS do Railway cấp. Kiểm tra điều kiện trial/chi phí trên tài khoản của bạn trước khi tạo tài nguyên.

## VPS

Cần Docker, domain/DNS và reverse proxy HTTPS được cấu hình trên server do bạn quản lý. Chỉ bind container vào loopback, proxy public qua HTTPS:

```bash
docker build -t bacnhabook-demo .
docker run -d --name bacnhabook-demo --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e NODE_ENV=development -e SERVE_BUILD=true \
  -e DATA_DIR=/tmp/bacnhabook-demo bacnhabook-demo
```

Cấu hình Nginx/Caddy theo domain thực; không tự suy đoán domain, DNS hay chứng chỉ. Khi cần vận hành dữ liệu thật, dùng service production riêng và hoàn tất các blocker trong acceptance matrix.

## Kiểm chứng sau deploy

- URL HTTPS `/api/health` trả `status: ok`.
- Trang chính tải assets từ `/assets/`, không dùng Vite HMR.
- Demo tự mở tài khoản Minh Anh và menu đổi vai trò có tác dụng.
- Customer bị 403 khi gọi preview tài liệu ngoài quyền; không nhận object key.
- Thử trên máy tính và điện thoại; kiểm tra cookie/session cùng domain.

Đã build Docker image và khởi động container bằng user `node` trong cloud hiện tại; đã kiểm tra health, trang thư viện, đăng nhập demo và preview tài liệu bằng Chromium. Chưa có URL Render để kiểm chứng HTTPS từ Internet.
