# Kết quả kiểm chứng bản phát triển

Môi trường hiện tại: Node.js 24.22.1, npm 11.9.0, Linux, Chromium `/usr/bin/chromium`. Dữ liệu seed hoàn toàn minh họa, email `example.test`. Không sử dụng R2/email thực vì người dùng xác nhận sẽ cấu hình sau.

| Lệnh / kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| `npm run build` | PASS, Vite tạo bundle tĩnh, font tiếng Việt local | Không xác nhận deployment/UAT |
| `npm test` | PASS, Node báo 47/47 gồm **45 tình huống API**, 1 test cha và 1 kiểm tra provisioning demo, không fail/skip | DB tạm SQLite, object local |
| `npm run test:e2e` | PASS, **18/18** hành trình Chromium | Desktop và mobile 390×844; không phải toàn bộ 189 AC |
| `npm run test:production` | PASS | Chỉ smoke mode production với DB mới: bundle, health, no demo login/seed/session; chưa production-ready |
| `npm audit --omit=dev` | PASS, 0 vulnerabilities tại thời điểm chạy | Không thay security review; phụ thuộc cần kiểm tra lại định kỳ |
| Desktop screenshot | 1440×1080 viewport, full page; không pageerror/console error | [Học liệu desktop](screenshots/customer-desktop.png) |
| Mobile screenshot | 390×844 viewport, full page; scrollWidth=390, viewport=390 | [Học liệu mobile](screenshots/customer-mobile.png) |
| Backup/restore local | PASS: SHA-256 DB/objects, integrity check, document/grant counts, restore mới, phát hiện object hỏng | Chưa kiểm tra provider độc lập/off-site/R2 |

## Tình huống API đã chạy

Guest listing filename nhưng không nhận metadata nhạy cảm; public preview được phép; private preview 403; VIEW-only không original; DOWNLOAD cần flag + ACL; Deny ancestor; grant expired/future; department membership; admin ngoài scope; chống nâng role; search không leak nội dung; CSRF; folder duplicate/cycle/scope; soft-delete subtree; favorites; request idempotency và grant sau approve; tạo account hash + encrypted outbox; duplicate không reset password/email; bắt đổi mật khẩu lần đầu; khóa user revoke session; reviewer/self-approval/reject reason; nested upload pending_scan; scanner thiếu cấu hình fail closed; date validation; soft restore; Excel preview/commit idempotency; own notifications; audit/dashboard scope; version restore scope; password recovery one-time; idle/concurrency; backup/restore checksum; malformed origin; production từ chối demo; logout revoke.

## 18 hành trình browser

1. Thư viện nội bộ → grid/list → preview không watermark → bộ sưu tập.
2. Search → kết quả → empty state → lọc âm thanh.
3. Tạo folder → reload → dữ liệu còn lưu.
4. Chuyển Customer → tài liệu không có VIEW → request hiện có được nhận diện.
5. Dashboard → people → audit → settings.
6. Mobile menu → requests → library → viewer, không tràn ngang.
7. Chuyển role → ẩn menu không thuộc scope + gọi API bị từ chối thật.
8. Sửa mô tả tài liệu → server lưu → mở lại → permission editor thấy quyền kế thừa.
9. Upload file thật → record tồn tại → chờ scan → không phát hành preview.

10. Hai website chạy khác origin/port, cookie độc lập; admin cập nhật → học viên đọc dữ liệu mới.
11. Website học viên không có sidebar quản trị, không gọi được API nội bộ, không đọc tài liệu HCNS.
12. Noto Serif regular/italic tải đủ ký tự tiếng Việt, screenshot desktop/mobile, không tràn ngang.
13. Website nội bộ có trang đăng nhập riêng khi đăng xuất, không hiển thị thư viện Guest.

