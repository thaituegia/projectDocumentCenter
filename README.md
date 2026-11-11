# Bacnhabook · Không gian tri thức

Website kho tài liệu và học liệu tiếng Việt, được xây dựng từ 4 tài liệu yêu cầu đã cung cấp. Đây là **bản phát triển có backend và lưu dữ liệu bền vững**, chưa phải bản nghiệm thu toàn bộ BR-01–BR-38. Phạm vi một release và toàn bộ 63 story được giữ trong [bảng đối chiếu](docs/acceptance-matrix.md); không coi bản chạy thử là production đã hoàn thành.

## Chạy trên cloud hiện tại

Yêu cầu Node.js **24+**, npm. Dùng checkout hiện tại `/workspace/projectDocumentCenter`; cloud task đã cô lập, không cần tạo Git worktree.

```bash
cd /workspace/projectDocumentCenter
npm ci --cache /workspace/.npm-cache
npm run dev
```

Máy chủ web + API chạy cổng `3000`, nghe trên `0.0.0.0`. Dev server tự tạo dữ liệu minh họa khi database trống. Bản dev đăng nhập trải nghiệm Super Admin ở lần mở đầu của phiên trình duyệt. Menu tài khoản cho phép đổi giữa 6 vai trò minh họa hoặc đăng xuất để kiểm tra Guest. Đây là đường đăng nhập **chỉ tồn tại ở development/test**, trả 404 trong production. Mật khẩu seed sinh ngẫu nhiên, không hardcode mật khẩu chung.

Để trải nghiệm đúng bản đã build với dữ liệu/tài khoản minh họa:

```bash
npm run build
npm run preview
```

Lệnh `preview` phục vụ file trong `dist` và backend trên cùng cổng 3000, giữ chế độ demo khi `NODE_ENV` không phải production. Lệnh này không tự tạo URL công khai. Dừng dev server đang dùng cổng 3000 trước khi chạy preview. `npm start` vẫn là chế độ production, không có tài khoản demo.

Khởi động worker riêng khi cần xử lý hàng đợi:

```bash
npm run worker
```

Sau khi cấu hình scanner, có thể bấm thử lại job lỗi trong giao diện Tổng quan. Nếu chưa có scanner, job fail closed; file giữ `pending_scan`, không bị phát hành. Không tự coi upload thành công là file an toàn.

## Đã có trong bản phát triển

- Thư viện responsive với các kho, cây thư mục/breadcrumb, bộ sưu tập HSK, tìm tên/nội dung được phép, lọc, sắp xếp, phân trang, grid/list, lưu tài liệu và lịch sử đã xem.
- Backend SQLite, migration SQL có thể chạy lặp, seed tài liệu PDF thật với **bản xem riêng dạng văn bản**. Các định dạng hiển thị trong seed chỉ là mẫu giao diện; không phải file Office/audio/video thương mại thật.
- Phiên cookie httpOnly, CSRF, bcrypt, giới hạn phiên/idle, chặn tài khoản khóa, đổi mật khẩu ban đầu, token khôi phục một lần. Mật khẩu mới tối thiểu 12 ký tự, chữ hoa/thường/số là tham số dev được ghi rõ.
- ACL server-side trên cá nhân/phòng ban, file/thư mục, kế thừa, Deny > Allow, thời hạn; bản gốc không được cung cấp cho VIEW-only. Quyền quản lý tách riêng khỏi quyền VIEW. Không bypass VIEW cho admin.
- Tạo thư mục, chống vòng lặp di chuyển, cấu hình approver/metadata, upload nguyên cấu trúc thư mục, công việc chờ scanner; API quản lý thư mục đầy đủ hơn UI hiện tại.
- Tạo/khóa/cập nhật người dùng theo phạm vi, import Excel/CSV preview từng dòng, commit idempotent và cấp VIEW theo lô.
- Yêu cầu quyền, thông báo in-app, phê duyệt có người duyệt, xuất bản/nháp, chính sách tải, metadata, ngày hiệu lực/hết hạn, phiên bản/khôi phục, soft delete/restore và audit theo scope.
- Dashboard lấy dữ liệu thật từ DB/audit; export CSV chống formula injection; cấu hình bảo mật và trạng thái tích hợp.
- Adapter R2 riêng tư và email HTTPS outbox mã hóa AES-GCM, có retry. Chưa kiểm chứng với tài khoản dịch vụ thật.
- Công cụ backup/checksum/restore vào thư mục mới, đã kiểm tra **cục bộ**; chưa thay thế sao lưu độc lập off-site.

## Cấu hình dịch vụ sau

`.env.example` chỉ chứa tên biến và ví dụ không bí mật. Tạo `.env` hoặc dùng secret manager của môi trường, không đưa secrets lên Git. Chạy bằng `node --env-file=.env server/index.js` và `node --env-file=.env server/worker.js` khi dùng file env. npm script mặc định không tự nạp `.env`.

