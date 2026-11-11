# Runbook vận hành và bàn giao

## Khởi động / readiness

Dùng Node 24, `npm ci`, `npm run dev`. API health trả `{status:ok,database:sqlite}` sau truy vấn DB. Dev không cần R2/email để xem seed. Chạy worker riêng; processes không sống qua snapshot/task restart. Dùng checkout hiện tại, không tạo worktree trừ khi user yêu cầu.

`npm run build` tạo static assets. Production `npm start` yêu cầu HTTPS/cookie secure và không có demo login/seed. **Chưa cho đưa production**: admin MFA chưa xong, PostgreSQL/load và các kiểm chứng bên dưới chưa đạt.

## R2 và email

1. Tạo private bucket riêng theo môi trường, quyền keys tối thiểu. Cho phép egress hostname R2 endpoint tương ứng trong cloud settings.
2. Cấu hình biến `.env.example` ở server/secret manager. Không commit `.env`, `.data`, key encryption hay backup vào Git.
3. Restart web và worker để nhận biến mới.
4. Dùng tài khoản thật trong staging upload fixture vô hại → scan sạch → preview riêng → kiểm tra checksum/download/ACL. Kiểm tra Guest 403 cho private. Chưa thực hiện do user cấu hình sau.
5. Gửi email fixture staging, kiểm tra outbox sent/body đã bị xóa; retry lỗi có idempotency key. Luồng sự kiện in-app hiện đầy đủ hơn email; không nghiệm thu NOTI-02 toàn bộ.

## Quét an toàn/chuyển đổi

Cài ClamAV với signature database cập nhật qua nguồn tin cậy. Không tắt TLS/chữ ký hoặc dùng executable giả làm scanner. Cài Poppler và LibreOffice từ gói OS có xác thực. Worker dùng subprocess timeout và thư mục tạm riêng; **chưa có container isolation**. Worker mỗi 2 giây lấy một job, hàng đợi đơn máy, không được chạy nhiều worker khi chưa có distributed claim.

Thử lại job qua `POST /api/jobs/:id/retry`, cần cookie session + CSRF và MANAGE đúng kho. Đọc status trong dashboard. Scanner không có cấu hình → `failed`/pending_scan; không được đổi DB thành ready thủ công. Office conversion chỉ dựng bản text riêng, chưa giữ fidelity layout.

## Sao lưu / khôi phục cục bộ

`node server/backup.js create <outside-DATA_DIR>` tạo DB online backup, object copies, manifest SHA-256, object count, document count, grant count. Tất cả object keys tham chiếu từ document và versions được copy, kể cả soft-deleted. Key outbox local dev được copy 0600; production key do secret manager quản lý, không xuất qua API.

`verify <snapshot>` kiểm tra DB hash, từng object size/hash, `PRAGMA integrity_check`, document/ACL counts. `restore <snapshot> <new-dir>` chỉ ghi vào đích mới, không ghi đè DB live. Test độc lập bằng `DATA_DIR=<new-dir> PORT=3002 npm run dev` trong mạng staging rồi đối chiếu quyền.

Snapshot trên cùng máy là **rehearsal local**, không phải đáp ứng BR-37 backup độc lập. Production cần provider/vùng tách biệt, encryption/access controls, lịch, retention, object consistency, RPO/RTO được duyệt và restore staging có biên bản. Chưa có tự động scheduled backup/purge.

## Rollback

Trước deploy staging, tạo backup và verify, lưu phiên bản commit/build. Dừng web + worker, giữ nguyên snapshot/binary và biến runtime. Khi rollback, khôi phục DB + objects cùng snapshot vào đường dẫn mới, kiểm tra hash/quyền trước khi chuyển traffic. Không reset database live về dữ liệu seed. Nếu storage driver đổi local → R2, cần migration objects có checksum và rollback mapping. Kế hoạch này chưa được diễn tập với R2 thật.

## Theo dõi

Web phát `X-Request-Id` và audit lưu actor, target, repo, outcome, timestamp. API lỗi không dump secrets/stack ra response. Log runtime chỉ nêu loại lỗi và request ID. Dashboard dùng audit thật, không lấy số minh họa làm số vận hành. Chưa có Prometheus/tracing/alert transport và load report 500 concurrent.
