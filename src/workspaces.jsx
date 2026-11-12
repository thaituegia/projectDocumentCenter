import React from "react";
import {
  ArrowUpRight,
  BookOpen,
  Users,
  ShieldCheck,
  FolderOpen,
  Settings,
  ScrollText,
  Star,
  Clock,
  Inbox,
  Bell,
} from "lucide-react";

// UX-01 / BR-21: navigation describes a role's work; API authorization remains authoritative.
export const workspaces = {
  SUPER_ADMIN: {
    name: "Điều hành hệ thống",
    title: "Quản trị toàn hệ thống",
    description:
      "Theo dõi hoạt động, quản lý tài khoản và cấu hình trung tâm tài liệu.",
    repo: "books",
    accent: "sage",
    actions: [
      [
        "/dashboard",
        "Tổng quan vận hành",
        "Thống kê tài liệu, dung lượng và hoạt động trong hệ thống.",
        ShieldCheck,
      ],
      [
        "/people",
        "Tài khoản & vai trò",
        "Quản lý người dùng, phòng ban và phạm vi quản trị.",
        Users,
      ],
      [
        "/settings",
        "Cấu hình hệ thống",
        "Thiết lập bảo mật, phiên đăng nhập và chính sách lưu trữ.",
        Settings,
      ],
      [
        "/audit",
        "Tra cứu nhật ký",
        "Theo dõi các thao tác và thay đổi quyền truy cập.",
        ScrollText,
      ],
    ],
  },
  BOOK_ADMIN: {
    name: "Quản trị Bacnhabook",
    title: "Không gian quản trị học liệu",
    description:
      "Chuẩn bị học liệu, quản lý học viên và cấp quyền cho từng hành trình học tập.",
    repo: "books",
    accent: "amber",
    actions: [
      [
        "/library",
        "Quản lý học liệu",
        "Tổ chức thư mục, tải học liệu và cập nhật phiên bản.",
        BookOpen,
      ],
      [
        "/people",
        "Tài khoản học viên",
        "Tạo hoặc nhập danh sách học viên và cấp quyền theo lô.",
        Users,
      ],
      [
        "/requests",
        "Xét yêu cầu học liệu",
        "Xem và xử lý yêu cầu truy cập trong kho được giao.",
        Inbox,
      ],
      [
        "/approvals",
        "Phê duyệt học liệu",
        "Kiểm tra tài liệu chờ duyệt trước khi xuất bản.",
        ShieldCheck,
      ],
    ],
  },
  HR_ADMIN: {
    name: "Hành chính · Nhân sự",
    title: "Không gian quản trị HCNS",
    description:
      "Quản lý tài khoản nhân viên và tổ chức hồ sơ nhân sự trong phạm vi được giao.",
    repo: "hr",
    accent: "blue",
    actions: [
      [
        "/people",
        "Quản lý nhân sự",
        "Tạo, khóa tài khoản và cập nhật phòng ban cho nhân viên.",
        Users,
      ],
      [
        "/library",
        "Hồ sơ HCNS",
        "Tổ chức hồ sơ, cập nhật tài liệu và quản lý phiên bản.",
        FolderOpen,
      ],
      [
        "/requests",
        "Yêu cầu truy cập hồ sơ",
        "Kiểm tra người yêu cầu và cấp quyền đúng phạm vi.",
        Inbox,
      ],
      [
        "/audit",
        "Nhật ký HCNS",
        "Tra cứu các hoạt động thuộc phạm vi quản lý.",
        ScrollText,
      ],
    ],
  },
  MANAGER: {
    name: "Quản lý kho phòng ban",
    title: "Không gian quản lý phòng ban",
    description:
      "Tổ chức tài liệu, phê duyệt và chia sẻ trong các kho bạn được giao quản lý.",
    repo: null,
    accent: "blue",
    actions: [
      [
        "/library",
        "Kho được giao quản lý",
        "Tạo thư mục, tải lên và cập nhật tài liệu của phòng ban.",
        FolderOpen,
      ],
      [
        "/approvals",
        "Tài liệu chờ phê duyệt",
        "Duyệt các tài liệu được phân công cho bạn.",
        ShieldCheck,
      ],
      [
        "/requests",
        "Cấp quyền tài liệu",
        "Xử lý yêu cầu của đồng nghiệp trong và ngoài phòng ban.",
        Inbox,
      ],
      [
        "/audit",
        "Hoạt động của kho",
        "Theo dõi thay đổi tài liệu trong phạm vi được giao.",
        ScrollText,
      ],
    ],
  },
  EMPLOYEE: {
    name: "Không gian nhân viên",
    title: "Tài liệu cho công việc của bạn",
    description:
      "Tra cứu tài liệu công ty và phòng ban, lưu nội dung cần thiết cho công việc mỗi ngày.",
    repo: "common",
    accent: "rose",
    actions: [
      [
        "/library",
        "Tra cứu tài liệu",
        "Tìm tài liệu chung và nội dung được cấp quyền cho bạn.",
        BookOpen,
      ],
      [
        "/favorites",
        "Tài liệu đã lưu",
        "Mở lại những tài liệu bạn thường sử dụng.",
        Star,
      ],
      [
        "/recent",
        "Tiếp tục đọc",
        "Quay lại các tài liệu bạn đã xem gần đây.",
        Clock,
      ],
      [
        "/requests",
        "Yêu cầu của tôi",
        "Gửi và theo dõi trạng thái yêu cầu truy cập tài liệu.",
        Inbox,
      ],
    ],
  },
};

