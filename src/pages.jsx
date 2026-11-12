import React, { useEffect, useState, useRef } from "react";
import { Brand, EducationBrand, DocumentWatermark } from "./brand";
import {
  BookOpen,
  FileText,
  Eye,
  Download,
  HardDrive,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Users,
  Plus,
  Upload,
  Inbox,
  Check,
  X,
  Search,
  RefreshCw,
  Trash2,
  ArrowLeft,
  ExternalLink,
  Link,
  Lock,
  Globe,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronRight,
  Bell,
  Settings,
  CheckCheck,
  AlertTriangle,
  FolderOpen,
  Activity,
  Server,
  Mail,
  Database,
  BarChart3,
  ArrowDownToLine,
} from "lucide-react";
import { api, bytes, date, roleName, pubName } from "./api";
import {
  Button,
  IconButton,
  Modal,
  Field,
  FileIcon,
  AccessBadge,
  Empty,
  Loading,
  Stat,
} from "./ui";
function Heading({
  eyebrow = "KHÔNG GIAN QUẢN TRỊ",
  title,
  description,
  children,
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
function useData(endpoint, version) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    setError("");
    api(endpoint)
      .then((d) => {
        if (current) setData(d);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [endpoint, version]);
  return [data, error];
}
function Failed({ message }) {
  return (
    <div className="error-state">
      <AlertTriangle size={20} />
      {message}
    </div>
  );
}
function RequireLogin({ user, children, setModal }) {
  return user ? (
    children
  ) : (
    <Empty
      icon={Lock}
      title="Không gian dành riêng cho bạn"
      description="Đăng nhập để xem và quản lý nội dung của mình."
    >
      <Button onClick={() => setModal({ kind: "login" })}>Đăng nhập</Button>
    </Empty>
  );
}
export function Dashboard({ user, version, navigate, say }) {
  const [data, error] = useData("/dashboard", version);
  return (
    <>
      <Heading
        title="Bức tranh tri thức"
        description={`Chào ${user?.name?.split(" ").at(-1) || "bạn"}, cùng nhìn lại những kết nối và giá trị được tạo ra.`}
      >
        <Button
          kind="secondary"
          onClick={() => window.location.assign("/api/export")}
        >
          <Download size={16} />
          Xuất báo cáo
        </Button>
      </Heading>
      {error ? (
        <Failed message={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="stats-grid">
            <Stat
              icon={FileText}
              label="Tổng số tài liệu"
              value={data.documents}
              sub="Trong phạm vi kho quản lý"
            />
            <Stat
              icon={Eye}
              label="Lượt xem tài liệu"
              value={data.views}
              sub="Được ghi nhận từ nhật ký"
              color="blue"
            />
            <Stat
              icon={Download}
              label="Lượt tải xuống"
              value={data.downloads}
              sub="Đã kiểm tra quyền tải"
              color="orange"
            />
            <Stat
              icon={ShieldCheck}
              label="Đang chờ phê duyệt"
              value={data.pending}
              sub="Tài liệu cần được xem xét"
              color="purple"
            />
          </div>
          <div className="dashboard-grid">
            <section className="panel activity-chart">
              <div className="panel-heading">
                <div>
                  <h2>Nhịp học tập & chia sẻ</h2>
                  <p>Hoạt động thực tế trong 7 ngày gần nhất</p>
                </div>
                <span className="status-pill green">7 ngày qua</span>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-dot green" />
                  Lượt xem
                </span>
                <span>
                  <i className="legend-dot orange" />
                  Tải lên
                </span>
              </div>
              <div className="bar-chart">
                {data.activity.map((d) => (
                  <div className="bar-day" key={d.date}>
                    <div className="bar-pair">
                      <div
                        title={`${d.views} lượt xem`}
                        className="bar green"
                        style={{
                          height: `${Math.max(2, (d.views / Math.max(1, ...data.activity.map((x) => x.views), ...data.activity.map((x) => x.uploads))) * 145)}px`,
                        }}
                      >
                        <span>{d.views}</span>
                      </div>
                      <div
                        title={`${d.uploads} lượt upload`}
                        className="bar orange"
                        style={{
                          height: `${Math.max(2, (d.uploads / Math.max(1, ...data.activity.map((x) => x.views), ...data.activity.map((x) => x.uploads))) * 145)}px`,
                        }}
                      >
                        <span>{d.uploads}</span>
                      </div>
                    </div>
                    <small>{date(d.date).slice(0, 5)}</small>
                  </div>
                ))}
              </div>
              <div className="chart-footnote">
                Thống kê được tính từ audit trong hệ thống, không bao gồm dữ
                liệu giả lập.
              </div>
            </section>
            <section className="panel storage-panel">
              <div className="panel-heading">
                <div>
                  <h2>Dung lượng lưu trữ</h2>
                  <p>{data.storage_driver}</p>
                </div>
                <HardDrive size={20} />
              </div>
              <div className="storage-total">
                {bytes(data.bytes)}
                <span>/ Ngưỡng cảnh báo {data.threshold} GB</span>
              </div>
              <div className="storage-meter">
                {data.repositories.map((r, i) => (
                  <span
                    key={r.id}
                    className={"segment segment-" + i}
                    style={{
                      width: `${Math.max(3, (r.bytes / Math.max(data.bytes, 1)) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <div className="storage-breakdown">
                {data.repositories.map((r, i) => (
                  <div key={r.id}>
                    <span>
                      <i className={"repo-dot " + r.color} />
                      {r.name}
                    </span>
                    <strong>{bytes(r.bytes)}</strong>
                  </div>
                ))}
              </div>
              <div className="info-box small">
                <ShieldCheck size={16} />
                <span>
                  Cảnh báo dung lượng không chặn upload. Chi phí R2 chưa được
                  kết nối.
                </span>
              </div>
            </section>
          </div>
          <section className="panel mt24">
            <div className="panel-heading">
              <div>
                <h2>Sức khỏe không gian làm việc</h2>
                <p>Các dịch vụ và công việc cần chú ý</p>
              </div>
              <Activity size={20} />
            </div>
            <div className="health-grid">
              <div>
                <span className="health-icon green">
                  <Database size={20} />
                </span>
                <strong>Cơ sở dữ liệu</strong>
                <span className="status-pill green">Đang hoạt động</span>
                <small>Lưu dữ liệu bền vững trên SQLite</small>
              </div>
              <div>
                <span className="health-icon orange">
                  <RefreshCw size={20} />
                </span>
                <strong>Xử lý tài liệu</strong>
                <span className="status-pill orange">
                  {
                    data.processing.filter((j) => j.status !== "completed")
                      .length
                  }{" "}
                  công việc chờ/lỗi
                </span>
                <small>File mới chưa xử lý không được phát hành</small>
              </div>
              <div>
                <span className="health-icon purple">
                  <Mail size={20} />
                </span>
                <strong>Email thông báo</strong>
                <span className="status-pill orange">
                  {data.email_pending ?? "—"} thư chờ gửi
                </span>
                <small>Cần cấu hình nhà cung cấp email</small>
              </div>
              <div>
                <span className="health-icon blue">
                  <ShieldCheck size={20} />
                </span>
                <strong>Sao lưu độc lập</strong>
                <span className="status-pill orange">Chưa cấu hình</span>
                <small>{data.backup_status}</small>
              </div>
            </div>
          </section>
          {data.processing.length > 0 && (
            <section className="panel mt24">
              <div className="panel-heading">
                <h2>Hàng đợi xử lý file</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Công việc</th>
                    <th>Trạng thái</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {data.processing.map((j) => (
                    <tr key={j.id}>
                      <td>{j.document_id.slice(0, 12)}</td>
                      <td>
                        <span className="status-pill orange">{j.status}</span>
                      </td>
                      <td>
                        {j.error || "Đang chờ worker xử lý"}
                        {j.status === "failed" && (
                          <Button
                            kind="text"
                            onClick={async () => {
                              try {
                                await api("/jobs/" + j.id + "/retry", {
                                  method: "POST",
                                });
                                say("Đã đưa công việc vào hàng đợi.");
                                location.reload();
                              } catch (e) {
                                say(e.message, true);
                              }
                            }}
                          >
                            <RefreshCw size={13} />
                            Thử lại
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </>
  );
}
export function Requests({ user, version, act, setModal, say }) {
  const [data, error] = useData("/access-requests", version),
    [filter, setFilter] = useState("all"),
    [decision, setDecision] = useState(null);
  const list = data?.filter((r) => filter === "all" || r.status === filter);
  const decide = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (
      await act(
        () =>
          api("/access-requests/" + decision.id, {
            method: "PATCH",
            body: {
              status: d.status,
              reason: d.reason,
              valid_until: d.valid_until
                ? new Date(d.valid_until).toISOString()
                : null,
              download: d.download === "on",
            },
          }),
        "Đã xử lý yêu cầu truy cập",
      )
    )
      setDecision(null);
  };
  return (
    <RequireLogin user={user} setModal={setModal}>
      <Heading
        title="Kết nối với tri thức"
        description="Theo dõi yêu cầu của bạn và mở cánh cửa cho những người cần tài liệu."
      />
      <div className="page-tabs">
        {[
          ["all", "Tất cả"],
          ["pending", "Đang chờ"],
          ["approved", "Đã chấp thuận"],
          ["rejected", "Đã từ chối"],
        ].map(([v, l]) => (
          <button
            key={v}
            className={filter === v ? "active" : ""}
            onClick={() => setFilter(v)}
          >
            {l}
            <span>
              {data?.filter((r) => v === "all" || r.status === v).length || 0}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <Failed message={error} />
      ) : !data ? (
        <Loading />
      ) : !list.length ? (
        <Empty
          icon={Inbox}
          title="Không có yêu cầu trong mục này"
          description="Các yêu cầu truy cập mới sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="request-list">
          {list.map((r) => (
            <article className="request-card" key={r.id}>
              <span className="request-avatar">
                {r.user_name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(-2)
                  .join("")}
              </span>
              <div className="request-content">
                <div className="request-title">
                  <h3>
                    {r.user_name} <span>muốn truy cập tài liệu</span>
                  </h3>
                  <span
                    className={
                      "status-pill " +
                      { pending: "orange", approved: "green", rejected: "red" }[
                        r.status
                      ]
                    }
                  >
                    {
                      {
                        pending: "Đang chờ",
                        approved: "Đã chấp thuận",
                        rejected: "Đã từ chối",
                      }[r.status]
                    }
                  </span>
                </div>
                <p className="request-doc">
                  <FileText size={16} />
                  {r.document_name}
                </p>
                <blockquote>“{r.reason}”</blockquote>
                <small>
                  {r.email} <span>·</span> {date(r.created_at)}
                  {r.decision_reason && ` · ${r.decision_reason}`}
                </small>
              </div>
              {r.status === "pending" && r.can_review && (
                <Button kind="secondary" onClick={() => setDecision(r)}>
                  Xem xét
                  <ArrowUpRight size={15} />
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
      {decision && (
        <Modal
          title="Xử lý yêu cầu truy cập"
          subtitle={decision.document_name}
          onClose={() => setDecision(null)}
        >
          <form className="form-stack" onSubmit={decide}>
            <p>
              <strong>{decision.user_name}</strong>
              <br />
              <span className="muted">{decision.reason}</span>
            </p>
            <Field label="Quyết định">
              <select name="status">
                <option value="approved">Chấp thuận</option>
                <option value="rejected">Từ chối</option>
              </select>
            </Field>
            <Field label="Thời hạn quyền (trống = vĩnh viễn)">
              <input type="datetime-local" name="valid_until" />
            </Field>
            <label className="checkbox-line">
              <input type="checkbox" name="download" />
              Cấp thêm quyền DOWNLOAD (vẫn tuân theo chính sách file)
            </label>
            <Field label="Ghi chú / Lý do">
              <textarea name="reason" rows={3} />
            </Field>
            <p className="info-box">
              Deny đang áp dụng vẫn có hiệu lực sau khi chấp thuận.
            </p>
            <div className="modal-footer">
              <Button
                kind="secondary"
                type="button"
                onClick={() => setDecision(null)}
              >
                Hủy
              </Button>
              <Button type="submit">Lưu quyết định</Button>
            </div>
          </form>
        </Modal>
      )}
    </RequireLogin>
  );
}
export function Approvals({ version, act, openDoc }) {
  const [data, error] = useData("/approvals", version),
    [decision, setDecision] = useState(null),
    [filter, setFilter] = useState("pending");
  return (
    <>
      <Heading
        title="Đưa tri thức đến mọi người"
        description="Xem xét nội dung và đảm bảo chất lượng trước khi xuất bản."
      />
      <div className="page-tabs">
        {[
          ["pending", "Chờ phê duyệt"],
          ["all", "Tất cả lịch sử"],
        ].map(([v, l]) => (
          <button
            className={filter === v ? "active" : ""}
            key={v}
            onClick={() => setFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>
      {error ? (
        <Failed message={error} />
      ) : !data ? (
        <Loading />
      ) : !data.filter((a) => filter === "all" || a.status === filter)
          .length ? (
        <Empty
          icon={ShieldCheck}
          title="Mọi tài liệu đã được xem xét"
          description="Khi có tài liệu chờ duyệt, bạn sẽ tìm thấy chúng ở đây."
        />
      ) : (
        <div className="request-list">
          {data
            .filter((a) => filter === "all" || a.status === filter)
            .map((a) => (
              <article className="request-card" key={a.id}>
                <FileIcon type="DOCX" large />
                <div className="request-content">
                  <h3>{a.document_name}</h3>
                  <p className="muted">
                    Gửi bởi {a.requester_name} · {date(a.created_at)}
                  </p>
                  <span
                    className={`status-pill ${a.status === "pending" ? "orange" : a.status === "approved" ? "green" : "red"}`}
                  >
                    {a.status === "pending"
                      ? "Chờ phê duyệt"
                      : a.status === "approved"
                        ? "Đã duyệt"
                        : "Đã từ chối"}
                  </span>
                  {a.reason && <p>{a.reason}</p>}
                </div>
                <div className="inline-actions">
                  <Button
                    kind="secondary"
                    onClick={() =>
                      openDoc({ id: a.document_id, name: a.document_name })
                    }
                  >
                    <Eye size={15} />
                    Xem
                  </Button>
                  {a.can_approve && a.status === "pending" && (
                    <Button onClick={() => setDecision(a)}>
                      Phê duyệt
                      <Check size={15} />
                    </Button>
                  )}
                </div>
              </article>
            ))}
        </div>
      )}
      {decision && (
        <Modal
          title="Quyết định phê duyệt"
          subtitle={decision.document_name}
          onClose={() => setDecision(null)}
        >
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.target));
              if (
                await act(
                  () =>
                    api("/approvals/" + decision.id, { method: "PATCH", body }),
                  "Đã lưu kết quả phê duyệt",
                )
              )
                setDecision(null);
            }}
          >
            <Field label="Kết quả">
              <select name="status">
                <option value="approved">Duyệt & xuất bản</option>
                <option value="rejected">Từ chối</option>
              </select>
            </Field>
            <Field label="Ghi chú (bắt buộc khi từ chối)">
              <textarea name="reason" rows={4} />
            </Field>
            <div className="modal-footer">
              <Button
                kind="secondary"
                type="button"
                onClick={() => setDecision(null)}
              >
                Hủy
              </Button>
              <Button type="submit">Xác nhận</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function People({ user, version, act, setModal }) {
  const [data, error] = useData("/users", version),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState(null);
  const list = data?.filter((u) =>
    `${u.name} ${u.email} ${u.department}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <>
      <Heading
        title={
          user?.role === "BOOK_ADMIN"
            ? "Cộng đồng Bacnhabook"
            : user?.role === "HR_ADMIN"
              ? "Quản lý nhân viên nội bộ"
              : "Những người cùng đồng hành"
        }
        description="Quản lý tài khoản, phòng ban và quyền vận hành."
      >
        {["SUPER_ADMIN", "BOOK_ADMIN"].includes(user?.role) && (
          <Button kind="secondary" onClick={() => setModal({ kind: "import" })}>
            <Upload size={16} />
            Nhập Excel
          </Button>
        )}
        {["SUPER_ADMIN", "BOOK_ADMIN", "HR_ADMIN"].includes(user?.role) && (
          <Button onClick={() => setModal({ kind: "user" })}>
            <Plus size={16} />
            Thêm tài khoản
          </Button>
        )}
      </Heading>
      <div className="panel">
        <div className="panel-heading">
          <h2>
            Danh sách tài khoản{" "}
            <span className="count-pill">{list?.length || 0}</span>
          </h2>
          <div className="input-search">
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tên hoặc email…"
            />
          </div>
        </div>
        {error ? (
          <Failed message={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <div className="table-scroll">
            <table className="data-table people-table">
              <thead>
                <tr>
                  <th>NGƯỜI DÙNG</th>
                  <th>VAI TRÒ</th>
                  <th>PHÒNG BAN</th>
                  <th>TRẠNG THÁI</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="person-cell">
                        <span className="avatar">
                          {u.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(-2)
                            .join("")}
                        </span>
                        <div>
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">{roleName[u.role]}</span>
                    </td>
                    <td>{u.department || "—"}</td>
                    <td>
                      <span
                        className={
                          "status-pill " +
                          (u.status === "active" ? "green" : "red")
                        }
                      >
                        <i />
                        {u.status === "active" ? "Hoạt động" : "Đã khóa"}
                      </span>
                      {u.must_change && (
                        <small className="must-change">Chờ đổi mật khẩu</small>
                      )}
                    </td>
                    <td>
                      {u.id !== user?.id &&
                        (user?.role === "SUPER_ADMIN" ||
                          user?.role === "HR_ADMIN" ||
                          user?.role === "BOOK_ADMIN") && (
                          <div className="inline-actions">
                            <Button kind="text" onClick={() => setEditing(u)}>
                              Chỉnh sửa
                            </Button>
                            <IconButton
                              label={
                                u.status === "active"
                                  ? "Khóa tài khoản"
                                  : "Mở khóa tài khoản"
                              }
                              onClick={() =>
                                act(
                                  () =>
                                    api("/users/" + u.id, {
                                      method: "PATCH",
                                      body: {
                                        status:
                                          u.status === "active"
                                            ? "locked"
                                            : "active",
                                      },
                                    }),
                                  "Đã cập nhật trạng thái tài khoản",
                                )
                              }
                            >
                              <Lock size={15} />
                            </IconButton>
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && (
        <Modal
          title="Cập nhật tài khoản"
          subtitle={editing.email}
          onClose={() => setEditing(null)}
        >
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.target));
              if (
                await act(
                  () => api("/users/" + editing.id, { method: "PATCH", body }),
                  "Đã cập nhật tài khoản và thu hồi phiên cũ",
                )
              )
                setEditing(null);
            }}
          >
            <Field label="Phòng ban">
              <input name="department" defaultValue={editing.department} />
            </Field>
            {user?.role === "SUPER_ADMIN" && (
              <>
                <Field label="Vai trò">
                  <select name="role" defaultValue={editing.role}>
                    {Object.entries(roleName).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Phạm vi kho (phân cách dấu phẩy)">
                  <input
                    name="scope"
                    defaultValue={editing.scope}
                    placeholder="books,marketing"
                  />
                </Field>
              </>
            )}
            <div className="modal-footer">
              <Button
                kind="secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                Hủy
              </Button>
              <Button type="submit">Lưu tài khoản</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
const eventNames = {
  DOCUMENT_CREATED: "Tạo tài liệu",
  DOCUMENT_UPLOADED: "Tải tài liệu lên",
  DOCUMENT_VIEWED: "Xem tài liệu",
  DOCUMENT_DOWNLOADED: "Tải tài liệu xuống",
  DOCUMENT_UPDATED: "Cập nhật thông tin",
  DOCUMENT_DELETED: "Xóa tài liệu",
  DOCUMENT_RESTORED: "Khôi phục tài liệu",
  GRANT_CREATED: "Cấp quyền",
  GRANT_REVOKED: "Thu hồi quyền",
  PREVIEW_DENIED: "Từ chối xem",
  DOWNLOAD_DENIED: "Từ chối tải",
  LOGIN: "Đăng nhập",
  DEMO_LOGIN: "Đăng nhập trải nghiệm",
  USER_CREATED: "Tạo tài khoản",
  USER_UPDATED: "Cập nhật tài khoản",
  ACCESS_REQUESTED: "Yêu cầu truy cập",
  ACCESS_REQUEST_DECIDED: "Xử lý yêu cầu",
  APPROVAL_DECIDED: "Phê duyệt tài liệu",
  FOLDER_CREATED: "Tạo thư mục",
  SETTINGS_UPDATED: "Cập nhật cài đặt",
  PUBLICATION_CHANGED: "Đổi trạng thái xuất bản",
};
export function Audit({ version }) {
  const [q, setQ] = useState("");
  const [data, error] = useData("/audit?q=" + encodeURIComponent(q), version);
  return (
    <>
      <Heading
        title="Mỗi thay đổi, một dấu vết"
        description="Nhật ký minh bạch về hoạt động trong phạm vi quản lý của bạn."
      >
        <Button kind="secondary" onClick={() => location.assign("/api/export")}>
          <Download size={16} />
          Xuất CSV
        </Button>
      </Heading>
      <div className="panel">
        <div className="panel-heading">
          <h2>Nhật ký hoạt động</h2>
          <div className="input-search">
            <Search size={16} />
            <input
              placeholder="Tìm hoạt động…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        {error ? (
          <Failed message={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <div className="table-scroll">
            <table className="data-table audit-table">
              <thead>
                <tr>
                  <th>THỜI GIAN</th>
                  <th>NGƯỜI THỰC HIỆN</th>
                  <th>HOẠT ĐỘNG</th>
                  <th>ĐỐI TƯỢNG</th>
                  <th>KẾT QUẢ</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <span>{date(e.created_at)}</span>
                      <small>
                        {new Date(e.created_at).toLocaleTimeString("vi-VN")}
                      </small>
                    </td>
                    <td>{e.actor_name}</td>
                    <td>{eventNames[e.action] || e.action}</td>
                    <td className="audit-target">
                      {e.target_name || "Hệ thống"}
                    </td>
                    <td>
                      <span
                        className={
                          "status-pill " +
                          (e.outcome === "success" ? "green" : "red")
                        }
                      >
                        {e.outcome === "success" ? "Thành công" : "Từ chối"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.length && <Empty title="Chưa có hoạt động phù hợp" />}
          </div>
        )}
      </div>
      <p className="page-note">
        <ShieldCheck size={15} />
        Nhật ký không có chức năng chỉnh sửa hoặc xóa qua giao diện quản trị.
      </p>
    </>
  );
}
export function Trash({ version, act }) {
  const [data, error] = useData("/trash", version);
  return (
    <>
      <Heading
        title="Một cơ hội để tìm lại"
        description="Khôi phục những tài liệu và thư mục đã xóa trong phạm vi của bạn."
      />
      <div className="info-box mb24">
        <Trash2 size={18} />
        <span>
          Xóa tài liệu chỉ ẩn khỏi thư viện. Tự động xóa vĩnh viễn đang tắt cho
          đến khi chính sách lưu giữ và pháp lý được xác nhận.
        </span>
      </div>
      {error ? (
        <Failed message={error} />
      ) : !data ? (
        <Loading />
      ) : !data.length ? (
        <Empty
          icon={Trash2}
          title="Thùng rác đang trống"
          description="Những tài liệu đã xóa sẽ được lưu tạm ở đây."
        />
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TÀI LIỆU / THƯ MỤC</th>
                  <th>NGÀY XÓA</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="person-cell">
                        {item.kind === "folder" ? (
                          <FolderOpen size={25} />
                        ) : (
                          <FileIcon type={item.type} />
                        )}
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td>{date(item.deleted_at)}</td>
                    <td>
                      <Button
                        kind="secondary"
                        onClick={() =>
                          act(
                            () =>
                              api(
                                `/${item.kind === "folder" ? "folders" : "documents"}/${item.id}/restore`,
                                { method: "POST" },
                              ),
                            "Đã khôi phục nội dung",
                          )
                        }
                      >
                        <RefreshCw size={15} />
                        Khôi phục
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
export function SettingsPage({ version, act }) {
  const [data, error] = useData("/settings", version),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const v = Object.fromEntries(new FormData(e.target));
    await act(
      () =>
        api("/settings", {
          method: "PUT",
          body: {
            idle_minutes: Number(v.idle_minutes),
            max_sessions: Number(v.max_sessions),
            storage_alert_gb: Number(v.storage_alert_gb),
            retention_days: v.retention_days ? Number(v.retention_days) : null,
          },
        }),
      "Đã lưu cấu hình hệ thống",
    );
    setBusy(false);
  };
  return (
    <>
      <Heading
        title="Một nền tảng vững vàng"
        description="Cấu hình bảo mật, lưu trữ và các dịch vụ của không gian làm việc."
      />
      {error ? (
        <Failed message={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <section className="integrations-grid">
            {[
              [
                HardDrive,
                "Cloudflare R2",
                data.r2_configured,
                "Lưu trữ riêng tư cho bản gốc và bản xem trước",
              ],
              [
                Mail,
                "Email thông báo",
                data.email_configured,
                "Gửi thư tài khoản, quyền và phê duyệt",
              ],
              [
                ShieldCheck,
                "Quét an toàn",
                data.scanner_configured,
                "Kiểm tra file trước khi phát hành",
              ],
              [
                Database,
                "Sao lưu độc lập",
                data.backup_configured,
                "Cấu hình nơi lưu khác với kho chính",
              ],
            ].map(([Icon, title, configured, description]) => (
              <div className="integration-card" key={title}>
                <span className="integration-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span
                  className={"status-pill " + (configured ? "green" : "orange")}
                >
                  {configured
                    ? "Đã có cấu hình · cần kiểm chứng"
                    : "Chưa cấu hình"}
                </span>
              </div>
            ))}
          </section>
          <div className="info-box mt24">
            <Settings size={18} />
            <span>
              Các khóa dịch vụ được cấu hình qua biến môi trường của máy chủ.
              Không nhập khóa bí mật vào trình duyệt hoặc mã nguồn. Hiện dùng{" "}
              {data.storage_driver === "local"
                ? "lưu trữ cục bộ cho bản trải nghiệm"
                : "R2"}
              .
            </span>
          </div>
          <form className="panel settings-form mt24" onSubmit={submit}>
            <div className="panel-heading">
              <div>
                <h2>Bảo mật phiên & chính sách lưu trữ</h2>
                <p>
                  Các giá trị khởi đầu dành cho bản thử nghiệm, chưa phải tham
                  số production đã duyệt.
                </p>
              </div>
            </div>
            <div className="settings-fields">
              <div className="form-row">
                <Field
                  label="Thời gian không hoạt động (phút)"
                  hint="Phiên quá hạn sẽ bị yêu cầu đăng nhập lại."
                >
                  <input
                    type="number"
                    name="idle_minutes"
                    min={5}
                    max={1440}
                    defaultValue={data.idle_minutes}
                    required
                  />
                </Field>
                <Field
                  label="Số phiên đăng nhập tối đa"
                  hint="Khi đạt giới hạn, yêu cầu đăng nhập mới bị từ chối."
                >
                  <input
                    type="number"
                    name="max_sessions"
                    min={1}
                    max={20}
                    defaultValue={data.max_sessions}
                    required
                  />
                </Field>
              </div>
              <div className="form-row">
                <Field
                  label="Ngưỡng cảnh báo dung lượng (GB)"
                  hint="Cảnh báo không chặn upload tài liệu."
                >
                  <input
                    type="number"
                    name="storage_alert_gb"
                    step="0.001"
                    min="0.001"
                    defaultValue={data.storage_alert_gb}
                    required
                  />
                </Field>
                <Field
                  label="Lưu thùng rác (ngày)"
                  hint="Để trống khi chính sách chưa chốt. Tự động purge chưa được bật."
                >
                  <input
                    type="number"
                    name="retention_days"
                    min={1}
                    max={3650}
                    defaultValue={data.retention_days || ""}
                    placeholder="Chưa chốt"
                  />
                </Field>
              </div>
            </div>
            <div className="panel-form-footer">
              <Button type="submit" busy={busy}>
                Lưu cấu hình
              </Button>
            </div>
          </form>
          <div className="panel mt24">
            <div className="panel-heading">
              <div>
                <h2>Sẵn sàng đưa vào vận hành</h2>
                <p>
                  Những kiểm chứng cần thực hiện khi bạn kết nối dịch vụ thật.
                </p>
              </div>
            </div>
            <div className="setup-checklist">
              {[
                "Xác nhận các quyết định OD-01 đến OD-15 trong tài liệu nghiệp vụ.",
                "Kết nối R2 private, kiểm tra upload và đọc object theo quyền.",
                "Kết nối email, kiểm thử gửi thật và khôi phục mật khẩu.",
                "Cấu hình MFA quản trị; đăng nhập admin production hiện bị khóa an toàn.",
                "Kết nối scanner và công cụ chuyển đổi PDF/Office/media.",
                "Di chuyển lên PostgreSQL và hàng đợi phân tán trước khi kiểm thử tải 500 người.",
                "Nghiệm thu khôi phục DB + objects từ nơi sao lưu độc lập.",
              ].map((s, i) => (
                <div key={s}>
                  <span>{i + 1}</span>
                  <p>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
export function Notifications({ user, version, act, navigate, setModal }) {
  const [data, error] = useData("/notifications", version);
  return (
    <RequireLogin user={user} setModal={setModal}>
      <Heading
        title="Những kết nối mới"
        description="Cập nhật quyền truy cập, tài liệu và những điều cần bạn quan tâm."
      >
        <Button
          kind="secondary"
          onClick={() =>
            act(
              () => api("/notifications/read", { method: "PATCH" }),
              "Đã đánh dấu tất cả đã đọc",
            )
          }
        >
          <CheckCheck size={16} />
          Đánh dấu đã đọc
        </Button>
      </Heading>
      {error ? (
        <Failed message={error} />
      ) : !data ? (
        <Loading />
      ) : !data.length ? (
        <Empty
          icon={Bell}
          title="Bạn đã nắm bắt mọi thông tin"
          description="Thông báo mới sẽ xuất hiện ở đây."
        />
      ) : (
        <section className="panel notifications-page">
          {data.map((n) => (
            <button
              key={n.id}
              className={`notification-item ${!n.read_at ? "unread" : ""}`}
              onClick={() => {
                act(() => api("/notifications/read", { method: "PATCH" }));
                if (n.document_id) navigate("/library/files/" + n.document_id);
              }}
            >
              <span className="notification-item-icon">
                <Bell size={19} />
              </span>
              <span>
                <strong>{n.title}</strong>
                <small>{n.message}</small>
              </span>
              <time>{date(n.created_at)}</time>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
      )}
    </RequireLogin>
  );
}
export function Viewer({
  documentId,
  user,
  compact = false,
  onFull,
  onBack,
  setModal,
  say,
  act,
  version,
}) {
  const [document, setDocument] = useState(null),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [zoom, setZoom] = useState(100),
    [request, setRequest] = useState(false),
    [processing, setProcessing] = useState(false);
  const area = useRef();
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    setPreview(null);
    setDocument(null);
    setProcessing(false);
    (async () => {
      try {
        const d = await api("/documents/" + documentId);
        if (!current) return;
        setDocument(d);
        const p = await api("/documents/" + documentId + "/preview");
        if (current) setPreview(p);
      } catch (e) {
        if (current) {
          setError(e.message);
          setProcessing(e.code === "PROCESSING");
        }
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [documentId, user, version]);
  const copy = () =>
    navigator.clipboard
      .writeText(location.origin + "/library/files/" + documentId)
      .then(() => say("Đã sao chép liên kết."))
      .catch(() => say("Không thể sao chép liên kết.", true));
  const full = () => {
    if (!area.current) return;
    if (window.document.fullscreenElement) window.document.exitFullscreen?.();
    else
      area.current
        .requestFullscreen?.()
        .catch(() => say("Trình duyệt không hỗ trợ toàn màn hình.", true));
  };
  return (
    <div className={`viewer ${compact ? "compact" : ""}`}>
      {!compact && (
        <>
          <Button kind="text" onClick={onBack}>
            <ArrowLeft size={15} />
            Trở về thư viện
          </Button>
          <div className="viewer-heading">
            <div>
              <div className="eyebrow">BACNHABOOK · KHÔNG GIAN TRI THỨC</div>
              <h1>{document?.name || "Tài liệu"}</h1>
            </div>
            <Button kind="secondary" onClick={copy}>
              <Link size={15} />
              Sao chép liên kết
            </Button>
          </div>
        </>
      )}
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="viewer-toolbar">
            <div>
              <FileIcon type={document?.type} />
              {document && <AccessBadge access={document.access} />}
              <span className="viewer-version">
                {document?.version ? "Phiên bản " + document.version : ""}
              </span>
            </div>
            <div>
              <IconButton
                label="Thu nhỏ"
                onClick={() => setZoom(Math.max(70, zoom - 10))}
              >
                <ZoomOut size={17} />
              </IconButton>
              <span className="zoom-label">{zoom}%</span>
              <IconButton
                label="Phóng to"
                onClick={() => setZoom(Math.min(160, zoom + 10))}
              >
                <ZoomIn size={17} />
              </IconButton>
              <IconButton label="Toàn màn hình" onClick={full}>
                <Maximize size={17} />
              </IconButton>
              {compact && (
                <IconButton label="Mở trang tài liệu" onClick={onFull}>
                  <ExternalLink size={17} />
                </IconButton>
              )}
              {document?.can_download && (
                <a
                  className="button primary"
                  href={"/api/documents/" + documentId + "/download"}
                >
                  <Download size={15} />
                  Tải xuống
                </a>
              )}
            </div>
          </div>
          {document?.lifecycle === "EXPIRED" && (
            <div className="error-box">
              Tài liệu đã hết hiệu lực.
              {document.replacement_id && (
                <button
                  className="text-link"
                  onClick={() =>
                    location.assign("/library/files/" + document.replacement_id)
                  }
                >
                  Xem tài liệu thay thế
                </button>
              )}
            </div>
          )}
          {error ? (
            <div className="viewer-empty">
              <span className="lock-illustration">
                {processing ? <Clock size={37} /> : <Lock size={37} />}
              </span>
              <span className="eyebrow">
                {processing
                  ? "NỘI DUNG ĐANG ĐƯỢC CHUẨN BỊ"
                  : "TRI THỨC CẦN ĐƯỢC SẺ CHIA ĐÚNG NGƯỜI"}
              </span>
              <h2>
                {processing
                  ? "Chưa có bản xem trước"
                  : document?.can_view
                    ? "Không thể mở tài liệu"
                    : "Bạn chưa có quyền truy cập"}
              </h2>
              <p>{error}</p>
              {!processing &&
                document &&
                !document.can_view &&
                (user ? (
                  <Button onClick={() => setRequest(true)}>
                    <Send size={16} />
                    Gửi yêu cầu truy cập
                  </Button>
                ) : (
                  <Button onClick={() => setModal({ kind: "login" })}>
                    Đăng nhập để gửi yêu cầu
                  </Button>
                ))}
              {processing && document?.can_manage && (
                <p className="muted small-text">
                  Kiểm tra hàng đợi và cấu hình scanner trong trang Tổng quan.
                </p>
              )}
            </div>
          ) : (
            preview && (
              <div className="viewer-canvas" ref={area}>
                <article
                  className="preview-paper"
                  style={{ fontSize: zoom + "%" }}
                >
                  {preview.watermark_enabled && (
                    <div className="preview-paper-brand">
                      <Brand compact />
                      <EducationBrand />
                    </div>
                  )}
                  <div className="paper-rule" />
                  <h2>{preview.content.split("\n")[0]}</h2>
                  <div className="preview-text">
                    {preview.content
                      .split("\n")
                      .slice(1)
                      .map((line, i) =>
                        line.trim() ? (
                          <p key={i}>{line}</p>
                        ) : (
                          <div className="paragraph-space" key={i} />
                        ),
                      )}
                  </div>
                  {preview.watermark_enabled && (
                    <div className="paper-footer">
                      BÁC NHÃ BOOKS · THANHMAIHSK · {preview.watermark}
                    </div>
                  )}
                  {preview.watermark_enabled && (
                    <DocumentWatermark identity={preview.watermark} />
                  )}
                </article>
              </div>
            )
          )}
          {document?.can_view && (
            <div className="viewer-detail">
              <div>
                <h3>Về tài liệu này</h3>
                <p>{document.description}</p>
                <div className="metadata-chips">
                  {Object.entries(document.metadata || {}).map(([k, v]) => (
                    <span key={k}>
                      {k}: <strong>{String(v)}</strong>
                    </span>
                  ))}
                </div>
                <p className="small-text muted">
                  Cập nhật {date(document.updated_at)} · {bytes(document.size)}{" "}
                  · {pubName[document.publication]}
                </p>
              </div>
              {document.can_manage && (
                <div className="viewer-admin">
                  <Button
                    kind="secondary"
                    onClick={() => setModal({ kind: "edit", doc: document })}
                  >
                    <Settings size={15} />
                    Thông tin
                  </Button>
                  <Button
                    kind="secondary"
                    onClick={() =>
                      setModal({ kind: "permission", doc: document })
                    }
                  >
                    <ShieldCheck size={15} />
                    Quyền
                  </Button>
                  <Button
                    kind="secondary"
                    onClick={() =>
                      setModal({ kind: "versions", doc: document })
                    }
                  >
                    <Clock size={15} />
                    Phiên bản
                  </Button>
                  {document.publication !== "PUBLISHED" && (
                    <>
                      <Button
                        kind="secondary"
                        onClick={() =>
                          act(
                            () =>
                              api("/documents/" + documentId + "/publication", {
                                method: "POST",
                                body: { action: "submit" },
                              }),
                            "Đã gửi phê duyệt",
                          )
                        }
                      >
                        Gửi duyệt
                      </Button>
                      <Button
                        onClick={() =>
                          act(
                            () =>
                              api("/documents/" + documentId + "/publication", {
                                method: "POST",
                                body: { action: "publish" },
                              }),
                            "Đã xuất bản tài liệu",
                          )
                        }
                      >
                        Xuất bản
                      </Button>
                    </>
                  )}
                  {document.publication === "PUBLISHED" && (
                    <Button
                      kind="text"
                      onClick={() =>
                        act(
                          () =>
                            api("/documents/" + documentId + "/publication", {
                              method: "POST",
                              body: { action: "draft" },
                            }),
                          "Đã chuyển về bản nháp",
                        )
                      }
                    >
                      Gỡ xuất bản
                    </Button>
                  )}
                  <a
                    className="text-link"
                    href={"/api/documents/" + documentId + "/original"}
                  >
                    Tải bản gốc để sửa offline
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {request && (
        <Modal
          title="Gửi yêu cầu truy cập"
          subtitle={document?.name}
          onClose={() => setRequest(false)}
        >
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const reason = new FormData(e.target).get("reason");
              if (
                await act(
                  () =>
                    api("/documents/" + documentId + "/access-requests", {
                      method: "POST",
                      body: { reason },
                    }),
                  "Đã gửi yêu cầu đến người quản lý kho",
                )
              )
                setRequest(false);
            }}
          >
            <Field label="Vì sao bạn cần tài liệu này?">
              <textarea
                name="reason"
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                placeholder="Chia sẻ mục đích sử dụng để người quản lý xem xét…"
              />
            </Field>
            <p className="muted small-text">
              Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.
            </p>
            <div className="modal-footer">
              <Button
                kind="secondary"
                type="button"
                onClick={() => setRequest(false)}
              >
                Hủy
              </Button>
              <Button type="submit">
                <Send size={15} />
                Gửi yêu cầu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
