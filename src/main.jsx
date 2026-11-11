import React, { useState, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  FolderOpen,
  Star,
  Clock,
  Inbox,
  Users,
  ShieldCheck,
  Settings,
  Trash2,
  ScrollText,
  HardDrive,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Plus,
  Upload,
  FolderPlus,
  Grid2X2,
  List,
  SlidersHorizontal,
  ArrowDownUp,
  MoreHorizontal,
  Download,
  Eye,
  Link,
  Lock,
  Globe,
  Check,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  FileText,
  BookMarked,
  Headphones,
  Video,
  GraduationCap,
  ChevronLeft,
  Filter,
  CheckCheck,
  ArrowLeft,
  ExternalLink,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { api, setCsrf, bytes, date, roleName, pubName } from "./api";
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
  BookArt,
} from "./ui";
import {
  UploadDialog,
  FolderDialog,
  PermissionDialog,
  EditDialog,
  LoginDialog,
  UserDialog,
  ImportDialog,
  VersionsDialog,
  FolderSettingsDialog,
} from "./modals";
import {
  Dashboard,
  Requests,
  Approvals,
  People,
  Audit,
  Trash,
  SettingsPage,
  Notifications,
  Viewer,
} from "./pages";
import "./styles.css";
import "./internal.css";
function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [development, setDevelopment] = useState(false),
    [page, setPage] = useState(location.pathname),
    [repo, setRepo] = useState("books"),
    [folder, setFolder] = useState(null),
    [repositories, setRepositories] = useState([]),
    [folders, setFolders] = useState([]),
    [docs, setDocs] = useState([]),
    [notifications, setNotifications] = useState([]),
    [requests, setRequests] = useState([]),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState(""),
    [access, setAccess] = useState(""),
    [sort, setSort] = useState("recent"),
    [view, setView] = useState("list"),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(null),
    [version, setVersion] = useState(0),
    [mobile, setMobile] = useState(false),
    [pageIndex, setPageIndex] = useState(0),
    [total, setTotal] = useState(0),
    [noticeOpen, setNoticeOpen] = useState(false),
    [profileOpen, setProfileOpen] = useState(false),
    [filters, setFilters] = useState(false);
  const timer = useRef();
  const toastTimer = useRef();
  const say = (message, bad = false) => {
    setToast({ message, bad });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };
  const refresh = () => setVersion((v) => v + 1);
  const navigate = (path, options = {}) => {
    history.pushState({}, "", path);
    setPage(path);
    if (options.repo) {
      setRepo(options.repo);
      setFolder(null);
    }
    if (options.folder !== undefined) setFolder(options.folder);
    setMobile(false);
    setSearch("");
    setQuery("");
  };
  useEffect(() => {
    const pop = () => setPage(location.pathname);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    (async () => {
      try {
        let me = await api("/auth/me");
        setDevelopment(me.development);
        if (
          !me.user &&
          me.development &&
          !sessionStorage.getItem("bacnha-visited")
        ) {
          me = await api("/dev/session", {
            method: "POST",
            body: { userId: "admin" },
          });
          sessionStorage.setItem("bacnha-visited", "yes");
        }
        setUser(me.user);
        if (me.user?.role === "EMPLOYEE") setRepo("common");
        setCsrf(me.csrf);
      } catch (e) {
        setError(e.message);
      } finally {
        setReady(true);
      }
    })();
  }, []);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setQuery(search), 220);
    return () => clearTimeout(timer.current);
  }, [search]);
  useEffect(() => {
    if (!ready) return;
    Promise.all([api("/repositories"), api("/folders")])
      .then(([r, f]) => {
        setRepositories(r);
        setFolders(f);
        if (!r.some((x) => x.id === repo)) setRepo("books");
      })
      .catch((e) => setError(e.message));
    if (user) {
      api("/notifications")
        .then(setNotifications)
        .catch(() => {});
      api("/access-requests")
        .then(setRequests)
        .catch(() => {});
    } else {
      setNotifications([]);
      setRequests([]);
    }
  }, [ready, user, version]);
  const favorites = page === "/favorites";
  useEffect(() => {
    setPageIndex(0);
  }, [query, repo, folder, type, access, favorites, page]);
  useEffect(() => {
    if (!ready) return;
    let current = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      sort,
      limit: "12",
      offset: String(pageIndex * 12),
    });
    if (repo) params.set("repository", repo);
    if (folder) params.set("folder", folder);
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (access) params.set("access", access);
    if (page === "/recent") params.set("recent", "true");
    if (favorites) {
      params.delete("repository");
      params.delete("folder");
      params.set("favorite", "true");
    }
    api("/documents?" + params)
      .then((d) => {
        if (current) {
          setDocs(d.items);
          setTotal(d.total);
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [
    ready,
    user,
    repo,
    folder,
    query,
    type,
    access,
    sort,
    favorites,
    version,
    pageIndex,
    page,
  ]);
  useEffect(() => {
    const key = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const isAdmin =
    user &&
    ["SUPER_ADMIN", "BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(user.role);
  const currentRepo = repositories.find((r) => r.id === repo);
  const currentFolder = folders.find((f) => f.id === folder);
  const canManage = !!currentRepo?.can_manage;
  const unread = notifications.filter((n) => !n.read_at).length;
  const pending = requests.filter(
    (r) => r.status === "pending" && r.can_review,
  ).length;
  const folderPath = [];
  let f = currentFolder;
  while (f) {
    folderPath.unshift(f);
    f = folders.find((p) => p.id === f.parent_id);
  }
  const openDoc = (d) => setModal({ kind: "preview", doc: d });
  const act = async (fn, message) => {
    try {
      await fn();
      if (message) say(message);
      refresh();
      return true;
    } catch (e) {
      say(e.message, true);
      return false;
    }
  };
  const copy = (d) => {
    const link = location.origin + "/library/files/" + d.id;
    navigator.clipboard
      .writeText(link)
      .then(() =>
        say("Đã sao chép liên kết. Người nhận vẫn cần quyền truy cập."),
      )
      .catch(() => say(link));
  };
  const navItems = [
    { path: "/library", label: "Thư viện tài liệu", icon: Library },
    { path: "/favorites", label: "Đã lưu", icon: Star },
    { path: "/recent", label: "Gần đây", icon: Clock },
    {
      path: "/requests",
      label: "Yêu cầu truy cập",
      icon: Inbox,
      count: pending,
    },
  ];
  const adminItems = [
    { path: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { path: "/approvals", label: "Phê duyệt tài liệu", icon: ShieldCheck },
    {
      path: "/people",
      label: user?.role === "BOOK_ADMIN" ? "Khách hàng" : "Người dùng",
      icon: Users,
    },
    { path: "/audit", label: "Nhật ký hoạt động", icon: ScrollText },
    { path: "/trash", label: "Thùng rác", icon: Trash2 },
    ...(user?.role === "SUPER_ADMIN"
      ? [{ path: "/settings", label: "Cài đặt hệ thống", icon: Settings }]
      : []),
  ];
  const titleMap = {
    "/dashboard": "Tổng quan",
    "/requests": "Yêu cầu truy cập",
    "/approvals": "Phê duyệt tài liệu",
    "/people": "Quản lý người dùng",
    "/audit": "Nhật ký hoạt động",
    "/trash": "Thùng rác",
    "/settings": "Cài đặt hệ thống",
    "/notifications": "Thông báo",
  };
  const isLibrary =
    ["/", "/library", "/bacnhabook", "/favorites", "/recent"].includes(page) ||
    page.startsWith("/library/folders/");
  const common = {
    user,
    say,
    refresh,
    version,
    act,
    openDoc,
    navigate,
    setModal,
    folders,
    repositories,
  };
  const onAuthenticated = (me) => {
    setUser(me.user);
    setRepo(me.user?.role === "EMPLOYEE" ? "common" : "books");
    setCsrf(me.csrf);
    setModal(null);
    setProfileOpen(false);
    refresh();
    say("Đăng nhập thành công");
  };
  const switchRole = async (userId) => {
    try {
      const me = await api("/dev/session", {
        method: "POST",
        body: { userId },
      });
      onAuthenticated(me);
      navigate("/library");
    } catch (e) {
      say(e.message, true);
    }
  };
  const logout = async () => {
    if (await act(() => api("/auth/logout", { method: "POST" }))) {
      setUser(null);
      setCsrf("");
      setProfileOpen(false);
      navigate("/library");
      say("Bạn đã đăng xuất.");
    }
  };
  if (!ready)
    return (
      <div className="boot">
        <BookOpen size={36} />
        <Loading />
      </div>
    );
  if (!user)
    return (
      <div className="internal-login">
        <div className="internal-login-card">
          <div className="internal-login-brand">
            <BookOpen size={28} />
            <strong>Bác Nhã Book</strong>
            <span>QUẢN TRỊ & NỘI BỘ</span>
          </div>
          <h1>Không gian làm việc nội bộ</h1>
          <p>Dành cho quản trị viên và nhân viên được cấp tài khoản.</p>
          <LoginDialog onAuthenticated={onAuthenticated} say={say} />
          {development && (
            <div className="demo-login">
              <span>TÀI KHOẢN TRẢI NGHIỆM NỘI BỘ</span>
              <div>
                <Button kind="secondary" onClick={() => switchRole("admin")}>
                  Quản trị viên
                </Button>
                <Button kind="secondary" onClick={() => switchRole("employee")}>
                  Nhân viên
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  return (
    <div className="app-shell internal-site">
      {mobile && (
        <div className="sidebar-scrim" onClick={() => setMobile(false)} />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a
          className="brand"
          href="/library"
          onClick={(e) => {
            e.preventDefault();
            navigate("/library");
          }}
        >
          <span className="brand-mark">
            <BookOpen size={25} strokeWidth={1.8} />
          </span>
          <span>
            bacnhabook<span className="brand-dot">.</span>
            <small>QUẢN TRỊ & NỘI BỘ</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-icon">B</span>
          <div>
            Quản trị & Nội bộ
            <small>
              {development ? "Không gian trải nghiệm" : "Trung tâm tài liệu"}
            </small>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="nav-label">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">
          {navItems.map((n) => (
            <button
              key={n.path}
              className={`nav-item ${page === n.path || (n.path === "/library" && (page === "/" || page.startsWith("/library/"))) ? "active" : ""}`}
              onClick={() => navigate(n.path)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {!!n.count && <b className="nav-count">{n.count}</b>}
            </button>
          ))}
        </nav>
        <div className="nav-label repositories-label">
          KHO TÀI LIỆU <span>{repositories.length}</span>
        </div>
        <nav aria-label="Kho tài liệu">
          {repositories.map((r) => (
            <button
              key={r.id}
              className={`nav-item repo-nav ${repo === r.id && isLibrary ? "selected" : ""}`}
              onClick={() => navigate("/library", { repo: r.id })}
            >
              <span className={`repo-dot ${r.color}`} />
              <span>{r.name}</span>
              {repo === r.id && isLibrary ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          ))}
          {isLibrary && folderPath.length > 0 && (
            <button
              className="nav-folder"
              onClick={() => setFolder(folderPath[0].id)}
            >
              <FolderOpen size={15} />
              {folderPath[0].name}
            </button>
          )}
        </nav>
        {isAdmin && (
          <>
            <div className="nav-label">QUẢN TRỊ</div>
            <nav aria-label="Quản trị">
              {adminItems.map((n) => (
                <button
                  key={n.path}
                  className={`nav-item ${page === n.path ? "active" : ""}`}
                  onClick={() => navigate(n.path)}
                >
                  <n.icon size={18} />
                  <span>{n.label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <div className="knowledge-note">
            <span>✦</span>
            <p>
              Tri thức được sẻ chia,
              <br />
              <strong>giá trị được nhân lên.</strong>
            </p>
          </div>
          <button
            className="help-link"
            onClick={() => setModal({ kind: "help" })}
          >
            <HelpCircle size={17} />
            Trợ giúp & hướng dẫn
            <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-footer">
            © {new Date().getFullYear()} Bacnhabook <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <IconButton
            label="Mở menu"
            className="mobile-menu"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </IconButton>
          <div className="topbar-breadcrumb">
            Không gian làm việc <ChevronRight size={13} />
            <strong>
              {isLibrary ? "Thư viện tài liệu" : titleMap[page] || "Tài liệu"}
            </strong>
          </div>
          <div className="global-search">
            <Search size={17} />
            <input
              id="global-search"
              placeholder="Tìm kiếm trong kho tài liệu…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!isLibrary) navigate("/library");
              }}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-actions">
            <div className="notification-wrap">
              <IconButton
                label="Thông báo"
                onClick={() => setNoticeOpen(!noticeOpen)}
              >
                <Bell size={20} />
                {unread > 0 && <i className="notification-dot" />}
              </IconButton>
              {noticeOpen && (
                <div className="dropdown notification-dropdown">
                  <div className="dropdown-title">
                    Thông báo{" "}
                    <button
                      onClick={() =>
                        act(
                          () => api("/notifications/read", { method: "PATCH" }),
                          "Đã đánh dấu đã đọc",
                        )
                      }
                    >
                      <CheckCheck size={17} />
                    </button>
                  </div>
                  {!user ? (
                    <p className="muted p16">Đăng nhập để xem thông báo.</p>
                  ) : (
                    notifications.slice(0, 4).map((n) => (
                      <button
                        className={`notification-item ${!n.read_at ? "unread" : ""}`}
                        key={n.id}
                        onClick={() => {
                          setNoticeOpen(false);
                          if (n.document_id)
                            navigate("/library/files/" + n.document_id);
                          else navigate("/notifications");
                        }}
                      >
                        <span className="notification-item-icon">
                          <Bell size={16} />
                        </span>
                        <span>
                          <strong>{n.title}</strong>
                          <small>{n.message}</small>
                        </span>
                      </button>
                    ))
                  )}
                  <button
                    className="dropdown-all"
                    onClick={() => {
                      navigate("/notifications");
                      setNoticeOpen(false);
                    }}
                  >
                    Xem tất cả thông báo <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            {user ? (
              <div className="profile-wrap">
                <button
                  className="profile"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <span className="avatar">
                    {user.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(-2)
                      .join("")}
                  </span>
                  <span className="profile-name">
                    <strong>{user.name}</strong>
                    <small>{roleName[user.role]}</small>
                  </span>
                  <ChevronDown size={14} />
                </button>
                {profileOpen && (
                  <div className="dropdown profile-dropdown">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    {development && (
                      <>
                        <div className="dropdown-section">
                          TRẢI NGHIỆM THEO VAI TRÒ
                        </div>
                        {[
                          ["admin", "Super Admin"],
                          ["book-admin", "Admin Bacnhabook"],
                          ["hr-admin", "HCNS"],
                          ["manager", "Quản lý Marketing"],
                          ["employee", "Nhân viên"],
                        ].map(([id, label]) => (
                          <button key={id} onClick={() => switchRole(id)}>
                            {label}
                            {user.id === id && <Check size={15} />}
                          </button>
                        ))}
                      </>
                    )}
                    <button
                      onClick={() => {
                        setModal({ kind: "password" });
                        setProfileOpen(false);
                      }}
                    >
                      <Lock size={15} />
                      Đổi mật khẩu
                    </button>
                    <button className="danger-text" onClick={logout}>
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                kind="primary"
                onClick={() => setModal({ kind: "login" })}
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </header>
        <main className="main-content">
          {user?.must_change ? (
            <LoginDialog
              mode="password"
              user={user}
              onAuthenticated={onAuthenticated}
              say={say}
              inline
            />
          ) : page.startsWith("/library/files/") ? (
            <Viewer
              {...common}
              documentId={page.split("/").at(-1)}
              onBack={() => navigate("/library")}
            />
          ) : [
              "/login",
              "/forgot-password",
              "/reset-password",
              "/change-password-first-login",
            ].includes(page) ? (
            <div className="auth-page">
              <LoginDialog
                mode={
                  page === "/forgot-password"
                    ? "forgot"
                    : page === "/reset-password"
                      ? "reset"
                      : page === "/change-password-first-login"
                        ? "password"
                        : "login"
                }
                user={user}
                inline
                onAuthenticated={onAuthenticated}
                say={say}
              />
            </div>
          ) : isLibrary ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span /> KHÔNG GIAN QUẢN TRỊ & NỘI BỘ
                  </div>
                  <h1>
                    {favorites
                      ? "Tài liệu đã lưu"
                      : page === "/recent"
                        ? "Tài liệu gần đây"
                        : currentRepo?.name || "Thư viện tài liệu"}
                  </h1>
                  <p>
                    {favorites
                      ? "Những tài liệu hữu ích, luôn trong tầm tay."
                      : currentRepo?.description ||
                        "Khám phá, học hỏi và cùng nhau phát triển mỗi ngày."}
                  </p>
                </div>
                <div className="heading-actions">
                  {canManage && !favorites && (
                    <>
                      <Button
                        kind="secondary"
                        onClick={() => setModal({ kind: "folder" })}
                      >
                        <FolderPlus size={17} />
                        Tạo thư mục
                      </Button>
                      <Button onClick={() => setModal({ kind: "upload" })}>
                        <Upload size={17} />
                        Tải tài liệu lên
                      </Button>
                    </>
                  )}
                  {!user && (
                    <Button onClick={() => setModal({ kind: "login" })}>
                      Đăng nhập để khám phá
                      <ArrowRight size={16} />
                    </Button>
                  )}
                </div>
              </div>
              {!favorites && !folder && !query && (
                <div className="library-overview">
                  <div>
                    <span className="tiny-icon">
                      <Library size={16} />
                    </span>
                    <strong>{currentRepo?.document_count || 0}</strong>
                    <span>Tài liệu trong kho</span>
                  </div>
                  <span className="overview-separator" />
                  <div>
                    <span className="tiny-icon">
                      <FolderOpen size={16} />
                    </span>
                    <strong>
                      {
                        folders.filter(
                          (f) => f.repository_id === repo && !f.parent_id,
                        ).length
                      }
                    </strong>
                    <span>Bộ sưu tập học liệu</span>
                  </div>
                  <span className="overview-separator" />
                  <div>
                    <span className="tiny-icon">
                      <Globe size={16} />
                    </span>
                    <strong>
                      {docs.filter((d) => d.access === "PUBLIC").length}
                    </strong>
                    <span>Tài liệu công khai</span>
                  </div>
                  <div className="overview-note">
                    <span className="live-dot" />
                    Không gian tri thức của bạn
                  </div>
                </div>
              )}
              {!favorites && !query && page !== "/recent" && (
                <section className="collections-section">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {folder ? "Thư mục con" : "Khám phá bộ sưu tập"}{" "}
                        <span>
                          {
                            folders.filter(
                              (f) =>
                                f.repository_id === repo &&
                                f.parent_id === (folder || null),
                            ).length
                          }
                        </span>
                      </h2>
                      <p>
                        {folder
                          ? "Tiếp tục khám phá nội dung trong thư mục."
                          : "Học theo cấp độ, tiến bộ theo cách của bạn."}
                      </p>
                    </div>
                    {folder ? (
                      <Button
                        kind="text"
                        onClick={() =>
                          setFolder(currentFolder?.parent_id || null)
                        }
                      >
                        <ArrowLeft size={15} />
                        Quay lại
                      </Button>
                    ) : (
                      <span className="section-kicker">
                        MỖI NGÀY MỘT CHÚT TIẾN BỘ <ArrowUpRight size={14} />
                      </span>
                    )}
                  </div>
                  <div className="collections-grid">
                    {folders
                      .filter(
                        (f) =>
                          f.repository_id === repo &&
                          f.parent_id === (folder || null),
                      )
                      .map((f, i) => (
                        <button
                          key={f.id}
                          className={`collection-card collection-${i % 6}`}
                          onClick={() => setFolder(f.id)}
                        >
                          <div className="collection-top">
                            <span className="collection-icon">
                              {repo === "books" && !folder ? (
                                i < 4 ? (
                                  <span className="hsk-mark">
                                    汉<span>{i + 1}</span>
                                  </span>
                                ) : i === 4 ? (
                                  <Globe size={24} />
                                ) : (
                                  <GraduationCap size={25} />
                                )
                              ) : (
                                <FolderOpen size={25} />
                              )}
                            </span>
                            <ArrowUpRight
                              size={16}
                              className="collection-arrow"
                            />
                          </div>
                          <h3>{f.name}</h3>
                          <p>{f.description || "Tài liệu & học liệu"}</p>
                          <div className="collection-footer">
                            <span>{f.file_count} tài liệu</span>
                            <span className="folder-mini">
                              <FolderOpen size={13} />
                              {folders.filter((x) => x.parent_id === f.id)
                                .length || "—"}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </section>
              )}
              <section id="document-section" className="documents-section">
                <div className="section-heading document-section-heading">
                  <div>
                    <h2>
                      {favorites
                        ? "Đã lưu để đọc sau"
                        : folder
                          ? currentFolder?.name
                          : query
                            ? `Kết quả tìm kiếm`
                            : page === "/recent"
                              ? "Bạn đã xem gần đây"
                              : "Tài liệu mới cập nhật"}{" "}
                      <span>{total}</span>
                    </h2>
                    <p>
                      {folder ? (
                        <span className="folder-breadcrumb">
                          <button onClick={() => setFolder(null)}>
                            {currentRepo?.name}
                          </button>
                          {folderPath.map((f) => (
                            <React.Fragment key={f.id}>
                              <ChevronRight size={12} />
                              <button onClick={() => setFolder(f.id)}>
                                {f.name}
                              </button>
                            </React.Fragment>
                          ))}
                        </span>
                      ) : query ? (
                        `Tìm kiếm “${query}” trong tài liệu bạn được phép truy cập.`
                      ) : (
                        "Luôn bắt nhịp với những kiến thức mới nhất."
                      )}
                    </p>
                  </div>
                  <div className="document-heading-right">
                    {folder && canManage && (
                      <Button
                        kind="text"
                        onClick={() =>
                          setModal({
                            kind: "folderSettings",
                            folder: currentFolder,
                          })
                        }
                      >
                        <Settings size={15} />
                        Cấu hình thư mục
                      </Button>
                    )}
                    <div className="view-toggle">
                      <IconButton
                        label="Xem danh sách"
                        onClick={() => setView("list")}
                        aria-pressed={view === "list"}
                      >
                        <List size={17} />
                      </IconButton>
                      <IconButton
                        label="Xem dạng lưới"
                        onClick={() => setView("grid")}
                        aria-pressed={view === "grid"}
                      >
                        <Grid2X2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                </div>
                <div className="document-toolbar">
                  <div className="type-tabs">
                    {[
                      ["", "Tất cả"],
                      ["PDF", "Tài liệu"],
                      ["PPTX", "Bài giảng"],
                      ["AUDIO", "Âm thanh"],
                      ["VIDEO", "Video"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        className={type === value ? "active" : ""}
                        onClick={() => setType(value)}
                      >
                        {value === "" ? (
                          <FolderOpen size={14} />
                        ) : value === "AUDIO" ? (
                          <Headphones size={14} />
                        ) : value === "VIDEO" ? (
                          <Video size={14} />
                        ) : (
                          <FileText size={14} />
                        )}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="toolbar-controls">
                    <Button
                      kind={filters || access ? "soft" : "secondary"}
                      onClick={() => setFilters(!filters)}
                    >
                      <SlidersHorizontal size={15} />
                      <span>Bộ lọc</span>
                      {!!access && <i className="filter-dot" />}
                    </Button>
                    <label className="sort-select">
                      <ArrowDownUp size={14} />
                      <select
                        aria-label="Sắp xếp tài liệu"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="recent">Mới nhất</option>
                        <option value="name">Tên A – Z</option>
                      </select>
                      <ChevronDown size={12} />
                    </label>
                  </div>
                </div>
                {filters && (
                  <div className="filters-panel">
                    <Field label="Quyền truy cập">
                      <select
                        value={access}
                        onChange={(e) => setAccess(e.target.value)}
                      >
                        <option value="">Tất cả quyền truy cập</option>
                        <option value="PUBLIC">Công khai</option>
                        <option value="PRIVATE">Riêng tư</option>
                      </select>
                    </Field>
                    <Field label="Định dạng">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                      >
                        {[
                          ["", "Tất cả định dạng"],
                          ["PDF", "PDF"],
                          ["DOCX", "Word"],
                          ["XLSX", "Excel"],
                          ["PPTX", "PowerPoint"],
                          ["AUDIO", "Âm thanh"],
                          ["VIDEO", "Video"],
                          ["IMAGE", "Hình ảnh"],
                          ["OTHER", "Khác"],
                        ].map(([v, l]) => (
                          <option value={v} key={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Button
                      kind="text"
                      onClick={() => {
                        setType("");
                        setAccess("");
                        setSearch("");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
                {error ? (
                  <div className="error-state">
                    {error}
                    <Button kind="secondary" onClick={refresh}>
                      <RefreshCw size={15} />
                      Thử lại
                    </Button>
                  </div>
                ) : loading ? (
                  <Loading />
                ) : !docs.length ? (
                  <Empty
                    icon={search ? Search : FolderOpen}
                    title="Chưa tìm thấy tài liệu"
                    description="Thử thay đổi từ khóa hoặc bộ lọc để tìm nội dung phù hợp."
                  >
                    <Button
                      kind="secondary"
                      onClick={() => {
                        setSearch("");
                        setType("");
                        setAccess("");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </Empty>
                ) : view === "list" ? (
                  <div className="table-scroll">
                    <table className="document-table">
                      <thead>
                        <tr>
                          <th className="select-col">
                            <span className="table-square" />
                          </th>
                          <th>TÊN TÀI LIỆU</th>
                          <th>TRUY CẬP</th>
                          <th>CẬP NHẬT</th>
                          <th>DUNG LƯỢNG</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map((d) => (
                          <tr key={d.id}>
                            <td className="select-col">
                              <button
                                className={`favorite-toggle ${d.is_favorite ? "saved" : ""}`}
                                aria-label={
                                  d.is_favorite
                                    ? "Bỏ lưu " + d.name
                                    : "Lưu " + d.name
                                }
                                onClick={() =>
                                  user
                                    ? act(() =>
                                        api(
                                          "/documents/" + d.id + "/favorite",
                                          { method: "POST" },
                                        ),
                                      )
                                    : setModal({ kind: "login" })
                                }
                              >
                                <Star
                                  size={15}
                                  fill={d.is_favorite ? "currentColor" : "none"}
                                />
                              </button>
                            </td>
                            <td>
                              <button
                                className="document-name"
                                onClick={() => openDoc(d)}
                              >
                                <FileIcon type={d.type} />
                                <span>
                                  <strong>
                                    {d.name}
                                    {!d.can_view && <Lock size={12} />}
                                  </strong>
                                  <small>
                                    {
                                      folders.find((f) => f.id === d.folder_id)
                                        ?.name
                                    }
                                    {d.publication !== "PUBLISHED" && (
                                      <span
                                        className={`publication ${d.publication.toLowerCase()}`}
                                      >
                                        {pubName[d.publication]}
                                      </span>
                                    )}
                                  </small>
                                </span>
                              </button>
                            </td>
                            <td>
                              <AccessBadge access={d.access} />
                            </td>
                            <td className="date-cell">{date(d.updated_at)}</td>
                            <td className="size-cell">
                              {d.size ? bytes(d.size) : "—"}
                            </td>
                            <td>
                              <DocumentMenu
                                doc={d}
                                onPreview={() => openDoc(d)}
                                onCopy={() => copy(d)}
                                onManage={(kind) => setModal({ kind, doc: d })}
                                onDelete={() =>
                                  setModal({ kind: "delete", doc: d })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="document-grid">
                    {docs.map((d) => (
                      <article
                        className={`document-card card-${d.type.toLowerCase()}`}
                        key={d.id}
                      >
                        <button
                          className="document-card-preview"
                          onClick={() => openDoc(d)}
                        >
                          <div className="mini-document">
                            <span>BACNHABOOK</span>
                            <FileIcon type={d.type} large />
                            <strong>{d.name}</strong>
                            <div />
                            <div />
                            <div />
                          </div>
                          <span className="card-preview-hover">
                            <Eye size={18} />
                            Xem nhanh
                          </span>
                          {!d.can_view && (
                            <Lock size={17} className="card-lock" />
                          )}
                        </button>
                        <div className="document-card-info">
                          <AccessBadge access={d.access} />
                          <button
                            className="document-card-title"
                            onClick={() => openDoc(d)}
                          >
                            {d.name}
                          </button>
                          <p>
                            {folders.find((f) => f.id === d.folder_id)?.name}
                          </p>
                          <div className="document-card-footer">
                            <span>{date(d.updated_at)}</span>
                            <DocumentMenu
                              doc={d}
                              onPreview={() => openDoc(d)}
                              onCopy={() => copy(d)}
                              onManage={(kind) => setModal({ kind, doc: d })}
                              onDelete={() =>
                                setModal({ kind: "delete", doc: d })
                              }
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    Hiển thị{" "}
                    <strong>
                      {total ? pageIndex * 12 + 1 : 0}–
                      {pageIndex * 12 + docs.length}
                    </strong>{" "}
                    trong <strong>{total}</strong> tài liệu
                  </span>
                  {total > 12 && (
                    <div className="pagination">
                      <IconButton
                        label="Trang trước"
                        disabled={pageIndex === 0}
                        onClick={() => setPageIndex((p) => p - 1)}
                      >
                        <ChevronLeft size={15} />
                      </IconButton>
                      <span>
                        {pageIndex + 1} / {Math.ceil(total / 12)}
                      </span>
                      <IconButton
                        label="Trang sau"
                        disabled={(pageIndex + 1) * 12 >= total}
                        onClick={() => setPageIndex((p) => p + 1)}
                      >
                        <ChevronRight size={15} />
                      </IconButton>
                    </div>
                  )}
                  <span className="safe-note">
                    <ShieldCheck size={14} />
                    Nội dung được bảo vệ theo quyền truy cập
                  </span>
                </div>
              </section>
              <div className="library-bottom-note">
                <BookOpen size={16} />
                <span>
                  Mỗi tài liệu là một cánh cửa. Bạn sẽ mở cánh cửa nào hôm nay?
                </span>
                <span className="note-decoration">✦</span>
              </div>
            </>
          ) : page === "/dashboard" ? (
            <Dashboard {...common} />
          ) : page === "/requests" ? (
            <Requests {...common} />
          ) : page === "/approvals" ? (
            <Approvals {...common} />
          ) : page === "/people" ? (
            <People {...common} />
          ) : page === "/audit" ? (
            <Audit {...common} />
          ) : page === "/trash" ? (
            <Trash {...common} />
          ) : page === "/settings" ? (
            <SettingsPage {...common} />
          ) : page === "/notifications" ? (
            <Notifications {...common} />
          ) : (
            <Empty title="Không tìm thấy trang">
              <Button onClick={() => navigate("/library")}>Về thư viện</Button>
            </Empty>
          )}
        </main>
        <footer className="main-footer">
          <span>Bacnhabook · Kết nối tri thức, kiến tạo tương lai.</span>
          <span>
            {development && (
              <>
                <i className="demo-dot" />
                Dữ liệu minh họa<span className="footer-dot">·</span>
              </>
            )}
            Được tạo để cùng bạn tiến bộ{" "}
            <span className="footer-flower">✳</span>
          </span>
        </footer>
      </div>
      {toast && (
        <div role="status" className={`toast ${toast.bad ? "bad" : ""}`}>
          {toast.bad ? <X size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <button aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <>
          {modal.kind === "preview" ? (
            <Modal wide title={modal.doc.name} onClose={() => setModal(null)}>
              <Viewer
                {...common}
                documentId={modal.doc.id}
                compact
                onFull={() => {
                  setModal(null);
                  navigate("/library/files/" + modal.doc.id);
                }}
              />
            </Modal>
          ) : modal.kind === "login" ? (
            <Modal
              title="Chào mừng trở lại"
              subtitle="Đăng nhập để tiếp tục hành trình tri thức."
              onClose={() => setModal(null)}
            >
              <LoginDialog
                onAuthenticated={onAuthenticated}
                say={say}
                development={development}
                switchRole={switchRole}
              />
            </Modal>
          ) : modal.kind === "password" ? (
            <Modal title="Đổi mật khẩu" onClose={() => setModal(null)}>
              <LoginDialog
                mode="password"
                user={user}
                onAuthenticated={onAuthenticated}
                say={say}
              />
            </Modal>
          ) : modal.kind === "upload" ? (
            <UploadDialog
              {...common}
              folderId={folder}
              repoId={repo}
              onClose={() => setModal(null)}
            />
          ) : modal.kind === "folder" ? (
            <FolderDialog
              {...common}
              repoId={repo}
              parentId={folder}
              onClose={() => setModal(null)}
            />
          ) : modal.kind === "permission" ? (
            <PermissionDialog
              {...common}
              doc={modal.doc}
              onClose={() => setModal(null)}
            />
          ) : modal.kind === "edit" ? (
            <EditDialog
              {...common}
              doc={modal.doc}
              onClose={() => setModal(null)}
            />
          ) : modal.kind === "versions" ? (
            <VersionsDialog
              {...common}
              doc={modal.doc}
              onClose={() => setModal(null)}
            />
          ) : modal.kind === "folderSettings" ? (
            <FolderSettingsDialog
              {...common}
              folder={modal.folder}
              onClose={() => setModal(null)}
            />
          ) : modal.kind === "user" ? (
            <UserDialog {...common} onClose={() => setModal(null)} />
          ) : modal.kind === "import" ? (
            <ImportDialog {...common} onClose={() => setModal(null)} />
          ) : modal.kind === "delete" ? (
            <Modal
              title="Chuyển tài liệu vào thùng rác?"
              onClose={() => setModal(null)}
            >
              <p className="modal-description">
                “{modal.doc.name}” sẽ không còn xuất hiện trong thư viện. Bạn có
                thể khôi phục từ thùng rác.
              </p>
              <div className="modal-footer">
                <Button kind="secondary" onClick={() => setModal(null)}>
                  Hủy
                </Button>
                <Button
                  kind="danger"
                  onClick={async () => {
                    if (
                      await act(
                        () =>
                          api("/documents/" + modal.doc.id, {
                            method: "DELETE",
                          }),
                        "Đã chuyển tài liệu vào thùng rác",
                      )
                    )
                      setModal(null);
                  }}
                >
                  <Trash2 size={16} />
                  Chuyển vào thùng rác
                </Button>
              </div>
            </Modal>
          ) : modal.kind === "help" ? (
            <Modal
              title="Chào bạn, chúng tôi có thể giúp gì?"
              onClose={() => setModal(null)}
            >
              <div className="help-content">
                <BookOpen size={42} />
                <h3>Khám phá không gian tri thức</h3>
                <p>
                  Chọn kho tài liệu ở thanh bên, duyệt theo bộ sưu tập hoặc tìm
                  kiếm bằng tên và nội dung được cấp quyền.
                </p>
                <p>
                  <strong>Xem tài liệu:</strong> Bấm tên để xem nhanh. Biểu
                  tượng khóa cho biết bạn cần gửi yêu cầu truy cập.
                </p>
                <p>
                  <strong>Đã lưu:</strong> Bấm ngôi sao bên cạnh tài liệu để tạo
                  danh sách đọc của riêng bạn.
                </p>
                <p>
                  <strong>Quản trị:</strong> Người quản lý có thể upload, cấu
                  hình quyền, xử lý yêu cầu và duyệt tài liệu trong phạm vi kho
                  được giao.
                </p>
                {development && (
                  <p className="info-box">
                    Đây là không gian trải nghiệm. Bạn có thể đổi vai trò ở menu
                    tài khoản. Dịch vụ R2 và email sẽ được kết nối trong bước
                    cấu hình.
                  </p>
                )}
              </div>
            </Modal>
          ) : null}
        </>
      )}
    </div>
  );
}
function DocumentMenu({ doc, onPreview, onCopy, onManage, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div className="document-menu" ref={ref}>
      <IconButton
        label={"Thao tác với " + doc.name}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal size={18} />
      </IconButton>
      {open && (
        <div className="dropdown document-dropdown">
          {[
            [Eye, "Xem nhanh", onPreview],
            [
              ExternalLink,
              "Mở trang tài liệu",
              () => location.assign("/library/files/" + doc.id),
            ],
            [Link, "Sao chép liên kết", onCopy],
            ...(doc.can_manage
              ? [
                  [Settings, "Chỉnh sửa thông tin", () => onManage("edit")],
                  [ShieldCheck, "Quản lý quyền", () => onManage("permission")],
                  [Clock, "Lịch sử phiên bản", () => onManage("versions")],
                  [Trash2, "Chuyển vào thùng rác", onDelete],
                ]
              : []),
          ].map(([Icon, label, fn]) => (
            <button
              key={label}
              onClick={() => {
                setOpen(false);
                fn();
              }}
              className={Icon === Trash2 ? "danger-text" : ""}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