export function preferredRepository(role, repositories) {
  const preferred = workspaces[role]?.repo;
  return (
    repositories.find((r) => r.id === preferred)?.id ||
    repositories.find((r) => r.can_manage)?.id ||
    repositories[0]?.id ||
    ""
  );
}

export function Workspace({ user, repositories, navigate, pending, unread }) {
  const profile = workspaces[user.role];
  if (!profile) return null;
  const managed = repositories.filter((r) => r.can_manage);
  const shown = user.role === "EMPLOYEE" ? repositories : managed;
  return (
    <div className={`role-workspace workspace-${profile.accent}`}>
      <section className="workspace-welcome">
        <div>
          <div className="eyebrow">{profile.name}</div>
          <p className="workspace-greeting">Xin chào, {user.name}</p>
          <h1>{profile.title}</h1>
          <p>{profile.description}</p>
          <button
            className="workspace-primary"
            onClick={() =>
              navigate("/library", {
                repo: preferredRepository(user.role, repositories),
              })
            }
          >
            {user.role === "EMPLOYEE"
              ? "Mở thư viện của tôi"
              : "Mở kho tài liệu"}
            <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="workspace-illustration" aria-hidden="true">
          <BookOpen size={94} strokeWidth={1} />
          <span>Tri thức kết nối chúng ta</span>
        </div>
      </section>
      <div className="workspace-status">
        <span>
          <FolderOpen size={17} />
          {shown.length}{" "}
          {user.role === "EMPLOYEE" ? "kho tài liệu" : "kho được quản lý"}
        </span>
        <button onClick={() => navigate("/notifications")}>
          <Bell size={17} />
          {unread} thông báo chưa đọc
          <ArrowUpRight size={14} />
        </button>
        {user.role !== "EMPLOYEE" && (
          <button onClick={() => navigate("/requests")}>
            <Inbox size={17} />
            {pending} yêu cầu cần xử lý
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>
      <section aria-labelledby="workspace-tasks-title">
        <div className="workspace-section-heading">
          <h2 id="workspace-tasks-title">
            {user.role === "EMPLOYEE"
              ? "Góc làm việc của bạn"
              : "Công việc thường dùng"}
          </h2>
          <span>{profile.name}</span>
        </div>
        <div className="workspace-task-grid">
          {profile.actions.map(([path, title, description, Icon]) => (
            <button
              className="workspace-task"
              key={path}
              onClick={() =>
                navigate(
                  path,
                  path === "/library"
                    ? { repo: preferredRepository(user.role, repositories) }
                    : {},
                )
              }
            >
              <span className="workspace-task-icon">
                <Icon size={23} />
              </span>
              <ArrowUpRight className="workspace-task-arrow" size={18} />
              <h3>{title}</h3>
              <p>{description}</p>
            </button>
          ))}
        </div>
      </section>
      <section
        aria-labelledby="workspace-repos-title"
        className="workspace-repositories"
      >
        <div className="workspace-section-heading">
          <h2 id="workspace-repos-title">
            {user.role === "EMPLOYEE"
              ? "Kho tài liệu của bạn"
              : "Phạm vi quản lý của bạn"}
          </h2>
        </div>
        {shown.length ? (
          shown.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate("/library", { repo: r.id })}
            >
              <span className="workspace-repo-icon">
                <FolderOpen size={23} />
              </span>
              <span>
                <strong>{r.name}</strong>
                <small>{r.description}</small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))
        ) : (
          <p className="muted">Bạn chưa được giao quản lý kho tài liệu nào.</p>
        )}
        <p className="workspace-access-note">
          <ShieldCheck size={16} />
          Quyền xem và tải được kiểm tra riêng trên từng tài liệu.
        </p>
      </section>
    </div>
  );
}
