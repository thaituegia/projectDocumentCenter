import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  Search,
  Star,
  Clock,
  Inbox,
  Bell,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  LogOut,
  Lock,
  GraduationCap,
  Globe,
  Headphones,
  FileText,
  Video,
  Grid2X2,
  List,
  ShieldCheck,
  ArrowLeft,
  Check,
  X,
  Menu,
} from "lucide-react";
import { api, setCsrf, date } from "./api";
import {
  Button,
  IconButton,
  Modal,
  Field,
  AccessBadge,
  FileIcon,
  Empty,
  Loading,
  BookArt,
} from "./ui";
import { LoginDialog } from "./modals";
import { Viewer, Requests, Notifications } from "./pages";
import "./styles.css";
import "./customer.css";
function CustomerApp() {
  const [ready, setReady] = useState(false),
    [user, setUser] = useState(null),
    [development, setDevelopment] = useState(false),
    [page, setPage] = useState(location.pathname),
    [folders, setFolders] = useState([]),
    [folder, setFolder] = useState(null),
    [documents, setDocuments] = useState([]),
    [total, setTotal] = useState(0),
    [pageIndex, setPageIndex] = useState(0),
    [query, setQuery] = useState(""),
    [type, setType] = useState(""),
    [sort, setSort] = useState("recent"),
    [view, setView] = useState("grid"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(null),
    [version, setVersion] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [profile, setProfile] = useState(false),
    [mobile, setMobile] = useState(false);
  const say = (message, bad = false) => setToast({ message, bad });
  const refresh = () => setVersion((v) => v + 1);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const navigate = (path) => {
    history.pushState({}, "", path);
    setPage(path);
    setMobile(false);
    setProfile(false);
    setPageIndex(0);
  };
  useEffect(() => {
    const pop = () => setPage(location.pathname);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    api("/auth/me")
      .then((me) => {
        setUser(me.user);
        setCsrf(me.csrf);
        setDevelopment(me.development);
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    api("/folders")
      .then(setFolders)
      .catch((e) => setError(e.message));
  }, [ready, user, version]);
  useEffect(() => {
    setPageIndex(0);
  }, [folder, query, type, page]);
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);
    setError("");
    const p = new URLSearchParams({
      repository: "books",
      limit: "12",
      offset: String(pageIndex * 12),
      sort,
    });
    if (folder) p.set("folder", folder);
    if (query) p.set("q", query);
    if (type) p.set("type", type);
    if (page === "/favorites") p.set("favorite", "true");
    if (page === "/recent") p.set("recent", "true");
    const timer = setTimeout(
      () =>
        api("/documents?" + p)
          .then((r) => {
            if (alive) {
              setDocuments(r.items);
              setTotal(r.total);
            }
          })
          .catch((e) => {
            if (alive) setError(e.message);
          })
          .finally(() => {
            if (alive) setLoading(false);
          }),
      200,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ready, user, version, folder, query, type, sort, page, pageIndex]);
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
  const authenticated = (me) => {
    setUser(me.user);
    setCsrf(me.csrf);
    setModal(null);
    refresh();
    say("Chào mừng bạn đến với Bác Nhã Book!");
  };
  const demoLogin = async () => {
    try {
      authenticated(
        await api("/dev/session", {
          method: "POST",
          body: { userId: "customer" },
        }),
      );
    } catch (e) {
      say(e.message, true);
    }
  };
  const logout = async () => {
    if (await act(() => api("/auth/logout", { method: "POST" }))) {
      setUser(null);
      setCsrf("");
      setProfile(false);
      navigate("/library");
    }
  };
  const openDoc = (doc) => setModal({ kind: "preview", doc });
  const common = {
    user,
    say,
    refresh,
    version,
    act,
    navigate,
    setModal,
    openDoc,
    folders,
    repositories: [],
  };
  const currentFolder = folders.find((f) => f.id === folder);
  const home = ["/", "/library", "/bacnhabook"].includes(page);
  const isLibrary = home || ["/favorites", "/recent"].includes(page);
  const viewer = page.startsWith("/library/files/");
  const needLogin = () => setModal({ kind: "login" });
  if (!ready)
    return (
      <div className="boot">
        <BookOpen size={36} />
        <Loading />
      </div>
    );
  return (
    <div className="customer-site">
      <header className="customer-header">
        <div className="customer-header-inner">
          <a
            className="customer-brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setFolder(null);
              navigate("/");
            }}
          >
            <span className="brand-mark">
              <BookOpen size={25} />
            </span>
            <span>
              bác nhã book<span className="brand-dot">.</span>
              <small>HỌC MỖI NGÀY, TIẾN XA HƠN</small>
            </span>
          </a>
          <nav className={mobile ? "open" : ""} aria-label="Học liệu của bạn">
            {[
              ["/library", "Khám phá học liệu"],
              ["/favorites", "Đã lưu"],
              ["/requests", "Yêu cầu của tôi"],
            ].map(([path, label]) => (
              <button
                key={path}
                className={
                  page === path || (path === "/library" && home) ? "active" : ""
                }
                onClick={() => {
                  setFolder(null);
                  if (path !== "/library" && !user) return needLogin();
                  navigate(path);
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="customer-header-actions">
            <IconButton
              label="Thông báo"
              onClick={() => (user ? navigate("/notifications") : needLogin())}
            >
              <Bell size={20} />
            </IconButton>
            {user ? (
              <div className="profile-wrap">
                <button
                  className="customer-profile"
                  onClick={() => setProfile(!profile)}
                >
                  <span className="avatar">
                    {user.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(-2)
                      .join("")}
                  </span>
                  <span>{user.name}</span>
                  <ChevronDown size={13} />
                </button>
                {profile && (
                  <div className="dropdown profile-dropdown">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    <button
                      onClick={() => {
                        setProfile(false);
                        setModal({ kind: "password" });
                      }}
                    >
                      <Lock size={15} />
                      Đổi mật khẩu
                    </button>
                    <button onClick={logout}>
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={needLogin}>
                Đăng nhập
                <ArrowRight size={15} />
              </Button>
            )}
            <IconButton
              label="Mở menu học liệu"
              className="customer-menu-toggle"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </IconButton>
          </div>
        </div>
      </header>
      {development && (
        <div className="customer-demo">
          <span>
            <span className="live-dot" />
            Không gian trải nghiệm · Học liệu minh họa
          </span>
          {!user && (
            <button onClick={demoLogin}>
              Dùng tài khoản học viên mẫu <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}
      <main className="customer-main">
        {user?.must_change ? (
          <LoginDialog
            inline
            mode="password"
            user={user}
            onAuthenticated={authenticated}
          />
        ) : viewer ? (
          <Viewer
            {...common}
            documentId={page.split("/").at(-1)}
            onBack={() => navigate("/library")}
          />
        ) : ["/login", "/forgot-password", "/reset-password"].includes(page) ? (
          <div className="auth-page">
            <LoginDialog
              inline
              mode={
                page === "/forgot-password"
                  ? "forgot"
                  : page === "/reset-password"
                    ? "reset"
                    : "login"
              }
              onAuthenticated={authenticated}
            />
          </div>
        ) : isLibrary ? (
          <>
            {home && !folder && !query && (
              <section className="customer-hero">
                <div className="customer-hero-copy">
                  <span className="eyebrow">
                    <span />
                    ĐỒNG HÀNH CÙNG BÁC NHÃ BOOK
                  </span>
                  <h1>
                    Mở trang sách mới,
                    <br />
                    chạm đến <em>chân trời mới.</em>
                  </h1>
                  <p>
                    Một nơi cho mọi hành trình học tiếng Trung.
                    <br />
                    Khám phá học liệu, nuôi dưỡng cảm hứng và tiến bộ mỗi ngày.
                  </p>
                  <Button
                    onClick={() => {
                      setFolder("hsk1");
                      document
                        .getElementById("customer-documents")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Khám phá học liệu HSK 1<ArrowUpRight size={17} />
                  </Button>
                  <div className="customer-hero-trust">
                    <ShieldCheck size={15} />
                    Học liệu chọn lọc<span>·</span>Học theo nhịp của bạn
                  </div>
                </div>
                <BookArt />
              </section>
            )}
            <div className="customer-layout">
              <aside className="customer-categories">
                <div className="eyebrow">HÀNH TRÌNH CỦA BẠN</div>
                <h2>Thư viện học liệu</h2>
                <button
                  className={!folder && home ? "active" : ""}
                  onClick={() => {
                    setFolder(null);
                    navigate("/library");
                  }}
                >
                  <BookOpen size={17} />
                  Tất cả học liệu
                </button>
                {folders
                  .filter((f) => !f.parent_id)
                  .map((f) => (
                    <button
                      key={f.id}
                      className={folder === f.id ? "active" : ""}
                      onClick={() => {
                        setFolder(f.id);
                        navigate("/library");
                      }}
                    >
                      <span className="category-dot" />
                      {f.name}
                      <ChevronRight size={13} />
                    </button>
                  ))}
                <div className="customer-category-divider" />
                <button
                  onClick={() => (user ? navigate("/favorites") : needLogin())}
                >
                  <Star size={16} />
                  Tài liệu đã lưu
                </button>
                <button
                  onClick={() => (user ? navigate("/recent") : needLogin())}
                >
                  <Clock size={16} />
                  Đã xem gần đây
                </button>
                <div className="customer-side-note">
                  <GraduationCap size={28} />
                  <p>
                    Mỗi ngày một chút,
                    <br />
                    <strong>tiến bộ một hành trình.</strong>
                  </p>
                </div>
              </aside>
              <div className="customer-library-content">
                {home && !folder && !query && (
                  <section className="customer-collections">
                    <div className="section-heading">
                      <div>
                        <h2>Học theo cấp độ của bạn</h2>
                        <p>Từ những câu chào đầu tiên đến tự tin giao tiếp.</p>
                      </div>
                      <span className="customer-section-mark">
                        一起学习 · CÙNG NHAU HỌC
                      </span>
                    </div>
                    <div className="collections-grid">
                      {folders
                        .filter((f) => !f.parent_id)
                        .map((f, i) => (
                          <button
                            className={`collection-card collection-${i % 6}`}
                            key={f.id}
                            onClick={() => setFolder(f.id)}
                          >
                            <div className="collection-top">
                              <span className="collection-icon">
                                {i < 4 ? (
                                  <span className="hsk-mark">
                                    汉<span>{i + 1}</span>
                                  </span>
                                ) : i === 4 ? (
                                  <Globe size={24} />
                                ) : (
                                  <GraduationCap size={24} />
                                )}
                              </span>
                              <ArrowUpRight
                                size={16}
                                className="collection-arrow"
                              />
                            </div>
                            <h3>{f.name}</h3>
                            <p>{f.description}</p>
                            <div className="collection-footer">
                              {f.file_count} tài liệu
                              <span>
                                Khám phá <ArrowRight size={11} />
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </section>
                )}
                <section id="customer-documents">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">
                        MỖI TÀI LIỆU, MỘT CƠ HỘI MỚI
                      </span>
                      <h2>
                        {page === "/favorites"
                          ? "Tài liệu đã lưu"
                          : page === "/recent"
                            ? "Bạn đã xem gần đây"
                            : currentFolder?.name || "Khám phá kho học liệu"}
                        <span>{total}</span>
                      </h2>
                      <p>
                        {folder
                          ? "Khám phá tài liệu trong bộ sưu tập đã chọn."
                          : "Tìm nguồn cảm hứng cho hành trình học tập của bạn."}
                      </p>
                    </div>
                    <div className="view-toggle">
                      <IconButton
                        label="Xem dạng lưới"
                        aria-pressed={view === "grid"}
                        onClick={() => setView("grid")}
                      >
                        <Grid2X2 size={17} />
                      </IconButton>
                      <IconButton
                        label="Xem danh sách"
                        aria-pressed={view === "list"}
                        onClick={() => setView("list")}
                      >
                        <List size={17} />
                      </IconButton>
                    </div>
                  </div>
                  {folder && (
                    <div className="customer-folder-bar">
                      <button
                        onClick={() =>
                          setFolder(currentFolder?.parent_id || null)
                        }
                      >
                        <ArrowLeft size={14} />
                        Tất cả học liệu
                      </button>
                      {folders
                        .filter((f) => f.parent_id === folder)
                        .map((f) => (
                          <button key={f.id} onClick={() => setFolder(f.id)}>
                            {f.name}
                            <ChevronRight size={13} />
                          </button>
                        ))}
                    </div>
                  )}
                  <div className="customer-search">
                    <Search size={18} />
                    <input
                      aria-label="Tìm học liệu"
                      placeholder="Bạn muốn học gì hôm nay?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <IconButton
                        label="Xóa tìm kiếm"
                        onClick={() => setQuery("")}
                      >
                        <X size={16} />
                      </IconButton>
                    )}
                    <select
                      aria-label="Sắp xếp học liệu"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="recent">Mới cập nhật</option>
                      <option value="name">Tên A – Z</option>
                    </select>
                  </div>
                  <div className="type-tabs customer-type-tabs">
                    {[
                      ["", "Tất cả", BookOpen],
                      ["PDF", "Tài liệu", FileText],
                      ["PPTX", "Bài giảng", GraduationCap],
                      ["AUDIO", "Âm thanh", Headphones],
                      ["VIDEO", "Video", Video],
                    ].map(([v, l, Icon]) => (
                      <button
                        key={v}
                        className={type === v ? "active" : ""}
                        onClick={() => setType(v)}
                      >
                        <Icon size={15} />
                        {l}
                      </button>
                    ))}
                  </div>
                  {error ? (
                    <div className="error-state">
                      {error}
                      <Button kind="secondary" onClick={refresh}>
                        Thử lại
                      </Button>
                    </div>
                  ) : loading ? (
                    <Loading />
                  ) : !documents.length ? (
                    <Empty
                      icon={Search}
                      title="Chưa có học liệu phù hợp"
                      description="Thử một từ khóa khác hoặc khám phá thêm các bộ sưu tập."
                    >
                      <Button
                        kind="secondary"
                        onClick={() => {
                          setQuery("");
                          setType("");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    </Empty>
                  ) : view === "grid" ? (
                    <div className="document-grid customer-document-grid">
                      {documents.map((d, i) => (
                        <article
                          className={`document-card card-${d.type.toLowerCase()}`}
                          key={d.id}
                        >
                          <button
                            className="document-card-preview"
                            onClick={() => openDoc(d)}
                          >
                            <div className="mini-document">
                              <span>BÁC NHÃ BOOK</span>
                              <FileIcon type={d.type} large />
                              <strong>{d.name}</strong>
                              <div />
                              <div />
                              <div />
                            </div>
                            <span className="card-preview-hover">
                              Khám phá tài liệu <ArrowUpRight size={18} />
                            </span>
                            {!d.can_view && (
                              <Lock size={17} className="card-lock" />
                            )}
                          </button>
                          <div className="document-card-info">
                            <div className="customer-card-meta">
                              <AccessBadge access={d.access} />
                              <button
                                aria-label={
                                  d.is_favorite
                                    ? "Bỏ lưu " + d.name
                                    : "Lưu " + d.name
                                }
                                className={`favorite-toggle ${d.is_favorite ? "saved" : ""}`}
                                onClick={() =>
                                  user
                                    ? act(() =>
                                        api(
                                          "/documents/" + d.id + "/favorite",
                                          { method: "POST" },
                                        ),
                                      )
                                    : needLogin()
                                }
                              >
                                <Star
                                  size={16}
                                  fill={d.is_favorite ? "currentColor" : "none"}
                                />
                              </button>
                            </div>
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
                              <button onClick={() => openDoc(d)}>
                                {d.can_view
                                  ? "Xem tài liệu"
                                  : "Yêu cầu truy cập"}
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="customer-document-list">
                      {documents.map((d) => (
                        <article key={d.id}>
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
                              </small>
                            </span>
                          </button>
                          <AccessBadge access={d.access} />
                          <IconButton
                            label={"Xem " + d.name}
                            onClick={() => openDoc(d)}
                          >
                            <ArrowUpRight size={18} />
                          </IconButton>
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="table-footer">
                    <span>
                      Hiển thị {total ? pageIndex * 12 + 1 : 0}–
                      {pageIndex * 12 + documents.length} trong {total} học liệu
                    </span>
                    {total > 12 && (
                      <div className="pagination">
                        <Button
                          kind="text"
                          disabled={!pageIndex}
                          onClick={() => setPageIndex((p) => p - 1)}
                        >
                          Trước
                        </Button>
                        <span>
                          {pageIndex + 1}/{Math.ceil(total / 12)}
                        </span>
                        <Button
                          kind="text"
                          disabled={(pageIndex + 1) * 12 >= total}
                          onClick={() => setPageIndex((p) => p + 1)}
                        >
                          Sau
                        </Button>
                      </div>
                    )}
                    <span className="safe-note">
                      <ShieldCheck size={14} />
                      Nội dung được bảo vệ theo quyền truy cập
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : page === "/requests" ? (
          <Requests {...common} />
        ) : page === "/notifications" ? (
          <Notifications {...common} />
        ) : (
          <Empty
            title="Không tìm thấy trang học liệu"
            description="Trang này không thuộc website dành cho học viên."
          >
            <Button onClick={() => navigate("/library")}>Về thư viện</Button>
          </Empty>
        )}
      </main>
      <footer className="customer-footer">
        <div>
          <BookOpen size={21} />
          <strong>bác nhã book.</strong>
          <span>Kết nối tri thức, kiến tạo tương lai.</span>
        </div>
        <span>
          © {new Date().getFullYear()} Bác Nhã Book · Học mỗi ngày, tiến xa hơn.
        </span>
      </footer>
      {toast && (
        <div
          className={`toast customer-toast ${toast.bad ? "bad" : ""}`}
          role="status"
        >
          {toast.bad ? <X size={17} /> : <Check size={17} />}
          <span>{toast.message}</span>
          <button aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            <X size={15} />
          </button>
        </div>
      )}
      {modal?.kind === "preview" && (
        <Modal wide title={modal.doc.name} onClose={() => setModal(null)}>
          <Viewer
            {...common}
            compact
            documentId={modal.doc.id}
            onFull={() => {
              setModal(null);
              navigate("/library/files/" + modal.doc.id);
            }}
          />
        </Modal>
      )}
      {modal?.kind === "login" && (
        <Modal
          title="Chào mừng đến với Bác Nhã Book"
          subtitle="Đăng nhập để tiếp tục hành trình học tập."
          onClose={() => setModal(null)}
        >
          <LoginDialog onAuthenticated={authenticated} />
          {development && (
            <div className="customer-demo-login">
              <p>Chưa có tài khoản? Bạn có thể thử bằng dữ liệu minh họa.</p>
              <Button kind="secondary" onClick={demoLogin}>
                Trải nghiệm tài khoản học viên
              </Button>
            </div>
          )}
        </Modal>
      )}
      {modal?.kind === "password" && (
        <Modal title="Đổi mật khẩu" onClose={() => setModal(null)}>
          <LoginDialog
            mode="password"
            user={user}
            onAuthenticated={authenticated}
          />
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<CustomerApp />);
