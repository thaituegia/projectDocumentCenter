import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FolderOpen,
  FileText,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Download,
  RefreshCw,
  Clock,
  Users,
  FolderUp,
  LoaderCircle,
} from "lucide-react";
import { api, date, bytes, roleName } from "./api";
import { Button, Modal, Field, Empty, Loading, FileIcon } from "./ui";
export function LoginDialog({
  mode: initial = "login",
  onAuthenticated,
  say,
  development,
  switchRole,
  inline = false,
  user,
}) {
  const [mode, setMode] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const d = Object.fromEntries(new FormData(e.target));
    try {
      if (mode === "forgot") {
        const result = await api("/auth/forgot-password", {
          method: "POST",
          body: { email: d.email },
        });
        setDone(result.message);
      } else if (mode === "reset") {
        await api("/auth/reset-password", {
          method: "POST",
          body: {
            password: d.password,
            token: new URLSearchParams(location.search).get("token"),
          },
        });
        setDone("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập.");
        setMode("login");
      } else if (mode === "password") {
        const me = await api("/auth/change-password", {
          method: "POST",
          body: { password: d.password, current_password: d.current_password },
        });
        onAuthenticated(me);
      } else
        onAuthenticated(await api("/auth/login", { method: "POST", body: d }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={inline ? "auth-inline" : ""}>
      {inline && (
        <>
          <span className="auth-brand">
            <ShieldCheck size={28} />
          </span>
          <h2>
            {mode === "password"
              ? "Đổi mật khẩu của bạn"
              : mode === "forgot"
                ? "Khôi phục mật khẩu"
                : "Chào mừng đến với Bacnhabook"}
          </h2>
          <p className="muted">
            {mode === "password"
              ? "Mật khẩu gồm tối thiểu 12 ký tự, có chữ hoa, chữ thường và số."
              : "Một tài khoản, mở ra cả thế giới tri thức."}
          </p>
        </>
      )}
      <form onSubmit={submit} className="form-stack">
        {mode === "password" ? (
          <Field label="Mật khẩu hiện tại">
            <input
              type="password"
              name="current_password"
              autoComplete="current-password"
              required
            />
          </Field>
        ) : (
          mode !== "reset" && (
            <Field label="Địa chỉ email">
              <input
                type="email"
                name="email"
                placeholder="ban@congty.vn"
                autoComplete="username"
                required
              />
            </Field>
          )
        )}
        {mode !== "forgot" && (
          <Field
            label={
              mode === "password" || mode === "reset"
                ? "Mật khẩu mới"
                : "Mật khẩu"
            }
            hint={
              mode === "password" || mode === "reset"
                ? "Ít nhất 12 ký tự, gồm chữ hoa, chữ thường và số."
                : null
            }
          >
            <input
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? 1 : 12}
              required
            />
          </Field>
        )}
        {mode === "login" && (
          <button
            type="button"
            className="text-link align-right"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
          >
            Quên mật khẩu?
          </button>
        )}
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        {done && <div className="success-box">{done}</div>}
        <Button type="submit" busy={busy}>
          {mode === "forgot"
            ? "Gửi hướng dẫn khôi phục"
            : mode === "password" || mode === "reset"
              ? "Lưu mật khẩu mới"
              : "Đăng nhập"}
          <ArrowRight size={16} />
        </Button>
        {mode === "forgot" && (
          <Button
            kind="text"
            type="button"
            onClick={() => {
              setMode("login");
              setDone("");
            }}
          >
            Quay lại đăng nhập
          </Button>
        )}
      </form>
      {development && (
        <div className="demo-login">
          <span>KHÔNG GIAN TRẢI NGHIỆM</span>
          <p>Khám phá bằng tài khoản minh họa, không cần nhập mật khẩu.</p>
          <div>
            <Button kind="secondary" onClick={() => switchRole("admin")}>
              Quản trị viên
            </Button>
            <Button kind="secondary" onClick={() => switchRole("customer")}>
              Khách hàng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export function FolderDialog({
  repoId,
  parentId,
  folders,
  repositories,
  act,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.target));
    if (
      await act(
        () =>
          api("/folders", {
            method: "POST",
            body: {
              ...d,
              repository_id: repoId,
              parent_id: d.parent_id || null,
            },
          }),
        "Đã tạo thư mục mới",
      )
    )
      onClose();
    setBusy(false);
  };
  return (
    <Modal
      title="Tạo thư mục mới"
      subtitle="Sắp xếp tri thức theo cách của bạn."
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        <Field label="Tên thư mục">
          <input
            name="name"
            placeholder="Ví dụ: HSK 1 – Bài tập bổ trợ"
            required
            maxLength={160}
            autoFocus
          />
        </Field>
        <Field label="Vị trí">
          <select name="parent_id" defaultValue={parentId || ""}>
            <option value="">
              {repositories.find((r) => r.id === repoId)?.name} / Thư mục gốc
            </option>
            {folders
              .filter((f) => f.repository_id === repoId)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Mô tả">
          <textarea
            name="description"
            rows={3}
            placeholder="Giới thiệu ngắn về nội dung thư mục…"
          />
        </Field>
        <div className="modal-footer">
          <Button kind="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" busy={busy}>
            <Plus size={16} />
            Tạo thư mục
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function UploadDialog({
  folderId,
  repoId,
  folders,
  act,
  say,
  refresh,
  onClose,
}) {
  const [files, setFiles] = useState([]),
    [destination, setDestination] = useState(
      folderId || folders.find((f) => f.repository_id === repoId)?.id || "",
    ),
    [busy, setBusy] = useState(false),
    [results, setResults] = useState(null),
    [progress, setProgress] = useState(0);
  const input = useRef(),
    folderInput = useRef();
  const upload = async (e) => {
    e.preventDefault();
    if (!files.length) return say("Hãy chọn ít nhất một tài liệu.", true);
    setBusy(true);
    setProgress(10);
    const f = new FormData(e.target);
    f.set("folder_id", destination);
    f.set(
      "paths",
      JSON.stringify(files.map((file) => file.webkitRelativePath || file.name)),
    );
    files.forEach((file) => f.append("files", file));
    try {
      setProgress(35);
      const result = await api("/uploads", { method: "POST", body: f });
      setResults(result.items);
      setProgress(100);
      refresh();
      say("Đã nhận tài liệu. Các file sẽ được kiểm tra trước khi phát hành.");
    } catch (e) {
      say(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Thêm tri thức vào thư viện"
      subtitle="Tải tài liệu hoặc cả thư mục, giữ nguyên cấu trúc."
      onClose={onClose}
      wide
    >
      <form onSubmit={upload} className="form-stack">
        <div
          className="upload-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFiles([...e.dataTransfer.files]);
          }}
        >
          <span className="upload-circle">
            <Upload size={27} />
          </span>
          <h3>Kéo thả tài liệu vào đây</h3>
          <p>Mọi định dạng đều được tiếp nhận để kiểm tra an toàn</p>
          <div>
            <Button
              kind="secondary"
              type="button"
              onClick={() => input.current.click()}
            >
              <FileText size={16} />
              Chọn tài liệu
            </Button>
            <Button
              kind="secondary"
              type="button"
              onClick={() => folderInput.current.click()}
            >
              <FolderUp size={16} />
              Chọn thư mục
            </Button>
          </div>
          <small>
            Giới hạn kỹ thuật bản chạy thử: 50 file/lần, 100 MB/file
          </small>
          <input
            ref={input}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              setFiles([...e.target.files]);
              setResults(null);
            }}
          />
          <input
            ref={folderInput}
            type="file"
            multiple
            webkitdirectory=""
            directory=""
            hidden
            onChange={(e) => {
              setFiles([...e.target.files]);
              setResults(null);
            }}
          />
        </div>
        {files.length > 0 && (
          <div className="upload-file-list">
            {files.map((f, i) => (
              <div key={i}>
                <FileText size={17} />
                <span>
                  {f.webkitRelativePath || f.name}
                  <small>{bytes(f.size)}</small>
                </span>
                {results?.[i] ? (
                  <span
                    className={
                      results[i].status === "failed" ? "danger-text" : "muted"
                    }
                  >
                    {results[i].error || "Chờ kiểm tra"}
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={"Bỏ " + f.name}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="form-row">
          <Field label="Thư mục đích">
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            >
              {folders
                .filter((f) => f.repository_id === repoId && f.can_manage)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Quyền truy cập">
            <select name="access">
              <option value="PRIVATE">Riêng tư – cần được cấp quyền</option>
              <option value="PUBLIC">Công khai</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Sau khi xử lý an toàn">
            <select name="publication">
              <option value="DRAFT">Lưu bản nháp</option>
              <option value="PENDING_APPROVAL">Gửi phê duyệt</option>
              <option value="PUBLISHED">Xuất bản ngay</option>
            </select>
          </Field>
          <Field label="Tải xuống">
            <select name="downloadable">
              <option value="false">Chỉ xem, không cho tải</option>
              <option value="true">Cho tải khi có quyền DOWNLOAD</option>
            </select>
          </Field>
        </div>
        <div className="info-box">
          <ShieldCheck size={18} />
          <span>
            File mới luôn chờ kiểm tra an toàn. Nếu dịch vụ quét chưa sẵn sàng,
            hệ thống giữ file ở trạng thái chờ và không cung cấp nội dung.
          </span>
        </div>
        {busy && (
          <div className="progress-track">
            <span style={{ width: progress + "%" }} />
          </div>
        )}
        <div className="modal-footer">
          <Button kind="secondary" type="button" onClick={onClose}>
            {results ? "Đóng" : "Hủy"}
          </Button>
          {!results && (
            <Button
              busy={busy}
              type="submit"
              disabled={!files.length || !destination}
            >
              <Upload size={16} />
              Tải lên {files.length ? `(${files.length})` : ""}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
export function PermissionDialog({ doc, act, onClose, say }) {
  const [users, setUsers] = useState([]),
    [grants, setGrants] = useState([]),
    [v, setV] = useState(0),
    [subjectType, setSubjectType] = useState("USER"),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([api("/users"), api("/grants?target_id=" + doc.id)])
      .then(([u, g]) => {
        setUsers(u);
        setGrants(g);
      })
      .catch((e) => say(e.message, true));
  }, [doc.id, v]);
  const submit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setBusy(true);
    const body = {
      ...f,
      target_id: doc.id,
      target_type: doc.kind === "folder" ? "FOLDER" : "FILE",
      valid_from: f.valid_from ? new Date(f.valid_from).toISOString() : null,
      valid_until: f.valid_until ? new Date(f.valid_until).toISOString() : null,
    };
    if (
      await act(
        () => api("/grants", { method: "POST", body }),
        "Đã cập nhật quyền truy cập",
      )
    )
      setV(v + 1);
    setBusy(false);
  };
  return (
    <Modal
      title="Quản lý quyền truy cập"
      subtitle={doc.name}
      onClose={onClose}
      wide
    >
      <div className="info-box">
        <ShieldCheck size={18} />
        <span>
          Quyền từ chối (Deny) luôn ưu tiên quyền cho phép (Allow), bao gồm
          quyền kế thừa từ thư mục cha.
        </span>
      </div>
      <form className="form-stack mt20" onSubmit={submit}>
        <div className="form-row">
          <Field label="Loại đối tượng">
            <select
              name="subject_type"
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value)}
            >
              <option value="USER">Cá nhân</option>
              <option value="DEPARTMENT">Phòng ban</option>
            </select>
          </Field>
          <Field label={subjectType === "USER" ? "Tài khoản" : "Phòng ban"}>
            {subjectType === "USER" ? (
              <select name="subject_id" required>
                {users.map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="subject_id"
                placeholder="Marketing, HCNS…"
                required
              />
            )}
          </Field>
        </div>
        <div className="form-row">
          <Field label="Hành động">
            <select name="action">
              <option value="VIEW">VIEW – Xem tài liệu</option>
              <option value="DOWNLOAD">DOWNLOAD – Tải tài liệu</option>
            </select>
          </Field>
          <Field label="Hiệu lực quyền">
            <select name="effect">
              <option value="ALLOW">ALLOW – Cho phép</option>
              <option value="DENY">DENY – Từ chối</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Bắt đầu từ (để trống = ngay)">
            <input type="datetime-local" name="valid_from" />
          </Field>
          <Field label="Hết hạn (để trống = vĩnh viễn)">
            <input type="datetime-local" name="valid_until" />
          </Field>
        </div>
        <Button type="submit" busy={busy}>
          <Plus size={16} />
          Thêm quyền
        </Button>
      </form>
      <h3 className="subheading">
        Quyền đang áp dụng <span>{grants.length}</span>
      </h3>
      <div className="grants-list">
        {!grants.length ? (
          <p className="muted">Chưa có quyền cá nhân hoặc phòng ban.</p>
        ) : (
          grants.map((g) => (
            <div key={g.id}>
              <span className={`grant-effect ${g.effect.toLowerCase()}`}>
                {g.effect}
              </span>
              <div>
                <strong>{g.user_name || g.subject_id}</strong>
                <small>
                  {g.action} ·{" "}
                  {g.valid_until ? "Đến " + date(g.valid_until) : "Vĩnh viễn"}
                  {g.inherited ? " · Kế thừa từ thư mục" : ""}
                </small>
              </div>
              {!g.inherited && (
                <button
                  aria-label="Thu hồi quyền"
                  className="icon-button danger-text"
                  onClick={async () => {
                    if (
                      await act(
                        () => api("/grants/" + g.id, { method: "DELETE" }),
                        "Đã thu hồi quyền",
                      )
                    )
                      setV(v + 1);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <div className="modal-footer">
        <Button kind="secondary" onClick={onClose}>
          Hoàn tất
        </Button>
      </div>
    </Modal>
  );
}
export function EditDialog({ doc, folders, act, onClose, say }) {
  const [busy, setBusy] = useState(false);
  const schema =
    folders.find((f) => f.id === doc.folder_id)?.metadata_schema || [];
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target),
      d = Object.fromEntries(fd);
    const metadata = { ...doc.metadata };
    for (const f of schema) {
      const val = d["meta_" + f.key];
      metadata[f.key] =
        f.type === "boolean"
          ? val === "true"
          : f.type === "number" && val !== ""
            ? Number(val)
            : val;
    }
    setBusy(true);
    if (
      await act(
        () =>
          api("/documents/" + doc.id, {
            method: "PATCH",
            body: {
              name: d.name,
              description: d.description,
              access: d.access,
              downloadable: d.downloadable === "true",
              metadata,
              effective_from: d.effective_from
                ? new Date(d.effective_from).toISOString()
                : null,
              effective_until: d.effective_until
                ? new Date(d.effective_until).toISOString()
                : null,
              replacement_id: d.replacement_id || null,
              legal_hold: fd.has("legal_hold"),
            },
          }),
        "Đã lưu thông tin tài liệu",
      )
    )
      onClose();
    setBusy(false);
  };
  return (
    <Modal
      title="Chỉnh sửa tài liệu"
      subtitle="Thông tin, chính sách và vòng đời tài liệu."
      onClose={onClose}
      wide
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="Tên tài liệu">
          <input name="name" defaultValue={doc.name} required maxLength={240} />
        </Field>
        <Field label="Mô tả">
          <textarea
            name="description"
            rows={3}
            defaultValue={doc.description}
          />
        </Field>
        <div className="form-row">
          <Field label="Quyền truy cập">
            <select name="access" defaultValue={doc.access}>
              <option value="PUBLIC">Công khai</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
          </Field>
          <Field label="Chính sách tải xuống">
            <select name="downloadable" defaultValue={String(doc.downloadable)}>
              <option value="false">Chỉ xem</option>
              <option value="true">Cho phép nếu có quyền DOWNLOAD</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Ngày hiệu lực">
            <input
              type="datetime-local"
              name="effective_from"
              defaultValue={toLocal(doc.effective_from)}
            />
          </Field>
          <Field label="Ngày hết hiệu lực">
            <input
              type="datetime-local"
              name="effective_until"
              defaultValue={toLocal(doc.effective_until)}
            />
          </Field>
        </div>
        <Field label="ID tài liệu thay thế (nếu có)">
          <input
            name="replacement_id"
            defaultValue={doc.replacement_id || ""}
            placeholder="ID tài liệu thay thế"
          />
        </Field>
        {schema.length > 0 && (
          <>
            <h3 className="subheading">Thông tin bổ sung</h3>
            <div className="form-row">
              {schema.map((f) => (
                <Field label={f.label + (f.required ? " *" : "")} key={f.key}>
                  {f.type === "select" || f.type === "boolean" ? (
                    <select
                      name={"meta_" + f.key}
                      defaultValue={String(doc.metadata?.[f.key] ?? "")}
                      required={f.required}
                    >
                      <option value="">Chọn giá trị</option>
                      {(f.type === "boolean"
                        ? ["true", "false"]
                        : f.choices || []
                      ).map((v) => (
                        <option value={v} key={v}>
                          {v === "true" ? "Có" : v === "false" ? "Không" : v}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={"meta_" + f.key}
                      defaultValue={doc.metadata?.[f.key] ?? ""}
                      required={f.required}
                      type={
                        f.type === "number"
                          ? "number"
                          : f.type === "date"
                            ? "date"
                            : "text"
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
          </>
        )}
        <label className="checkbox-line">
          <input
            type="checkbox"
            name="legal_hold"
            defaultChecked={doc.legal_hold}
          />
          Giữ hồ sơ pháp lý (không xóa tự động)
        </label>
        <div className="modal-footer">
          <Button kind="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" busy={busy}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function toLocal(v) {
  if (!v) return "";
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function UserDialog({ user, act, onClose }) {
  const [busy, setBusy] = useState(false),
    [role, setRole] = useState(
      user.role === "HR_ADMIN" ? "EMPLOYEE" : "CUSTOMER",
    );
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = Object.fromEntries(new FormData(e.target));
    if (
      await act(
        () => api("/users", { method: "POST", body }),
        "Đã tạo tài khoản. Email khởi tạo đang chờ gửi.",
      )
    )
      onClose();
    setBusy(false);
  };
  return (
    <Modal
      title={user.role === "HR_ADMIN" ? "Thêm nhân viên" : "Thêm tài khoản"}
      subtitle="Mật khẩu tạm thời được sinh tự động và bắt buộc đổi khi đăng nhập."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="Họ và tên">
          <input name="name" required placeholder="Nguyễn Văn An" />
        </Field>
        <Field label="Địa chỉ email">
          <input
            name="email"
            type="email"
            required
            placeholder="ten@congty.vn"
          />
        </Field>
        <Field label="Vai trò">
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {(user.role === "SUPER_ADMIN"
              ? Object.keys(roleName)
              : user.role === "HR_ADMIN"
                ? ["EMPLOYEE"]
                : ["CUSTOMER"]
            ).map((r) => (
              <option key={r} value={r}>
                {roleName[r]}
              </option>
            ))}
          </select>
        </Field>
        {role !== "CUSTOMER" && (
          <Field label="Phòng ban">
            <input name="department" placeholder="Marketing, HCNS…" />
          </Field>
        )}
        {user.role === "SUPER_ADMIN" &&
          ["MANAGER", "BOOK_ADMIN", "HR_ADMIN"].includes(role) && (
            <Field label="Phạm vi kho">
              <select name="scope">
                <option value="books">Bacnhabook</option>
                <option value="hr">HCNS</option>
                <option value="common">Tài liệu công ty</option>
                <option value="marketing">Marketing</option>
              </select>
            </Field>
          )}
        <div className="info-box">
          <Mail size={18} />
          <span>
            Email sẽ được xếp hàng. Chỉ gửi được sau khi cấu hình dịch vụ gửi
            thư.
          </span>
        </div>
        <div className="modal-footer">
          <Button kind="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button busy={busy} type="submit">
            <Plus size={16} />
            Tạo tài khoản
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function ImportDialog({ folders, act, say, refresh, onClose }) {
  const [items, setItems] = useState(null),
    [results, setResults] = useState(null),
    [busy, setBusy] = useState(false),
    [folder, setFolder] = useState(""),
    [expiry, setExpiry] = useState("");
  const input = useRef();
  const preview = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const d = await api("/imports/preview", { method: "POST", body });
      setItems(d.items);
      setResults(null);
    } catch (e) {
      say(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const commit = async () => {
    setBusy(true);
    try {
      const result = await api("/imports/commit", {
        method: "POST",
        body: {
          items: items
            .filter((i) => ["new", "existing"].includes(i.status))
            .map((i) => ({ email: i.email, name: i.name })),
          folder_id: folder || undefined,
          valid_until: expiry ? new Date(expiry).toISOString() : null,
        },
      });
      setResults(result.items);
      refresh();
      say("Đã xử lý danh sách khách hàng.");
    } catch (e) {
      say(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    const csv =
      "\uFEFF" +
      [
        ["email", "status", "error"],
        ...(results || items).map((i) => [i.email, i.status, i.error || ""]),
      ]
        .map((r) =>
          r
            .map(
              (v) =>
                '"' +
                String(v)
                  .replace(/^[=+@-]/, "'")
                  .replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bao-cao-import.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Modal
      title="Nhập khách hàng từ Excel"
      subtitle="Kiểm tra từng dòng trước khi tạo tài khoản và cấp quyền."
      onClose={onClose}
      wide
    >
      <input
        ref={input}
        type="file"
        hidden
        accept=".xlsx,.xls,.csv"
        onChange={preview}
      />
      <div className="upload-dropzone compact">
        <Upload size={28} />
        <h3>Thêm danh sách khách hàng</h3>
        <p>
          File .xlsx hoặc .csv, có cột <code>email</code> và <code>name</code>.
        </p>
        <Button
          kind="secondary"
          onClick={() => input.current.click()}
          busy={busy}
        >
          Chọn file Excel
        </Button>
      </div>
      {items && (
        <>
          <div className="import-summary">
            <span>{items.length} dòng</span>
            <span className="green-text">
              {items.filter((i) => i.status === "new").length} tài khoản mới
            </span>
            <span>
              {items.filter((i) => i.status === "existing").length} đã tồn tại
            </span>
            <span className="danger-text">
              {
                items.filter((i) => ["invalid", "duplicate"].includes(i.status))
                  .length
              }{" "}
              dòng lỗi/trùng
            </span>
          </div>
          <div className="import-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, n) => (
                  <tr key={n}>
                    <td>{i.email}</td>
                    <td>{i.name}</td>
                    <td>
                      <span
                        className={`status-pill ${i.status === "invalid" || i.status === "duplicate" ? "red" : "green"}`}
                      >
                        {results?.find((r) => r.email === i.email)?.status ||
                          {
                            new: "Mới",
                            existing: "Đã tồn tại",
                            invalid: "Email sai",
                            duplicate: "Trùng dòng",
                          }[i.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-row mt20">
            <Field label="Cấp VIEW cho thư mục (tùy chọn)">
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="">Không cấp quyền trong bước này</option>
                {folders
                  .filter((f) => f.repository_id === "books" && f.can_manage)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Hết hạn quyền (để trống = vĩnh viễn)">
              <input
                type="datetime-local"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </Field>
          </div>
        </>
      )}
      <div className="modal-footer">
        <Button kind="secondary" onClick={onClose}>
          Đóng
        </Button>
        {items && (
          <Button kind="secondary" onClick={download}>
            <Download size={15} />
            Tải báo cáo
          </Button>
        )}
        {items && !results && (
          <Button busy={busy} onClick={commit}>
            <Check size={16} />
            Xác nhận nhập
          </Button>
        )}
      </div>
    </Modal>
  );
}
export function VersionsDialog({ doc, act, say, onClose }) {
  const [versions, setVersions] = useState(null),
    [file, setFile] = useState(null),
    [mode, setMode] = useState("new"),
    [busy, setBusy] = useState(false),
    [v, setV] = useState(0);
  useEffect(() => {
    api("/documents/" + doc.id + "/versions")
      .then(setVersions)
      .catch((e) => say(e.message, true));
  }, [v]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);
    if (
      await act(
        () =>
          api("/documents/" + doc.id + "/versions", { method: "POST", body }),
        "Đã nhận bản cập nhật, đang chờ kiểm tra an toàn.",
      )
    )
      setFile(null);
    setBusy(false);
  };
  return (
    <Modal title="Lịch sử phiên bản" subtitle={doc.name} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Field label="Upload bản cập nhật">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </Field>
        <Field label="Cách cập nhật">
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="new">Tạo phiên bản mới · giữ lịch sử</option>
            <option value="overwrite">Ghi đè · không thêm phiên bản UI</option>
          </select>
        </Field>
        <Button type="submit" disabled={!file} busy={busy}>
          <Upload size={16} />
          Upload bản mới
        </Button>
      </form>
      <h3 className="subheading">Các phiên bản đã lưu</h3>
      {versions ? (
        versions.map((v) => (
          <div className="version-row" key={v.id}>
            <span className="version-number">V{v.number}</span>
            <div>
              <strong>
                {v.number === doc.version
                  ? "Phiên bản hiện tại"
                  : "Phiên bản " + v.number}
              </strong>
              <small>
                {date(v.created_at)} · {bytes(v.size)}
              </small>
            </div>
            {v.number !== doc.version && (
              <Button
                kind="secondary"
                onClick={async () => {
                  if (
                    await act(
                      () =>
                        api(`/documents/${doc.id}/versions/${v.id}/restore`, {
                          method: "POST",
                        }),
                      "Đã khôi phục phiên bản",
                    )
                  ) {
                    setV((n) => n + 1);
                    onClose();
                  }
                }}
              >
                <RefreshCw size={14} />
                Khôi phục
              </Button>
            )}
          </div>
        ))
      ) : (
        <Loading />
      )}
    </Modal>
  );
}
export function FolderSettingsDialog({
  folder,
  folders,
  act,
  say,
  onClose,
  setModal,
}) {
  const [users, setUsers] = useState([]),
    [approverIds, setApproverIds] = useState(folder.approvers || []),
    [fields, setFields] = useState(folder.metadata_schema || []),
    [inherit, setInherit] = useState(!!folder.inherits_approvers),
    [folderName, setFolderName] = useState(folder.name),
    [parent, setParent] = useState(folder.parent_id || ""),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    api("/users")
      .then(setUsers)
      .catch((e) => say(e.message, true));
  }, []);
  const save = async () => {
    if (
      await act(
        () =>
          api("/folders/" + folder.id, {
            method: "PATCH",
            body: {
              name: folderName,
              parent_id: parent || null,
              approvers: inherit ? null : approverIds,
              metadata_schema: fields,
            },
          }),
        "Đã lưu cấu hình thư mục",
      )
    )
      onClose();
  };
  return (
    <Modal
      title="Cấu hình thư mục"
      subtitle={folder.name}
      onClose={onClose}
      wide
    >
      <div className="form-row">
        <Field label="Tên thư mục">
          <input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            required
          />
        </Field>
        <Field label="Thư mục cha">
          <select value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">Thư mục gốc</option>
            {folders
              .filter(
                (f) =>
                  f.repository_id === folder.repository_id &&
                  f.id !== folder.id,
              )
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </Field>
      </div>
      <h3 className="subheading">Người phê duyệt</h3>
      <p className="muted">
        Người duyệt được áp dụng cho các thư mục con chưa cấu hình riêng.
      </p>
      <label className="checkbox-line mt20">
        <input
          type="checkbox"
          checked={inherit}
          onChange={(e) => setInherit(e.target.checked)}
        />
        Kế thừa người duyệt từ thư mục cha
      </label>
      <div className="approver-choices">
        {!inherit &&
          users
            .filter((u) =>
              ["SUPER_ADMIN", "BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(
                u.role,
              ),
            )
            .map((u) => (
              <label className="checkbox-line" key={u.id}>
                <input
                  type="checkbox"
                  checked={approverIds.includes(u.id)}
                  onChange={(e) =>
                    setApproverIds(
                      e.target.checked
                        ? [...approverIds, u.id]
                        : approverIds.filter((x) => x !== u.id),
                    )
                  }
                />
                {u.name} <small>{roleName[u.role]}</small>
              </label>
            ))}
      </div>
      <h3 className="subheading">Trường thông tin tùy chỉnh</h3>
      {fields.map((f, i) => (
        <div className="metadata-field-row" key={i}>
          <input
            aria-label="Khóa trường"
            placeholder="ma_tai_lieu"
            value={f.key}
            onChange={(e) =>
              setFields(
                fields.map((x, j) =>
                  j === i ? { ...x, key: e.target.value } : x,
                ),
              )
            }
          />
          <input
            aria-label="Tên trường"
            placeholder="Tên trường"
            value={f.label}
            onChange={(e) =>
              setFields(
                fields.map((x, j) =>
                  j === i ? { ...x, label: e.target.value } : x,
                ),
              )
            }
          />
          <select
            aria-label="Kiểu dữ liệu"
            value={f.type}
            onChange={(e) =>
              setFields(
                fields.map((x, j) =>
                  j === i ? { ...x, type: e.target.value } : x,
                ),
              )
            }
          >
            {[
              ["text", "Văn bản"],
              ["number", "Số"],
              ["date", "Ngày"],
              ["boolean", "Có / Không"],
              ["select", "Lựa chọn"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button
            className="icon-button danger-text"
            aria-label="Xóa trường"
            onClick={() => setFields(fields.filter((_, j) => j !== i))}
          >
            <Trash2 size={16} />
          </button>
          {f.type === "select" && (
            <input
              className="choices-input"
              aria-label="Các lựa chọn"
              placeholder="Các lựa chọn, phân cách bằng dấu phẩy"
              value={(f.choices || []).join(",")}
              onChange={(e) =>
                setFields(
                  fields.map((x, j) =>
                    j === i ? { ...x, choices: e.target.value.split(",") } : x,
                  ),
                )
              }
            />
          )}
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={f.required || false}
              onChange={(e) =>
                setFields(
                  fields.map((x, j) =>
                    j === i ? { ...x, required: e.target.checked } : x,
                  ),
                )
              }
            />
            Bắt buộc
          </label>
        </div>
      ))}
      <Button
        kind="secondary"
        onClick={() =>
          setFields([
            ...fields,
            { key: "", label: "", type: "text", required: false },
          ])
        }
      >
        <Plus size={15} />
        Thêm trường
      </Button>
      <div className="modal-footer">
        <Button kind="text" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={15} />
          Xóa thư mục
        </Button>
        <Button
          kind="secondary"
          onClick={() =>
            setModal({ kind: "permission", doc: { ...folder, kind: "folder" } })
          }
        >
          <ShieldCheck size={15} />
          Quyền thư mục
        </Button>
        <Button kind="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={save}>Lưu cấu hình</Button>
      </div>
      {confirmDelete && (
        <div className="delete-folder-confirm">
          <p>
            Thư mục và toàn bộ nội dung bên trong sẽ được ẩn khỏi thư viện. Bạn
            có thể khôi phục từ thùng rác.
          </p>
          <div className="inline-actions">
            <Button kind="secondary" onClick={() => setConfirmDelete(false)}>
              Giữ lại
            </Button>
            <Button
              kind="danger"
              onClick={async () => {
                if (
                  await act(
                    () => api("/folders/" + folder.id, { method: "DELETE" }),
                    "Đã chuyển thư mục vào thùng rác",
                  )
                ) {
                  onClose();
                  location.reload();
                }
              }}
            >
              Xác nhận xóa thư mục
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