- **R2:** đặt `STORAGE_DRIVER=r2`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. Bucket phải private, khóa chỉ có quyền bucket cần thiết. Đường đọc luôn qua API đã kiểm tra ACL. Luồng hiện tại upload qua server, **chưa có presigned multipart/resume**. Khi chuyển local → R2, cần di chuyển objects và kiểm tra checksum trước; không chỉ đổi biến để di chuyển dữ liệu.
- **Email:** `EMAIL_API_URL`, `EMAIL_API_KEY`, `EMAIL_FROM`. Payload tương thích dịch vụ `{from,to,subject,text}` như Resend. Key chỉ dùng ở backend. Với proxy secret, dùng đúng endpoint HTTPS được ràng buộc. `EMAIL_OUTBOX_KEY` là khóa base64 32-byte từ secret manager; bản dev tự giữ khóa local 0600 ngoài Git. Chỉ gửi mật khẩu từ outbox được mã hóa; thư đã gửi được xóa nội dung. Cần thêm chính sách hết hạn mật khẩu tạm theo OD-03.
- **Scan/convert:** ClamAV có cơ sở chữ ký cập nhật, `CLAMSCAN_PATH`, Poppler `pdftotext`, LibreOffice `LIBREOFFICE_PATH`. Renderer/AV cần chuyển vào worker sandbox/container khi vận hành. Hiện hỗ trợ bản đọc text PDF/Office và text; ảnh/media đang fallback chưa có player/render đầy đủ.
- **Production:** `NODE_ENV=production`, HTTPS, build trước. Không seed dữ liệu hoặc cho đăng nhập demo. Đăng nhập admin production hiện **bị chặn** cho đến khi triển khai/kiểm chứng MFA; đây là blocker được ghi công khai, không phải MFA đã hoàn thành. Chưa có bootstrap admin production.

Không cần nhập khóa ngay để trải nghiệm local. Khóa bí mật không được gửi trong chat.

## Kiểm thử

```bash
npm test
npm run build
npm run test:e2e
npm run test:production
```

Browser tests dùng `/usr/bin/chromium` sẵn trên máy; đặt `CHROMIUM_PATH` nếu cần. API tests tạo database tạm độc lập, không tác động dữ liệu đang chạy. E2E dùng cổng `3001` và `.data/e2e-<process-id>`. CI được khai báo trong `.github/workflows/ci.yml`, chưa chạy trên GitHub. Các kết quả local và giới hạn trong [validation.md](docs/validation.md).

## Sao lưu và khôi phục thử

```bash
node server/backup.js create /workspace/bacnhabook-backups
node server/backup.js verify /workspace/bacnhabook-backups/SNAPSHOT
node server/backup.js restore /workspace/bacnhabook-backups/SNAPSHOT /workspace/bacnhabook-restored
```

Restore chỉ vào thư mục **chưa tồn tại**, không ghi đè hệ thống đang chạy. Dữ liệu backup có thể chứa thông tin nhạy cảm và cần quyền truy cập hạn chế. Xem [runbook](docs/operations.md).

API contract của các route đã có: [OpenAPI](docs/openapi.json), cũng có tại `/api/openapi.json`. Spec là bản phát triển, chưa chốt contract production.

## Kiến trúc và trạng thái bàn giao

- `src/`: React + Vite, lucide icons, font tiếng Việt được bundle nội bộ; không cần CDN khi chạy.
- `server/index.js`: HTTP/API, cookie sessions, CSRF, validation, phạm vi quản trị.
- `server/authz.js`: ACL và truy vấn chính sách tập trung.
- `server/migrations/001_initial.sql`: dữ liệu, sessions, grants, audit, outbox, processing jobs.
- `server/worker.js`: scan/convert/index và email outbox.
- `server/storage.js`: local/R2 adapter, không lộ object keys trong response tài liệu.
- `tests/`: HTTP permission regression và browser workflows.
- `docs/requirements/`: bản văn bản trích xuất đủ PRD/backlog cùng implementation pack và JSON gốc.

Stack là lựa chọn cho bản phát triển, **không coi là quyết định kiến trúc production đã duyệt**. Chưa chứng minh tải 100–500 đồng thời/50.000 file. Cần PostgreSQL, queue phân tán, renderer isolation, MFA, multipart upload, media preview, monitoring và independent backup trước khi nghiệm thu đầy đủ. Không có SLA/deadline tự đặt. HRM, thanh toán và chỉnh sửa Office online không được tự thêm vào phạm vi.

## Link trải nghiệm công khai

Đã có `Dockerfile` và [hướng dẫn triển khai demo trên Render/Railway/VPS](docs/public-demo.md). Cần kết nối hosting để được cấp URL HTTPS; GitHub repository và server local không tự tạo link công khai. Demo phải dùng dữ liệu mẫu riêng, không kết nối dữ liệu production khi tính năng đổi vai trò công khai đang bật.