14–18. Trang làm việc riêng cho Super Admin, Admin Bacnhabook, HCNS, quản lý kho và nhân viên: đúng tiêu đề/nhiệm vụ, kho mặc định sau khi chuyển vai trò và reload, responsive 390×844, chặn trang cài đặt với vai trò không phải Super Admin cả UI và API; nhân viên cũng bị chặn trang/API người dùng. Ảnh từng vai trò được tạo tại `test-results/workspace-<id>.png` và `test-results/workspace-<id>-mobile.png` (output ignored).

## Theme và watermark thương hiệu

- Theme nội bộ đỏ đô ThanhmaiHSK, khách hàng xanh dương/xanh đậm Bác Nhã Books; kiểm tra lại browser workflows desktop/mobile và font tiếng Việt.
- Bản xem khách hàng có tám cụm watermark chứa hai thương hiệu và email của phiên đăng nhập; assertion trong hành trình Customer. Bản xem nội bộ không có watermark, header hay footer thương hiệu trên trang nội dung. Watermark nằm trong trang nội dung để theo phần phóng to và canvas toàn màn hình.
- API regression xác nhận năm vai trò nội bộ tải PDF trùng byte với original; khách hàng vẫn có watermark kể cả thêm `watermark=false`. Bản PDF tải cho khách hàng có các lệnh vẽ watermark trên từng trang, giữ số trang, và original trước/sau tải không thay đổi byte; PDF không đọc được trả 422.
- Kiểm tra bổ sung bằng `pdftotext -raw` trên PDF mẫu hai trang: mỗi trang chứa hai lần “BÁC NHÃ BOOKS”, “THANHMAIHSK” và email người xem; đã render trang mẫu để kiểm tra trực quan. Không xác nhận watermark nhúng cho file tải không phải PDF.

## Chưa được kiểm chứng / chưa đủ release

- R2 private, key policy, presigned multipart/resume/TTL và giao tiếp với bucket thực.
- Gửi email thực, retry theo provider, email tất cả sự kiện và TTL mật khẩu tạm.
- ClamAV với signature thật, PDF/Office conversion thật, image/media preview/player và renderer isolation.
- MFA quản trị, bootstrap admin production, đa vai trò đầy đủ, device ID riêng biệt.
- PostgreSQL, queue phân tán, scheduler lifecycle notifications/retention, off-site backup/restore, storage provider billing/alerts.
- Toàn bộ edge-case AC, security review, UAT J1–J5 và kiểm thử tải 100–500 concurrent / khoảng 50.000 file.

Không dùng các kết quả local để tuyên bố đạt BR-38, BR-37 hoặc toàn bộ release. Toàn bộ story/AC vẫn được bảo toàn trong [acceptance-matrix.md](acceptance-matrix.md).

## Cấu hình triển khai Render demo

Docker multi-stage đã build thành công với TLS verification giữ nguyên. Container chạy non-root, tạo database/objects minh họa vào `/tmp`, health API trả OK; Chromium xác nhận auto-login demo, thư viện và document preview không có pageerror. `render.yaml` hiện khai báo hai web service free tại Singapore theo yêu cầu mới. Chưa deploy lên tài khoản Render, chưa có URL HTTPS công khai để xác nhận.

## Kiểm chứng bổ sung: hai website

Đã build và chạy hai container riêng trên Docker network riêng: backend nội bộ giữ DB và gateway học liệu kết nối backend qua HTTP. Chromium xác nhận 8 học liệu Published trên website học liệu, phiên riêng, cập nhật từ admin phản ánh ngay, `/api/users` phía học viên bị 403. Đã kiểm tra font Noto Serif regular/italic với chuỗi tiếng Việt và ảnh desktop/mobile. Ảnh [đăng nhập nội bộ](screenshots/internal-login.png), [workspace nội bộ](screenshots/internal-workspace.png).

`render.yaml` hiện khai báo hai service Free. Phải Sync/Apply Blueprint và nhập URL HTTPS backend thực tế ở `INTERNAL_API_URL`; chưa có URL hoặc quyền truy cập Render để xác nhận deploy. Các kết quả container không được ghi là đã xuất bản hai URL Render.
