"""Generate a traceable report; no inferred AC is marked passed automatically."""
import json
from pathlib import Path
source=Path(__file__).resolve().parents[1]/'docs/requirements/04_User_Stories_Machine_Readable.json'
d=json.loads(source.read_text())
# Criteria verified by executable regression assertions; other criteria remain partial/unrun.
verified={
'AUTH-01':[2,3],'AUTH-02':[1,2,3],'AUTH-03':[1,3],'AUTH-04':[2,3],
'AUTH-05':[2,3],'AUTH-06':[1,2,3],'FOLD-01':[1,2,3],'FOLD-02':[1,2,3],
'FOLD-03':[2],'FILE-02':[1,2],'FILE-03':[2],'FILE-05':[1,2,3],
'ACL-01':[2],'ACL-03':[1,3],'ACL-04':[1,2],'ACL-05':[1,2],
'ACL-06':[1,2,3],'ACL-07':[1,2],'BULK-01':[1,2],'BULK-02':[1,2],
'BULK-03':[3],'PUB-01':[1],'PUB-03':[3],'META-02':[3],
'SEARCH-01':[2],'SEARCH-02':[3],'LIFE-01':[1,3],'TRASH-01':[1,2],
'TRASH-02':[3],'NOTI-01':[3],'AUD-01':[2,3],'DASH-01':[1],
'SEC-01':[1],'SEC-02':[1],'SEC-03':[1,3],
'OPS-02':[],'OPS-03':[1],'UX-01':[1,2,3],'UX-02':[3], 'INT-01':[1,2]
}
blocked={'AUTH-07':'MFA chưa triển khai; khóa admin login production.',
'OPS-01':'Chưa có nơi sao lưu off-site/lịch được duyệt; chỉ có rehearsal local.',
'OPS-04':'Chưa chạy tải 100–500, chưa metrics/alert production.',
'SEC-01':'R2 adapter chưa kiểm chứng kết nối thật; chưa presigned TTL.',
'FILE-01':'Upload hiện qua server; chưa presigned multipart/checksum R2 thực.',
'FILE-04':'Viewer text đã có; PDF fidelity, Office/image/media players chưa hoàn tất.',
'FILE-09':'Worker có fail-closed; scanner/LibreOffice thật chưa cấu hình/kiểm chứng.',
'NOTI-02':'Outbox email tài khoản có encryption/retry; email mọi sự kiện chưa nối đầy đủ.',
'BULK-03':'User cấu hình email sau; chưa gửi email thật.',
'TRASH-03':'Chưa bật scheduler purge; OD retention/legal hold chưa chốt.'}
evidence={
'AUTH':'tests/api.test.js: tài khoản, mật khẩu, khóa và phiên',
'FOLD':'tests/api.test.js: folder CRUD/scope/cycle/subtree; tests/browser/workflows.spec.js: tạo thư mục',
'FILE':'tests/api.test.js: preview/download/upload/version/worker; tests/browser/workflows.spec.js: viewer/upload',
'ACL':'tests/api.test.js: Deny/Allow/expiry/department/scoped endpoints; tests/browser/workflows.spec.js: yêu cầu quyền',
'BULK':'tests/api.test.js: Excel preview, idempotency, encrypted outbox',
'PUB':'tests/api.test.js: publication safety, reviewer membership, self-approval/reject reason',
'META':'server/authz.js + server/index.js: schema inheritance và type validation; browser edit test',
'SEARCH':'tests/api.test.js: private fulltext không rò rỉ; browser search/filter',
'LIFE':'tests/api.test.js: computed lifecycle và date range validation',
'TRASH':'tests/api.test.js: subtree soft delete/restore/version preservation',
'NOTI':'tests/api.test.js: own notifications; browser navigation',
'AUD':'tests/api.test.js: scoped audit; browser audit page',
'DASH':'tests/api.test.js: dashboard scope; browser dashboard data',
'SEC':'tests/api.test.js: direct HTTP negative tests, fail-closed scanner',
'OPS':'tests/api.test.js: backup checksum/integrity/count/ACL restore; browser mobile',
'UX':'tests/browser/workflows.spec.js: role navigation, mobile, error/empty states',
'INT':'server/migrations/001_initial.sql: nullable external_hrm_id; không có automatic sync'}
lines=['# Đối chiếu 63 story / 189 acceptance criteria','',
'Giữ nguyên toàn bộ phạm vi một release. Bản phát triển hiện tại chưa đạt toàn bộ AC và chưa đủ điều kiện production/UAT. “PASS (dev)” chỉ xác nhận phần có assertion hoặc kiểm chứng cụ thể trong môi trường local; không đồng nghĩa một story/release hoàn tất.',
'', 'Ký hiệu: **DEV CHECK PASS** = kiểm chứng local nêu trong evidence; **PARTIAL / CHƯA NGHIỆM THU** = có một phần code nhưng chưa đủ bằng chứng; **BLOCKED** = cần triển khai/dịch vụ/OD còn thiếu. Không gắn PASS cho integration chưa chạy.', '']
report=[]
for s in d['stories']:
 sid=s['id'];prefix=sid.split('-')[0]
 lines += [f"## {sid} — {s['title']}",'',f"BR: {s['br_refs']}. Evidence: `{evidence.get(prefix,'Chưa có')}`.",'']
 if sid in blocked:lines += [f"Giới hạn: {blocked[sid]}",'']
 lines+=['| AC | Trạng thái | Tiêu chí gốc |','|---|---|---|']
 ac=[]
 for i,text in enumerate(s['acceptance_criteria'],1):
  status='DEV CHECK PASS / AC CHƯA NGHIỆM THU' if i in verified.get(sid,[]) else 'BLOCKED' if sid in blocked else 'PARTIAL / CHƯA NGHIỆM THU'
  lines.append(f"| {sid}.{i} | {status} | {text.replace('|','/')} |")
  ac.append({'id':f'{sid}.{i}','status':status,'criterion':text,'evidence':evidence.get(prefix),'limitation':blocked.get(sid)})
 lines+=[''];report.append({'id':sid,'title':s['title'],'release_status':'NOT_ACCEPTED','criteria':ac})
(Path('docs/acceptance-matrix.md')).write_text('\n'.join(lines))
Path('docs/acceptance-status.json').write_text(json.dumps({'note':'Local development evidence only. Not full release acceptance.','stories':report},ensure_ascii=False,indent=2))
print(f"Generated {len(report)} stories / {sum(len(x['criteria']) for x in report)} criteria")
