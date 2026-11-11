# Kết quả kiểm chứng bản phát triển

Môi trường hiện tại: Node.js 24.22.1, npm 11.9.0, Linux, Chromium `/usr/bin/chromium`. Dữ liệu seed hoàn toàn minh họa, email `example.test`. Không sử dụng R2/email thực vì người dùng xác nhận sẽ cấu hình sau.

| Lệnh / kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| `npm run build` | PASS, Vite tạo bundle tĩnh, font tiếng Việt local | Không xác nhận deployment/UAT |
| `npm test` | PASS, Node báo 39/39 gồm **38 tình huống** + 1 test cha, không fail/skip | DB tạm SQLite, object local |
| `npm run test:e2e` | PASS, **9/9** hành trình Chromium | Desktop và mobile 390×844; không phải toàn bộ 189 AC |
| `npm run test:production` | PASS | Chỉ smoke mode production với DB mới: bundle, health, no demo login/seed/session; chưa production-ready |
| `npm audit --omit=dev` | PASS, 0 vulnerabilities tại thời điểm chạy | Không thay security review; phụ thuộc cần kiểm tra lại định kỳ |
| Desktop screenshot | 1440×1080 viewport, full page; không pageerror/console error | [Ảnh desktop](screenshots/library-desktop.png) |
| Mobile screenshot | 390×844 viewport, full page; scrollWidth=390, viewport=390 | [Ảnh mobile](screenshots/library-mobile.png) |
| Backup/restore local | PASS: SHA-256 DB/objects, integrity check, document/grant counts, restore mới, phát hiện object hỏng | Chưa kiểm tra provider độc lập/off-site/R2 |

## Tình huống API đã chạy

Guest listing filename nhưng không nhận metadata nhạy cảm; public preview được phép; private preview 403; VIEW-only không original; DOWNLOAD cần flag + ACL; Deny ancestor; grant expired/future; department membership; admin ngoài scope; chống nâng role; search không leak nội dung; CSRF; folder duplicate/cycle/scope; soft-delete subtree; favorites; request idempotency và grant sau approve; tạo account hash + encrypted outbox; duplicate không reset password/email; bắt đổi mật khẩu lần đầu; khóa user revoke session; reviewer/self-approval/reject reason; nested upload pending_scan; scanner thiếu cấu hình fail closed; date validation; soft restore; Excel preview/commit idempotency; own notifications; audit/dashboard scope; version restore scope; password recovery one-time; idle/concurrency; backup/restore checksum; malformed origin; production từ chối demo; logout revoke.

## 9 hành trình browser

1. Thư viện → grid/list → preview/watermark → bộ sưu tập.
2. Search → kết quả → empty state → lọc âm thanh.
3. Tạo folder → reload → dữ liệu còn lưu.
4. Chuyển Customer → tài liệu không có VIEW → request hiện có được nhận diện.
5. Dashboard → people → audit → settings.
6. Mobile menu → requests → library → viewer, không tràn ngang.
7. Chuyển role → ẩn menu không thuộc scope + gọi API bị từ chối thật.
8. Sửa mô tả tài liệu → server lưu → mở lại → permission editor thấy quyền kế thừa.
9. Upload file thật → record tồn tại → chờ scan → không phát hành preview.

## Chưa được kiểm chứng / chưa đủ release

- R2 private, key policy, presigned multipart/resume/TTL và giao tiếp với bucket thực.
- Gửi email thực, retry theo provider, email tất cả sự kiện và TTL mật khẩu tạm.
- ClamAV với signature thật, PDF/Office conversion thật, image/media preview/player và renderer isolation.
- MFA quản trị, bootstrap admin production, đa vai trò đầy đủ, device ID riêng biệt.
- PostgreSQL, queue phân tán, scheduler lifecycle notifications/retention, off-site backup/restore, storage provider billing/alerts.
- Toàn bộ edge-case AC, security review, UAT J1–J5 và kiểm thử tải 100–500 concurrent / khoảng 50.000 file.

Không dùng các kết quả local để tuyên bố đạt BR-38, BR-37 hoặc toàn bộ release. Toàn bộ story/AC vẫn được bảo toàn trong [acceptance-matrix.md](acceptance-matrix.md).
