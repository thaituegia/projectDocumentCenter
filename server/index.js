import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { z } from "zod";
import {
  db,
  all,
  one,
  run,
  insert,
  update,
  transaction,
  id,
  now,
  seed,
  setting,
  audit,
  notify,
  indexDoc,
  dataDir,
} from "./db.js";
import {
  ancestry,
  canManage,
  can,
  approvers,
  schema,
  visibleRepo,
  safeDoc,
  repoFor,
  lifecycle,
  requireManage,
} from "./authz.js";
import { putObject, getObject, remote } from "./storage.js";
import { encryptMail } from "./mail.js";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "SAMEORIGIN",
  });
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  req.requestId = id();
  res.set("X-Request-Id", req.requestId);
  const cookies = Object.fromEntries(
    (req.headers.cookie || "").split(";").map((c) => c.trim().split("=")),
  );
  if (
    process.env.NODE_ENV === "production" &&
    cookies.bacnha_session?.startsWith("demo_")
  )
    delete cookies.bacnha_session;
  const session =
    cookies.bacnha_session &&
    one("SELECT * FROM sessions WHERE id=?", cookies.bacnha_session);
  if (session) {
    const user = one("SELECT * FROM users WHERE id=?", session.user_id);
    const idle = setting("idle_minutes", 30) * 60000;
    if (
      !user ||
      user.status !== "active" ||
      (process.env.NODE_ENV === "production" &&
        ["SUPER_ADMIN", "BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(
          user.role,
        )) ||
      Date.now() - Date.parse(session.last_active) > idle
    ) {
      run("DELETE FROM sessions WHERE id=?", session.id);
    } else {
      req.user = user;
      req.session = session;
      run("UPDATE sessions SET last_active=? WHERE id=?", now(), session.id);
    }
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.host) {
          return res.status(403).json({ error: "Nguồn yêu cầu không hợp lệ." });
        }
      } catch {
        return res.status(403).json({ error: "Nguồn yêu cầu không hợp lệ." });
      }
    }
    if (
      req.session &&
      !["/auth/login", "/dev/session"].includes(req.path) &&
      req.headers["x-csrf-token"] !== req.session.csrf
    )
      return res
        .status(403)
        .json({ error: "Phiên thao tác đã thay đổi. Vui lòng tải lại trang." });
  }
  if (
    req.user?.must_change &&
    !["/auth/me", "/auth/change-password", "/auth/logout"].includes(req.path)
  )
    return res.status(403).json({
      error: "Bạn cần đổi mật khẩu trước khi tiếp tục.",
      code: "MUST_CHANGE_PASSWORD",
    });
  next();
});
const auth = (req, res, next) =>
  req.user
    ? next()
    : res.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục." });
const admin = (req, res, next) =>
  req.user &&
  ["SUPER_ADMIN", "BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(req.user.role)
    ? next()
    : res
        .status(403)
        .json({ error: "Chức năng này chỉ dành cho người quản lý." });
const root = (req, res, next) =>
  req.user?.role === "SUPER_ADMIN"
    ? next()
    : res
        .status(403)
        .json({ error: "Chỉ Super Admin được thực hiện thao tác này." });
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const publicUser = (u) =>
  u
    ? {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        scope: u.scope,
        status: u.status,
        must_change: !!u.must_change,
      }
    : null;
function sessionFor(res, user, demo = false) {
  const session = {
    id: (demo ? "demo_" : "") + crypto.randomBytes(32).toString("hex"),
    user_id: user.id,
    created_at: now(),
    last_active: now(),
    csrf: crypto.randomBytes(24).toString("hex"),
  };
  insert("sessions", session);
  res.cookie("bacnha_session", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400000,
  });
  return { user: publicUser(user), csrf: session.csrf };
}
const doc = (req, res, next) => {
  req.doc = one("SELECT * FROM documents WHERE id=?", req.params.id);
  if (!req.doc)
    return res.status(404).json({ error: "Không tìm thấy tài liệu." });
  next();
};
const folder = (req, res, next) => {
  req.folder = one("SELECT * FROM folders WHERE id=?", req.params.id);
  if (!req.folder)
    return res.status(404).json({ error: "Không tìm thấy thư mục." });
  next();
};
const managers = (repo) =>
  all("SELECT * FROM users").filter((u) =>
    canManage(u, { repository_id: repo }),
  );
function addGrant(user, obj) {
  const duplicate = one(
    "SELECT id FROM grants WHERE subject_type=? AND subject_id=? AND target_id=? AND action=? AND effect=? AND COALESCE(valid_until,'')=?",
    obj.subject_type,
    obj.subject_id,
    obj.target_id,
    obj.action,
    obj.effect,
    obj.valid_until || "",
  );
  if (duplicate) return duplicate;
  const grant = { id: id(), ...obj, created_by: user.id, created_at: now() };
  insert("grants", grant);
  audit(
    user,
    "GRANT_CREATED",
    {
      id: obj.target_id,
      name: obj.target_id,
      repository_id: obj.repository_id,
    },
    "success",
    { subject: obj.subject_id, action: obj.action, effect: obj.effect },
  );
  return grant;
}
function grantData(obj) {
  const allowed = z
    .object({
      subject_type: z.enum(["USER", "DEPARTMENT"]),
      subject_id: z.string().min(1),
      target_type: z.enum(["FILE", "FOLDER"]),
      target_id: z.string().min(1),
      action: z.enum(["VIEW", "DOWNLOAD"]),
      effect: z.enum(["ALLOW", "DENY"]),
      valid_from: z.iso.datetime().nullable().optional(),
      valid_until: z.iso.datetime().nullable().optional(),
    })
    .parse(obj);
  if (
    allowed.valid_from &&
    allowed.valid_until &&
    allowed.valid_until <= allowed.valid_from
  )
    throw Error("Ngày kết thúc phải sau ngày bắt đầu.");
  return allowed;
}
app.get("/api/auth/me", (req, res) =>
  res.json({
    user: publicUser(req.user),
    csrf: req.session?.csrf,
    development: process.env.NODE_ENV !== "production",
  }),
);
app.post("/api/dev/session", (req, res) => {
  if (process.env.NODE_ENV === "production") return res.sendStatus(404);
  const user = one(
    "SELECT * FROM users WHERE id=?",
    req.body.userId || "admin",
  );
  if (!user) return res.sendStatus(404);
  if (req.session) run("DELETE FROM sessions WHERE id=?", req.session.id);
  audit(user, "DEMO_LOGIN", null);
  res.json(sessionFor(res, user, true));
});
const attempts = new Map();
app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const attemptKey = `${req.ip}:${email}`;
    const entry = attempts.get(attemptKey);
    if (entry && entry.count >= 5 && Date.now() - entry.time < 900000)
      return res
        .status(429)
        .json({ error: "Bạn đã thử nhiều lần. Vui lòng thử lại sau 15 phút." });
    const user = one("SELECT * FROM users WHERE email=?", email);
    if (
      !user ||
      user.status !== "active" ||
      !(await bcrypt.compare(String(req.body.password || ""), user.password))
    ) {
      attempts.set(attemptKey, {
        count: (entry?.count || 0) + 1,
        time: Date.now(),
      });
      audit(null, "LOGIN_FAILED", null, "denied");
      return res
        .status(401)
        .json({ error: "Email hoặc mật khẩu không chính xác." });
    }
    if (
      ["SUPER_ADMIN", "BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(
        user.role,
      ) &&
      process.env.NODE_ENV === "production"
    )
      return res.status(503).json({
        error:
          "Đăng nhập quản trị production đang khóa cho đến khi cấu hình và nghiệm thu MFA.",
      });
    if (
      all("SELECT id FROM sessions WHERE user_id=?", user.id).length >=
      setting("max_sessions", 3)
    )
      return res.status(409).json({
        error: "Bạn đã đạt số phiên tối đa. Hãy đăng xuất một thiết bị khác.",
      });
    attempts.delete(attemptKey);
    audit(user, "LOGIN", null);
    res.json(sessionFor(res, user));
  }),
);
app.post("/api/auth/logout", auth, (req, res) => {
  run("DELETE FROM sessions WHERE id=?", req.session.id);
  res.clearCookie("bacnha_session", { path: "/" });
  res.json({ ok: true });
});
app.post(
  "/api/auth/change-password",
  auth,
  wrap(async (req, res) => {
    const p = z
      .string()
      .min(12)
      .max(128)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .parse(req.body.password);
    if (
      !(await bcrypt.compare(
        String(req.body.current_password || ""),
        req.user.password,
      ))
    )
      return res
        .status(400)
        .json({ error: "Mật khẩu hiện tại không chính xác." });
    update("users", req.user.id, {
      password: await bcrypt.hash(p, 12),
      must_change: 0,
    });
    run("DELETE FROM sessions WHERE user_id=?", req.user.id);
    audit(req.user, "PASSWORD_CHANGED", null);
    res.json(
      sessionFor(res, one("SELECT * FROM users WHERE id=?", req.user.id)),
    );
  }),
);
const recoveryAttempts = new Map();
const recoveryLimit = (req, res, next) => {
  const key = req.ip;
  const recent = (recoveryAttempts.get(key) || []).filter(
    (t) => Date.now() - t < 900000,
  );
  if (recent.length >= 10)
    return res.status(429).json({
      error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
    });
  recent.push(Date.now());
  recoveryAttempts.set(key, recent);
  next();
};
app.post("/api/auth/forgot-password", recoveryLimit, (req, res) => {
  const user = one(
    "SELECT * FROM users WHERE email=?",
    String(req.body.email || "")
      .trim()
      .toLowerCase(),
  );
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    insert("password_resets", {
      token_hash: crypto.createHash("sha256").update(token).digest("hex"),
      user_id: user.id,
      expires_at: new Date(Date.now() + 1800000).toISOString(),
    });
    insert("email_outbox", {
      id: id(),
      recipient: user.email,
      subject: "Đặt lại mật khẩu Bacnhabook",
      body: encryptMail(
        `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`,
      ),
      status: "pending",
      created_at: now(),
    });
  }
  res.json({
    message:
      "Nếu tài khoản tồn tại, hướng dẫn khôi phục sẽ được gửi qua email.",
  });
});
app.post(
  "/api/auth/reset-password",
  recoveryLimit,
  wrap(async (req, res) => {
    const p = z
      .string()
      .min(12)
      .max(128)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .parse(req.body.password);
    const hash = crypto
      .createHash("sha256")
      .update(String(req.body.token || ""))
      .digest("hex");
    const reset = one(
      "SELECT * FROM password_resets WHERE token_hash=? AND expires_at>?",
      hash,
      now(),
    );
    if (!reset)
      return res
        .status(400)
        .json({ error: "Liên kết đã hết hạn hoặc đã được sử dụng." });
    const pw = await bcrypt.hash(p, 12);
    transaction(() => {
      update("users", reset.user_id, { password: pw, must_change: 0 });
      run("DELETE FROM password_resets WHERE user_id=?", reset.user_id);
      run("DELETE FROM sessions WHERE user_id=?", reset.user_id);
    });
    res.json({ ok: true });
  }),
);
app.get("/api/repositories", (req, res) =>
  res.json(
    all("SELECT * FROM repositories")
      .filter((r) => visibleRepo(req.user, r))
      .map((r) => ({
        ...r,
        can_manage: canManage(req.user, { repository_id: r.id }),
        document_count: all(
          "SELECT d.* FROM documents d JOIN folders f ON f.id=d.folder_id WHERE f.repository_id=? AND d.deleted_at IS NULL",
          r.id,
        ).filter(
          (d) =>
            !ancestry(d.folder_id).some((f) => f.deleted_at) &&
            (d.publication === "PUBLISHED" || canManage(req.user, d)),
        ).length,
      })),
  ),
);
app.get("/api/folders", (req, res) => {
  const allowed = all("SELECT * FROM repositories")
    .filter((r) => visibleRepo(req.user, r))
    .map((r) => r.id);
  res.json(
    all("SELECT * FROM folders WHERE deleted_at IS NULL")
      .filter(
        (f) =>
          allowed.includes(f.repository_id) &&
          !ancestry(f.id).some((a) => a.deleted_at),
      )
      .map((f) => ({
        ...f,
        can_manage: canManage(req.user, f),
        approvers: approvers(f.id),
        metadata_schema: schema(f.id),
        inherits_approvers: f.approvers === null,
        file_count: all(
          "SELECT id FROM documents WHERE folder_id=? AND deleted_at IS NULL",
          f.id,
        ).length,
      })),
  );
});
app.post("/api/folders", auth, admin, (req, res) => {
  const v = z
    .object({
      name: z.string().trim().min(1).max(160),
      repository_id: z.string(),
      parent_id: z.string().nullable().optional(),
      description: z.string().max(1000).optional(),
    })
    .parse(req.body);
  if (!one("SELECT id FROM repositories WHERE id=?", v.repository_id))
    return res.status(400).json({ error: "Kho không tồn tại." });
  if (!canManage(req.user, v))
    return res.status(403).json({ error: "Bạn không quản lý kho này." });
  if (v.parent_id) {
    const parent = one(
      "SELECT * FROM folders WHERE id=? AND deleted_at IS NULL",
      v.parent_id,
    );
    if (!parent || parent.repository_id !== v.repository_id)
      return res.status(400).json({ error: "Thư mục cha không hợp lệ." });
  }
  if (
    one(
      "SELECT id FROM folders WHERE repository_id=? AND COALESCE(parent_id,'')=? AND name=? AND deleted_at IS NULL",
      v.repository_id,
      v.parent_id || "",
      v.name,
    )
  )
    return res
      .status(409)
      .json({ error: "Tên thư mục đã tồn tại. Vui lòng chọn tên khác." });
  const f = insert("folders", {
    id: id(),
    ...v,
    parent_id: v.parent_id || null,
  });
  audit(req.user, "FOLDER_CREATED", f);
  res.status(201).json(f);
});
app.patch("/api/folders/:id", auth, folder, requireManage, (req, res) => {
  const v = z
    .object({
      name: z.string().trim().min(1).max(160).optional(),
      parent_id: z.string().nullable().optional(),
      approvers: z.array(z.string()).nullable().optional(),
      metadata_schema: z
        .array(
          z.object({
            key: z.string().regex(/^[a-z][a-z0-9_]*$/),
            label: z.string().min(1),
            type: z.enum(["text", "number", "date", "select", "boolean"]),
            required: z.boolean().optional(),
            choices: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
    .parse(req.body);
  if (v.parent_id !== undefined) {
    if (
      v.parent_id &&
      ancestry(v.parent_id).some((f) => f.id === req.folder.id)
    )
      return res.status(400).json({
        error: "Không thể di chuyển thư mục vào chính nó hoặc thư mục con.",
      });
    const parent =
      v.parent_id && one("SELECT * FROM folders WHERE id=?", v.parent_id);
    if (
      v.parent_id &&
      (!parent ||
        parent.repository_id !== req.folder.repository_id ||
        parent.deleted_at)
    )
      return res.status(400).json({
        error: "Chỉ hỗ trợ di chuyển trong cùng kho ở bản thử nghiệm.",
      });
  }
  const targetName = v.name || req.folder.name,
    targetParent =
      v.parent_id === undefined ? req.folder.parent_id : v.parent_id;
  if (
    one(
      "SELECT id FROM folders WHERE id<>? AND repository_id=? AND name=? AND COALESCE(parent_id,'')=? AND deleted_at IS NULL",
      req.folder.id,
      req.folder.repository_id,
      targetName,
      targetParent || "",
    )
  )
    return res
      .status(409)
      .json({ error: "Tên thư mục đã tồn tại tại vị trí đích." });
  if (v.approvers) v.approvers = JSON.stringify(v.approvers);
  if (v.metadata_schema) {
    if (
      new Set(v.metadata_schema.map((f) => f.key)).size !==
      v.metadata_schema.length
    )
      return res.status(400).json({ error: "Khóa metadata bị trùng." });
    const oldFields = JSON.parse(req.folder.metadata_schema || "[]");
    const removed = oldFields.filter(
      (f) =>
        !v.metadata_schema.some((n) => n.key === f.key && n.type === f.type),
    );
    if (removed.length) {
      const childDocs = all("SELECT * FROM documents").filter((d) =>
        ancestry(d.folder_id).some((f) => f.id === req.folder.id),
      );
      if (
        childDocs.some((d) =>
          removed.some(
            (f) => JSON.parse(d.metadata || "{}")[f.key] !== undefined,
          ),
        )
      )
        return res.status(409).json({
          error:
            "Không thể xóa hoặc đổi kiểu trường đang có dữ liệu. Cần quy trình migration riêng.",
        });
    }
    v.metadata_schema = JSON.stringify(v.metadata_schema);
  }
  update("folders", req.params.id, v);
  audit(req.user, "FOLDER_UPDATED", req.folder);
  res.json({ ok: true });
});
app.delete("/api/folders/:id", auth, folder, requireManage, (req, res) => {
  update("folders", req.folder.id, { deleted_at: now() });
  audit(req.user, "FOLDER_DELETED", req.folder);
  res.json({ ok: true });
});
app.post(
  "/api/folders/:id/restore",
  auth,
  folder,
  requireManage,
  (req, res) => {
    if (
      req.folder.parent_id &&
      ancestry(req.folder.parent_id).some((f) => f.deleted_at)
    )
      return res
        .status(409)
        .json({ error: "Hãy khôi phục thư mục cha trước." });
    if (
      one(
        "SELECT id FROM folders WHERE id<>? AND name=? AND repository_id=? AND COALESCE(parent_id,'')=? AND deleted_at IS NULL",
        req.folder.id,
        req.folder.name,
        req.folder.repository_id,
        req.folder.parent_id || "",
      )
    )
      return res
        .status(409)
        .json({ error: "Tên thư mục đã tồn tại ở vị trí cũ." });
    update("folders", req.folder.id, { deleted_at: null });
    audit(req.user, "FOLDER_RESTORED", req.folder);
    res.json({ ok: true });
  },
);
app.get("/api/documents", (req, res) => {
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();
  let docs = all("SELECT * FROM documents WHERE deleted_at IS NULL");
  const allowed = all("SELECT * FROM repositories")
    .filter((r) => visibleRepo(req.user, r))
    .map((r) => r.id);
  docs = docs.filter(
    (d) =>
      allowed.includes(repoFor(d)) &&
      !ancestry(d.folder_id).some((f) => f.deleted_at) &&
      (d.publication === "PUBLISHED" || canManage(req.user, d)),
  );
  if (req.query.repository)
    docs = docs.filter((d) => repoFor(d) === req.query.repository);
  if (req.query.folder)
    docs = docs.filter((d) =>
      ancestry(d.folder_id).some((f) => f.id === req.query.folder),
    );
  if (req.query.type) docs = docs.filter((d) => d.type === req.query.type);
  if (req.query.access)
    docs = docs.filter((d) => d.access === req.query.access);
  if (req.query.publication)
    docs = docs.filter((d) => d.publication === req.query.publication);
  if (req.query.favorite === "true")
    docs = docs.filter(
      (d) =>
        req.user &&
        one(
          "SELECT * FROM favorites WHERE user_id=? AND document_id=?",
          req.user.id,
          d.id,
        ),
    );
  if (q)
    docs = docs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        ancestry(d.folder_id).some((f) => f.name.toLowerCase().includes(q)) ||
        (can(req.user, d, "VIEW") &&
          `${d.description} ${d.fulltext} ${d.metadata}`
            .toLowerCase()
            .includes(q)),
    );
  if (req.query.from)
    docs = docs.filter((d) => d.updated_at >= String(req.query.from));
  if (req.query.until)
    docs = docs.filter((d) => d.updated_at <= String(req.query.until));
  if (req.query.department)
    docs = docs.filter(
      (d) =>
        can(req.user, d, "VIEW") &&
        String(d.metadata || "").includes(String(req.query.department)),
    );
  let viewed = new Map();
  if (req.query.recent === "true") {
    if (req.user) {
      for (const e of all(
        "SELECT target_id,MAX(created_at) AS viewed_at FROM audit WHERE actor_id=? AND action='DOCUMENT_VIEWED' GROUP BY target_id",
        req.user.id,
      ))
        viewed.set(e.target_id, e.viewed_at);
      docs = docs.filter((d) => viewed.has(d.id));
    } else docs = [];
  }
  docs.sort((a, b) =>
    req.query.recent === "true"
      ? (viewed.get(b.id) || "").localeCompare(viewed.get(a.id) || "")
      : req.query.sort === "name"
        ? a.name.localeCompare(b.name, "vi") || a.id.localeCompare(b.id)
        : b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id),
  );
  const total = docs.length;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  res.json({
    items: docs.slice(offset, offset + limit).map((d) => safeDoc(req.user, d)),
    total,
    limit,
    offset,
  });
});
app.get("/api/documents/:id", doc, (req, res) => {
  if (
    req.doc.deleted_at ||
    !visibleRepo(
      req.user,
      one("SELECT * FROM repositories WHERE id=?", repoFor(req.doc)),
    ) ||
    (!canManage(req.user, req.doc) && req.doc.publication !== "PUBLISHED")
  )
    return res.status(404).json({ error: "Không tìm thấy tài liệu." });
  res.json(safeDoc(req.user, req.doc));
});
app.get(
  "/api/documents/:id/preview",
  doc,
  wrap(async (req, res) => {
    if (!can(req.user, req.doc, "VIEW")) {
      audit(req.user, "PREVIEW_DENIED", req.doc, "denied");
      return res.status(403).json({
        error: "Bạn chưa có quyền xem tài liệu này.",
        code: "NO_VIEW",
      });
    }
    if (req.doc.processing !== "ready")
      return res.status(409).json({
        error:
          req.doc.processing === "unsupported"
            ? "Định dạng này chưa có bản xem trước. Bạn có thể tải khi được cấp quyền."
            : "Tài liệu đang chờ kiểm tra an toàn và tạo bản xem trước.",
        code: "PROCESSING",
      });
    audit(req.user, "DOCUMENT_VIEWED", req.doc);
    const bytes = await getObject(req.doc.preview_key);
    res.json({
      content: bytes.toString("utf8"),
      format: "text",
      watermark: req.user?.email || "Bacnhabook · Khách",
      document: safeDoc(req.user, req.doc),
    });
  }),
);
app.get(
  "/api/documents/:id/download",
  doc,
  wrap(async (req, res) => {
    if (!can(req.user, req.doc, "DOWNLOAD")) {
      audit(req.user, "DOWNLOAD_DENIED", req.doc, "denied");
      return res.status(403).json({
        error: "Tài liệu không cho phép tải xuống hoặc bạn chưa có quyền tải.",
      });
    }
    if (!["ready", "unsupported"].includes(req.doc.processing))
      return res
        .status(409)
        .json({ error: "Tài liệu chưa qua kiểm tra an toàn." });
    audit(req.user, "DOCUMENT_DOWNLOADED", req.doc);
    const bytes = await getObject(req.doc.object_key);
    res
      .type(req.doc.mime)
      .attachment(
        req.doc.name.replace(/\.[^.]+$/, "") +
          "." +
          (req.doc.object_key.split(".").pop() || "bin"),
      )
      .send(bytes);
  }),
);
app.get(
  "/api/documents/:id/original",
  auth,
  doc,
  requireManage,
  wrap(async (req, res) => {
    if (!["ready", "unsupported"].includes(req.doc.processing))
      return res
        .status(409)
        .json({ error: "Tài liệu chưa qua kiểm tra an toàn." });
    audit(req.user, "ORIGINAL_DOWNLOADED", req.doc);
    res
      .type(req.doc.mime)
      .attachment(req.doc.name)
      .send(await getObject(req.doc.object_key));
  }),
);
app.patch("/api/documents/:id", auth, doc, requireManage, (req, res) => {
  const v = z
    .object({
      name: z.string().trim().min(1).max(240).optional(),
      description: z.string().max(4000).optional(),
      access: z.enum(["PUBLIC", "PRIVATE"]).optional(),
      downloadable: z.boolean().optional(),
      metadata: z
        .record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.null()]),
        )
        .optional(),
      effective_from: z.iso.datetime().nullable().optional(),
      effective_until: z.iso.datetime().nullable().optional(),
      replacement_id: z.string().nullable().optional(),
      legal_hold: z.boolean().optional(),
    })
    .parse(req.body);
  const from =
      v.effective_from === undefined
        ? req.doc.effective_from
        : v.effective_from,
    until =
      v.effective_until === undefined
        ? req.doc.effective_until
        : v.effective_until;
  if (from && until && from >= until)
    return res
      .status(400)
      .json({ error: "Ngày hết hiệu lực phải sau ngày bắt đầu." });
  if (
    v.replacement_id &&
    (!one(
      "SELECT id FROM documents WHERE id=? AND deleted_at IS NULL",
      v.replacement_id,
    ) ||
      v.replacement_id === req.doc.id)
  )
    return res.status(400).json({ error: "Tài liệu thay thế không hợp lệ." });
  if (v.metadata) {
    for (const f of schema(req.doc.folder_id)) {
      const value = v.metadata[f.key];
      if (f.required && (value === undefined || value === ""))
        return res.status(400).json({ error: `Vui lòng nhập ${f.label}.` });
      if (
        value !== undefined &&
        value !== "" &&
        ((f.type === "number" && typeof value !== "number") ||
          (f.type === "boolean" && typeof value !== "boolean") ||
          (f.type === "select" && !f.choices?.includes(value)))
      )
        return res
          .status(400)
          .json({ error: `Giá trị ${f.label} không hợp lệ.` });
    }
    v.metadata = JSON.stringify(v.metadata);
  }
  if (v.downloadable !== undefined) v.downloadable = Number(v.downloadable);
  if (v.legal_hold !== undefined) v.legal_hold = Number(v.legal_hold);
  update("documents", req.doc.id, { ...v, updated_at: now() });
  audit(req.user, "DOCUMENT_UPDATED", req.doc);
  res.json(
    safeDoc(req.user, one("SELECT * FROM documents WHERE id=?", req.doc.id)),
  );
});
app.delete("/api/documents/:id", auth, doc, requireManage, (req, res) => {
  update("documents", req.doc.id, { deleted_at: now() });
  audit(req.user, "DOCUMENT_DELETED", req.doc);
  res.json({ ok: true });
});
app.post("/api/documents/:id/restore", auth, doc, requireManage, (req, res) => {
  if (ancestry(req.doc.folder_id).some((f) => f.deleted_at))
    return res.status(409).json({ error: "Hãy khôi phục thư mục cha trước." });
  if (
    one(
      "SELECT id FROM documents WHERE id<>? AND name=? AND folder_id=? AND deleted_at IS NULL",
      req.doc.id,
      req.doc.name,
      req.doc.folder_id,
    )
  )
    return res
      .status(409)
      .json({ error: "Tên tài liệu đã tồn tại. Cần xử lý xung đột trước." });
  update("documents", req.doc.id, { deleted_at: null });
  indexDoc(one("SELECT * FROM documents WHERE id=?", req.doc.id));
  audit(req.user, "DOCUMENT_RESTORED", req.doc);
  res.json({ ok: true });
});
app.post("/api/documents/:id/favorite", auth, doc, (req, res) => {
  const exists = one(
    "SELECT * FROM favorites WHERE user_id=? AND document_id=?",
    req.user.id,
    req.doc.id,
  );
  if (exists)
    run(
      "DELETE FROM favorites WHERE user_id=? AND document_id=?",
      req.user.id,
      req.doc.id,
    );
  else run("INSERT INTO favorites VALUES (?,?)", req.user.id, req.doc.id);
  res.json({ favorite: !exists });
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_BYTES || 100 * 1024 * 1024),
    files: 50,
  },
});
app.post(
  "/api/uploads",
  auth,
  admin,
  upload.array("files", 50),
  wrap(async (req, res) => {
    const destination = one(
      "SELECT * FROM folders WHERE id=? AND deleted_at IS NULL",
      req.body.folder_id,
    );
    if (!destination || !canManage(req.user, destination))
      return res
        .status(403)
        .json({ error: "Bạn không có quyền upload vào thư mục này." });
    const paths = JSON.parse(req.body.paths || "[]");
    const publication = z
      .enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED"])
      .parse(req.body.publication || "DRAFT");
    const result = [];
    for (let i = 0; i < (req.files || []).length; i++) {
      const file = req.files[i];
      try {
        let folderId = destination.id;
        const relative = String(paths[i] || file.originalname).replaceAll(
          "\\",
          "/",
        );
        const parts = relative.split("/");
        if (parts.some((p) => p === ".." || p === "." || !p))
          throw Error("Đường dẫn không hợp lệ.");
        for (const name of parts.slice(0, -1)) {
          let child = one(
            "SELECT * FROM folders WHERE parent_id=? AND name=? AND deleted_at IS NULL",
            folderId,
            name,
          );
          if (!child)
            child = insert("folders", {
              id: id(),
              name,
              repository_id: destination.repository_id,
              parent_id: folderId,
            });
          folderId = child.id;
        }
        const filename = parts.at(-1);
        if (
          one(
            "SELECT id FROM documents WHERE folder_id=? AND name=? AND deleted_at IS NULL",
            folderId,
            filename,
          )
        )
          throw Error(
            "Tên file đã tồn tại. Dùng chức năng phiên bản hoặc đổi tên.",
          );
        const docId = id(),
          key = `${docId}.${
            filename
              .split(".")
              .at(-1)
              .replace(/[^a-zA-Z0-9]/g, "")
              .slice(0, 12) || "bin"
          }`;
        await putObject(key, file.buffer, file.mimetype);
        const ext = filename.split(".").at(-1).toUpperCase();
        const type = ["PDF", "DOCX", "XLSX", "PPTX"].includes(ext)
          ? ext
          : /^(MP3|WAV|OGG|M4A)$/.test(ext)
            ? "AUDIO"
            : /^(MP4|WEBM|MOV)$/.test(ext)
              ? "VIDEO"
              : /^(PNG|JPG|JPEG|WEBP)$/.test(ext)
                ? "IMAGE"
                : "OTHER";
        const document = {
          id: docId,
          name: filename,
          folder_id: folderId,
          type,
          mime: file.mimetype,
          size: file.size,
          description: "",
          access: req.body.access === "PUBLIC" ? "PUBLIC" : "PRIVATE",
          downloadable: req.body.downloadable === "true" ? 1 : 0,
          publication: "DRAFT",
          processing: "pending_scan",
          object_key: key,
          metadata: "{}",
          created_by: req.user.id,
          created_at: now(),
          updated_at: now(),
        };
        insert("documents", document);
        insert("jobs", {
          id: id(),
          type: `process:${publication}`,
          document_id: docId,
          status: "queued",
          created_at: now(),
          updated_at: now(),
        });
        audit(req.user, "DOCUMENT_UPLOADED", document, "success", {
          checksum: crypto
            .createHash("sha256")
            .update(file.buffer)
            .digest("hex"),
        });
        result.push({ name: relative, id: docId, status: "pending_scan" });
      } catch (e) {
        result.push({
          name: file.originalname,
          status: "failed",
          error: e.message,
        });
      }
    }
    res.status(201).json({ items: result });
  }),
);
app.get("/api/jobs", auth, admin, (req, res) =>
  res.json(
    all(
      "SELECT j.*, d.name,d.folder_id FROM jobs j JOIN documents d ON d.id=j.document_id ORDER BY j.created_at DESC",
    ).filter((j) => canManage(req.user, j)),
  ),
);
app.post("/api/jobs/:id/retry", auth, admin, (req, res) => {
  const job = one("SELECT * FROM jobs WHERE id=?", req.params.id);
  const d = job && one("SELECT * FROM documents WHERE id=?", job.document_id);
  if (!d || !canManage(req.user, d)) return res.sendStatus(403);
  update("jobs", job.id, { status: "queued", error: null, updated_at: now() });
  res.json({ ok: true });
});
app.get("/api/documents/:id/versions", auth, doc, requireManage, (req, res) =>
  res.json(
    all(
      "SELECT id,number,created_at,created_by,size FROM versions WHERE document_id=? ORDER BY number DESC",
      req.doc.id,
    ),
  ),
);
app.post(
  "/api/documents/:id/versions",
  auth,
  doc,
  requireManage,
  upload.single("file"),
  wrap(async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: "Vui lòng chọn file mới." });
    if (!["overwrite", "new"].includes(req.body.mode))
      return res
        .status(400)
        .json({ error: "Chọn ghi đè hoặc tạo phiên bản mới." });
    const key = `${id()}.${
      req.file.originalname
        .split(".")
        .at(-1)
        .replace(/[^a-z0-9]/gi, "") || "bin"
    }`;
    await putObject(key, req.file.buffer, req.file.mimetype);
    insert("jobs", {
      id: id(),
      type: JSON.stringify({
        kind: "version",
        mode: req.body.mode,
        key,
        mime: req.file.mimetype,
        size: req.file.size,
      }),
      document_id: req.doc.id,
      status: "queued",
      created_at: now(),
      updated_at: now(),
    });
    audit(req.user, "VERSION_UPLOADED", req.doc);
    res.status(201).json({
      message:
        "Đã nhận bản cập nhật. Bản hiện tại được giữ cho đến khi kiểm tra thành công.",
    });
  }),
);
app.post(
  "/api/documents/:id/versions/:versionId/restore",
  auth,
  doc,
  requireManage,
  (req, res) => {
    const v = one(
      "SELECT * FROM versions WHERE id=? AND document_id=?",
      req.params.versionId,
      req.doc.id,
    );
    if (!v) return res.status(404).json({ error: "Không tìm thấy phiên bản." });
    update("documents", req.doc.id, {
      object_key: v.object_key,
      preview_key: v.preview_key,
      fulltext: v.fulltext,
      mime: v.mime,
      size: v.size,
      version: v.number,
      updated_at: now(),
      processing: v.preview_key ? "ready" : "unsupported",
    });
    indexDoc(one("SELECT * FROM documents WHERE id=?", req.doc.id));
    audit(req.user, "VERSION_RESTORED", req.doc);
    res.json({ ok: true });
  },
);
app.get("/api/grants", auth, admin, (req, res) => {
  const target = req.query.target_id;
  const d =
    one("SELECT * FROM documents WHERE id=?", target) ||
    one("SELECT * FROM folders WHERE id=?", target);
  if (!d || !canManage(req.user, d))
    return res.status(403).json({ error: "Bạn không quản lý tài nguyên này." });
  const targets = [
    target,
    ...(d.folder_id
      ? ancestry(d.folder_id).map((f) => f.id)
      : ancestry(d.id)
          .slice(1)
          .map((f) => f.id)),
  ];
  res.json(
    all(
      "SELECT g.*,u.name as user_name,u.email FROM grants g LEFT JOIN users u ON g.subject_id=u.id",
    )
      .filter((g) => targets.includes(g.target_id))
      .map((g) => ({ ...g, inherited: g.target_id !== target })),
  );
});
app.post("/api/grants", auth, admin, (req, res) => {
  const v = grantData(req.body);
  const target = one(
    `SELECT * FROM ${v.target_type === "FILE" ? "documents" : "folders"} WHERE id=?`,
    v.target_id,
  );
  if (!target || !canManage(req.user, target))
    return res
      .status(403)
      .json({ error: "Không có quyền cấp quyền trong kho này." });
  if (
    v.subject_type === "USER" &&
    !one("SELECT id FROM users WHERE id=?", v.subject_id)
  )
    return res.status(400).json({ error: "Tài khoản không tồn tại." });
  const g = addGrant(req.user, v);
  if (v.subject_type === "USER")
    notify(
      v.subject_id,
      "Quyền truy cập được cập nhật",
      "Một tài liệu đã được cập nhật quyền truy cập.",
      v.target_type === "FILE" ? v.target_id : null,
    );
  res.status(201).json(g);
});
app.delete("/api/grants/:id", auth, admin, (req, res) => {
  const g = one("SELECT * FROM grants WHERE id=?", req.params.id);
  const target =
    g &&
    (one("SELECT * FROM documents WHERE id=?", g.target_id) ||
      one("SELECT * FROM folders WHERE id=?", g.target_id));
  if (!target || !canManage(req.user, target)) return res.sendStatus(403);
  run("DELETE FROM grants WHERE id=?", g.id);
  audit(req.user, "GRANT_REVOKED", target);
  res.json({ ok: true });
});
app.post("/api/documents/:id/access-requests", auth, doc, (req, res) => {
  if (req.doc.publication !== "PUBLISHED" || req.doc.deleted_at)
    return res.sendStatus(404);
  const reason = z.string().trim().min(5).max(1000).parse(req.body.reason);
  if (
    one(
      "SELECT id FROM access_requests WHERE user_id=? AND document_id=? AND status='pending'",
      req.user.id,
      req.doc.id,
    )
  )
    return res
      .status(409)
      .json({ error: "Bạn đã có một yêu cầu đang chờ xử lý." });
  const r = insert("access_requests", {
    id: id(),
    user_id: req.user.id,
    document_id: req.doc.id,
    reason,
    status: "pending",
    created_at: now(),
  });
  for (const u of managers(repoFor(req.doc)))
    notify(
      u.id,
      "Yêu cầu truy cập mới",
      `${req.user.name} đã gửi yêu cầu truy cập.`,
      req.doc.id,
    );
  audit(req.user, "ACCESS_REQUESTED", req.doc);
  res.status(201).json(r);
});
app.get("/api/access-requests", auth, (req, res) =>
  res.json(
    all(
      "SELECT r.*,u.name as user_name,u.email,d.name as document_name,d.folder_id FROM access_requests r JOIN users u ON u.id=r.user_id JOIN documents d ON d.id=r.document_id ORDER BY r.created_at DESC",
    )
      .filter((r) => r.user_id === req.user.id || canManage(req.user, r))
      .map((r) => ({ ...r, can_review: canManage(req.user, r) })),
  ),
);
app.patch("/api/access-requests/:id", auth, admin, (req, res) => {
  const r = one("SELECT * FROM access_requests WHERE id=?", req.params.id),
    d = r && one("SELECT * FROM documents WHERE id=?", r.document_id);
  if (!d || !canManage(req.user, d)) return res.sendStatus(403);
  if (r.status !== "pending")
    return res.status(409).json({ error: "Yêu cầu đã được xử lý." });
  const v = z
    .object({
      status: z.enum(["approved", "rejected"]),
      reason: z.string().max(1000).optional(),
      valid_until: z.iso.datetime().nullable().optional(),
      download: z.boolean().optional(),
    })
    .parse(req.body);
  transaction(() => {
    update("access_requests", r.id, {
      status: v.status,
      decision_reason: v.reason || "",
      reviewer_id: req.user.id,
      decided_at: now(),
    });
    if (v.status === "approved") {
      for (const action of v.download ? ["VIEW", "DOWNLOAD"] : ["VIEW"])
        addGrant(req.user, {
          subject_type: "USER",
          subject_id: r.user_id,
          target_type: "FILE",
          target_id: d.id,
          action,
          effect: "ALLOW",
          valid_until: v.valid_until || null,
        });
    }
    notify(
      r.user_id,
      v.status === "approved"
        ? "Yêu cầu đã được chấp thuận"
        : "Yêu cầu bị từ chối",
      v.reason || "Quyền truy cập đã được cập nhật.",
      d.id,
    );
    audit(req.user, "ACCESS_REQUEST_DECIDED", d, "success", {
      decision: v.status,
    });
  });
  res.json({ ok: true });
});
app.get("/api/approvals", auth, admin, (req, res) =>
  res.json(
    all(
      "SELECT a.*,d.name as document_name,d.folder_id,u.name as requester_name FROM approvals a JOIN documents d ON d.id=a.document_id LEFT JOIN users u ON u.id=a.requester_id ORDER BY a.created_at DESC",
    )
      .filter(
        (a) =>
          canManage(req.user, a) ||
          approvers(a.folder_id).includes(req.user.id),
      )
      .map((a) => ({
        ...a,
        can_approve:
          approvers(a.folder_id).includes(req.user.id) &&
          a.requester_id !== req.user.id,
      })),
  ),
);
app.post(
  "/api/documents/:id/publication",
  auth,
  doc,
  requireManage,
  (req, res) => {
    const action = z
      .enum(["draft", "submit", "publish"])
      .parse(req.body.action);
    if (
      action !== "draft" &&
      !["ready", "unsupported"].includes(req.doc.processing)
    )
      return res.status(409).json({
        error:
          "Tài liệu cần hoàn tất kiểm tra an toàn trước khi xuất bản hoặc gửi duyệt.",
      });
    if (action === "submit" && !approvers(req.doc.folder_id).length)
      return res
        .status(409)
        .json({ error: "Chưa cấu hình người phê duyệt cho thư mục này." });
    const status = {
      draft: "DRAFT",
      submit: "PENDING_APPROVAL",
      publish: "PUBLISHED",
    }[action];
    transaction(() => {
      update("documents", req.doc.id, {
        publication: status,
        updated_at: now(),
      });
      if (action === "submit") {
        if (
          one(
            "SELECT id FROM approvals WHERE document_id=? AND status='pending'",
            req.doc.id,
          )
        )
          throw Error("Đã có yêu cầu đang chờ duyệt.");
        insert("approvals", {
          id: id(),
          document_id: req.doc.id,
          requester_id: req.user.id,
          status: "pending",
          created_at: now(),
        });
        for (const u of approvers(req.doc.folder_id))
          notify(
            u,
            "Tài liệu cần phê duyệt",
            "Một tài liệu đã được gửi đến bạn.",
            req.doc.id,
          );
      }
      audit(req.user, "PUBLICATION_CHANGED", req.doc, "success", { status });
    });
    res.json({ ok: true });
  },
);
app.patch("/api/approvals/:id", auth, admin, (req, res) => {
  const a = one("SELECT * FROM approvals WHERE id=?", req.params.id),
    d = a && one("SELECT * FROM documents WHERE id=?", a.document_id);
  if (
    !d ||
    !approvers(d.folder_id).includes(req.user.id) ||
    a.requester_id === req.user.id
  )
    return res.status(403).json({
      error:
        "Bạn không thuộc danh sách người duyệt hoặc đang tự duyệt tài liệu của mình.",
    });
  if (a.status !== "pending")
    return res.status(409).json({ error: "Yêu cầu đã được xử lý." });
  const v = z
    .object({
      status: z.enum(["approved", "rejected"]),
      reason: z.string().max(1000).optional(),
    })
    .parse(req.body);
  if (v.status === "rejected" && !v.reason?.trim())
    return res.status(400).json({ error: "Vui lòng nhập lý do từ chối." });
  transaction(() => {
    update("approvals", a.id, {
      status: v.status,
      reason: v.reason || "",
      reviewer_id: req.user.id,
      decided_at: now(),
    });
    update("documents", d.id, {
      publication: v.status === "approved" ? "PUBLISHED" : "REJECTED",
      updated_at: now(),
    });
    notify(
      a.requester_id,
      "Kết quả phê duyệt tài liệu",
      v.status === "approved" ? "Tài liệu đã được xuất bản." : v.reason,
      d.id,
    );
    audit(req.user, "APPROVAL_DECIDED", d, "success", v);
  });
  res.json({ ok: true });
});
app.get("/api/notifications", auth, (req, res) =>
  res.json(
    all(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",
      req.user.id,
    ),
  ),
);
app.patch("/api/notifications/read", auth, (req, res) => {
  run(
    "UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL",
    now(),
    req.user.id,
  );
  res.json({ ok: true });
});
app.get("/api/users", auth, admin, (req, res) => {
  let users = all("SELECT * FROM users");
  if (req.user.role === "BOOK_ADMIN")
    users = users.filter((u) => u.role === "CUSTOMER");
  if (req.user.role === "MANAGER")
    users = users.filter((u) => ["EMPLOYEE", "MANAGER"].includes(u.role));
  if (req.user.role === "HR_ADMIN")
    users = users.filter((u) =>
      ["EMPLOYEE", "HR_ADMIN", "MANAGER"].includes(u.role),
    );
  res.json(users.map(publicUser));
});
app.post(
  "/api/users",
  auth,
  admin,
  wrap(async (req, res) => {
    const v = z
      .object({
        email: z.email().transform((s) => s.trim().toLowerCase()),
        name: z.string().trim().min(1).max(100),
        role: z.enum([
          "CUSTOMER",
          "EMPLOYEE",
          "BOOK_ADMIN",
          "HR_ADMIN",
          "MANAGER",
          "SUPER_ADMIN",
        ]),
        department: z.string().max(100).optional(),
        scope: z.string().optional(),
      })
      .parse(req.body);
    if (
      req.user.role !== "SUPER_ADMIN" &&
      !(
        (req.user.role === "BOOK_ADMIN" && v.role === "CUSTOMER") ||
        (req.user.role === "HR_ADMIN" && v.role === "EMPLOYEE")
      )
    )
      return res.sendStatus(403);
    if (one("SELECT id FROM users WHERE email=?", v.email))
      return res.status(409).json({
        error: "Email đã tồn tại. Hãy cấp thêm quyền cho tài khoản hiện có.",
      });
    const password = crypto.randomBytes(18).toString("base64url") + "A9!";
    const u = insert("users", {
      id: id(),
      ...v,
      department: v.department || "",
      scope: req.user.role === "SUPER_ADMIN" ? v.scope || "" : "",
      password: await bcrypt.hash(password, 12),
      must_change: 1,
      status: "active",
    });
    insert("email_outbox", {
      id: id(),
      recipient: u.email,
      subject: "Chào mừng đến với Bacnhabook",
      body: encryptMail(
        `Mật khẩu tạm thời: ${password}\nHãy đổi mật khẩu ngay khi đăng nhập.`,
      ),
      status: "pending",
      created_at: now(),
    });
    audit(req.user, "USER_CREATED", {
      id: u.id,
      name: u.email,
      repository_id: req.user.scope === "*" ? null : req.user.scope,
    });
    res.status(201).json({ ...publicUser(u), email_status: "pending" });
  }),
);
app.patch("/api/users/:id", auth, admin, (req, res) => {
  const u = one("SELECT * FROM users WHERE id=?", req.params.id);
  if (!u) return res.sendStatus(404);
  if (
    req.user.role !== "SUPER_ADMIN" &&
    !(req.user.role === "HR_ADMIN" && u.role === "EMPLOYEE") &&
    !(req.user.role === "BOOK_ADMIN" && u.role === "CUSTOMER")
  )
    return res.sendStatus(403);
  const v = z
    .object({
      status: z.enum(["active", "locked"]).optional(),
      department: z.string().max(100).optional(),
      role: z
        .enum([
          "CUSTOMER",
          "EMPLOYEE",
          "BOOK_ADMIN",
          "HR_ADMIN",
          "MANAGER",
          "SUPER_ADMIN",
        ])
        .optional(),
      scope: z.string().optional(),
    })
    .parse(req.body);
  if (req.user.role !== "SUPER_ADMIN" && (v.role || v.scope))
    return res.sendStatus(403);
  if (u.id === req.user.id)
    return res
      .status(400)
      .json({ error: "Không thể tự thay đổi vai trò hoặc khóa chính mình." });
  update("users", u.id, v);
  run("DELETE FROM sessions WHERE user_id=?", u.id);
  audit(req.user, "USER_UPDATED", { id: u.id, name: u.email });
  res.json({ ok: true });
});
app.post(
  "/api/imports/preview",
  auth,
  admin,
  upload.single("file"),
  wrap(async (req, res) => {
    if (!["SUPER_ADMIN", "BOOK_ADMIN"].includes(req.user.role))
      return res.sendStatus(403);
    if (!req.file)
      return res.status(400).json({ error: "Chọn file Excel hoặc CSV." });
    const workbook = new ExcelJS.Workbook();
    let worksheet;
    if (req.file.originalname.toLowerCase().endsWith(".csv")) {
      const { Readable } = await import("node:stream");
      worksheet = await workbook.csv.read(
        Readable.from(req.file.buffer.toString("utf8")),
      );
    } else {
      await workbook.xlsx.load(req.file.buffer);
      worksheet = workbook.worksheets[0];
    }
    if (!worksheet)
      return res.status(400).json({ error: "File không có trang tính." });
    const headers = worksheet.getRow(1).values;
    const rows = [];
    worksheet.eachRow((row, n) => {
      if (n === 1) return;
      const obj = {};
      row.eachCell((cell, col) => {
        obj[String(headers[col] || "")] =
          typeof cell.value === "object" ? cell.text : cell.value;
      });
      rows.push(obj);
    });
    const seen = new Set();
    const items = rows.map((r, i) => {
      const email = String(r.email || r.Email || r.EMAIL || "")
          .trim()
          .toLowerCase(),
        name = String(r.name || r.Name || r["Họ tên"] || email.split("@")[0]);
      let status = "new",
        error = "";
      if (!z.email().safeParse(email).success) {
        status = "invalid";
        error = "Email không hợp lệ";
      } else if (seen.has(email)) {
        status = "duplicate";
        error = "Trùng trong file";
      } else if (one("SELECT id FROM users WHERE email=?", email)) {
        status = "existing";
        error = "Tài khoản đã tồn tại";
      }
      seen.add(email);
      return { row: i + 2, email, name, status, error };
    });
    res.json({ items, total: items.length });
  }),
);
app.post(
  "/api/imports/commit",
  auth,
  admin,
  wrap(async (req, res) => {
    if (!["SUPER_ADMIN", "BOOK_ADMIN"].includes(req.user.role))
      return res.sendStatus(403);
    const v = z
      .object({
        items: z
          .array(z.object({ email: z.string(), name: z.string().max(100) }))
          .max(1000),
        folder_id: z.string().optional(),
        valid_until: z.iso.datetime().nullable().optional(),
      })
      .parse(req.body);
    if (v.folder_id) {
      const folder = one("SELECT * FROM folders WHERE id=?", v.folder_id);
      if (!folder || !canManage(req.user, folder)) return res.sendStatus(403);
    }
    const results = [];
    for (const item of v.items) {
      const email = item.email.trim().toLowerCase();
      if (!z.email().safeParse(email).success) {
        results.push({ email, status: "invalid" });
        continue;
      }
      let u = one("SELECT * FROM users WHERE email=?", email),
        status = "existing";
      if (u && u.role !== "CUSTOMER") {
        results.push({
          email,
          status: "invalid",
          error: "Chỉ gán quyền hàng loạt cho khách hàng.",
        });
        continue;
      }
      if (!u) {
        const password = crypto.randomBytes(18).toString("base64url") + "A9!";
        u = insert("users", {
          id: id(),
          name: item.name || email.split("@")[0],
          email,
          password: await bcrypt.hash(password, 12),
          role: "CUSTOMER",
          department: "",
          scope: "",
          status: "active",
          must_change: 1,
        });
        insert("email_outbox", {
          id: id(),
          recipient: email,
          subject: "Tài khoản Bacnhabook của bạn",
          body: encryptMail(
            `Mật khẩu tạm thời: ${password}\nVui lòng đổi mật khẩu lần đầu.`,
          ),
          status: "pending",
          created_at: now(),
        });
        status = "created";
      }
      if (v.folder_id)
        addGrant(req.user, {
          subject_type: "USER",
          subject_id: u.id,
          target_type: "FOLDER",
          target_id: v.folder_id,
          action: "VIEW",
          effect: "ALLOW",
          valid_until: v.valid_until || null,
        });
      results.push({ email, status });
    }
    audit(
      req.user,
      "CUSTOMERS_IMPORTED",
      { repository_id: "books" },
      "success",
      { count: results.length },
    );
    res.json({ items: results });
  }),
);
app.get("/api/trash", auth, admin, (req, res) => {
  const docs = all("SELECT * FROM documents WHERE deleted_at IS NOT NULL")
    .filter((d) => canManage(req.user, d))
    .map((d) => ({
      ...safeDoc(req.user, d),
      kind: "document",
      deleted_at: d.deleted_at,
    }));
  const folders = all("SELECT * FROM folders WHERE deleted_at IS NOT NULL")
    .filter((f) => canManage(req.user, f))
    .map((f) => ({ ...f, kind: "folder" }));
  res.json([...folders, ...docs]);
});
app.get("/api/audit", auth, admin, (req, res) => {
  let events = all("SELECT * FROM audit ORDER BY created_at DESC");
  if (req.user.role !== "SUPER_ADMIN")
    events = events.filter(
      (e) =>
        e.repository_id && req.user.scope.split(",").includes(e.repository_id),
    );
  if (req.query.q)
    events = events.filter((e) =>
      `${e.actor_name} ${e.action} ${e.target_name}`
        .toLowerCase()
        .includes(String(req.query.q).toLowerCase()),
    );
  res.json(events.slice(0, 500));
});
app.get("/api/dashboard", auth, admin, (req, res) => {
  const docs = all("SELECT * FROM documents WHERE deleted_at IS NULL").filter(
    (d) =>
      canManage(req.user, d) &&
      !ancestry(d.folder_id).some((f) => f.deleted_at),
  );
  const repos = all("SELECT * FROM repositories").filter((r) =>
    canManage(req.user, { repository_id: r.id }),
  );
  const events = all("SELECT * FROM audit")
    .filter(
      (e) =>
        req.user.role === "SUPER_ADMIN" ||
        (e.repository_id &&
          req.user.scope.split(",").includes(e.repository_id)),
    )
    .filter((e) => !req.query.from || e.created_at >= String(req.query.from));
  const bytes = docs.reduce((s, d) => s + d.size, 0);
  res.json({
    documents: docs.length,
    bytes,
    views: events.filter((e) => e.action === "DOCUMENT_VIEWED").length,
    downloads: events.filter((e) => e.action === "DOCUMENT_DOWNLOADED").length,
    pending: docs.filter((d) => d.publication === "PENDING_APPROVAL").length,
    storage_driver: remote() ? "Cloudflare R2" : "Lưu trữ cục bộ · Demo",
    repositories: repos.map((r) => ({
      ...r,
      bytes: docs
        .filter((d) => repoFor(d) === r.id)
        .reduce((s, d) => s + d.size, 0),
      count: docs.filter((d) => repoFor(d) === r.id).length,
    })),
    activity: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 86400000)
        .toISOString()
        .slice(0, 10);
      return {
        date,
        views: events.filter(
          (e) =>
            e.created_at.startsWith(date) && e.action === "DOCUMENT_VIEWED",
        ).length,
        uploads: events.filter(
          (e) =>
            e.created_at.startsWith(date) && e.action === "DOCUMENT_UPLOADED",
        ).length,
      };
    }),
    processing: all(
      "SELECT j.*,d.folder_id FROM jobs j JOIN documents d ON j.document_id=d.id",
    ).filter((j) => canManage(req.user, j)),
    email_pending:
      req.user.role === "SUPER_ADMIN"
        ? one("SELECT COUNT(*) as n FROM email_outbox WHERE status<>'sent'").n
        : null,
    threshold: setting("storage_alert_gb", 100),
    backup_status: "Chưa cấu hình lưu trữ độc lập",
  });
});
app.get("/api/settings", auth, root, (req, res) =>
  res.json({
    idle_minutes: setting("idle_minutes", 30),
    max_sessions: setting("max_sessions", 3),
    storage_alert_gb: setting("storage_alert_gb", 100),
    retention_days: setting("retention_days", null),
    storage_driver: remote() ? "r2" : "local",
    r2_configured: [
      "R2_ENDPOINT",
      "R2_BUCKET",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ].every((k) => !!process.env[k]),
    email_configured: !!process.env.EMAIL_API_URL,
    scanner_configured: !!process.env.CLAMSCAN_PATH,
    backup_configured: !!process.env.BACKUP_DIR,
    production: process.env.NODE_ENV === "production",
  }),
);
app.put("/api/settings", auth, root, (req, res) => {
  const v = z
    .object({
      idle_minutes: z.number().int().min(5).max(1440),
      max_sessions: z.number().int().min(1).max(20),
      storage_alert_gb: z.number().min(0.001),
      retention_days: z.number().int().min(1).max(3650).nullable(),
    })
    .parse(req.body);
  for (const [key, value] of Object.entries(v))
    run(
      "INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      key,
      JSON.stringify(value),
    );
  audit(req.user, "SETTINGS_UPDATED", null);
  res.json({ ok: true });
});
app.get("/api/export", auth, admin, (req, res) => {
  const events = all("SELECT * FROM audit ORDER BY created_at DESC").filter(
    (e) =>
      req.user.role === "SUPER_ADMIN" ||
      (e.repository_id && req.user.scope.split(",").includes(e.repository_id)),
  );
  const escape = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'")
      .replaceAll('"', '""') +
    '"';
  res
    .type("text/csv; charset=utf-8")
    .attachment("bacnhabook-audit.csv")
    .send(
      "\uFEFF" +
        [
          ["Thời gian", "Người thực hiện", "Thao tác", "Tài liệu", "Kết quả"],
          ...events.map((e) => [
            e.created_at,
            e.actor_name,
            e.action,
            e.target_name,
            e.outcome,
          ]),
        ]
          .map((r) => r.map(escape).join(","))
          .join("\r\n"),
    );
});
app.get("/api/health", (req, res) => {
  one("SELECT 1");
  res.json({
    status: "ok",
    database: "sqlite",
    storage: remote() ? "r2" : "local",
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
  });
});
app.get("/api/openapi.json", (req, res) =>
  res.sendFile(path.resolve("docs/openapi.json")),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Không tìm thấy API." }),
);
app.use((err, req, res, next) => {
  const validation = err instanceof z.ZodError;
  const status = validation
    ? 400
    : err instanceof multer.MulterError
      ? 413
      : 500;
  console.error(
    JSON.stringify({
      requestId: req.requestId,
      error: validation ? "validation" : err.code || err.name,
    }),
  );
  res.status(status).json({
    error: validation
      ? "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập."
      : err instanceof multer.MulterError
        ? "Vượt giới hạn kỹ thuật của lần upload (50 file, mặc định 100 MB/file)."
        : status === 500
          ? "Không thể hoàn tất thao tác. Vui lòng thử lại hoặc liên hệ quản trị."
          : err.message,
    requestId: req.requestId,
  });
});
export async function start() {
  await seed();
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.SERVE_BUILD !== "true"
  ) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: { port: Number(process.env.PORT || 3000) + 21678 },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    if (!fs.existsSync(path.resolve("dist/index.html"))) {
      throw new Error(
        "Chưa có bản build. Chạy npm run build trước khi khởi động.",
      );
    }
    app.use(express.static(path.resolve("dist")));
    app.get("/{*path}", (req, res) =>
      res.sendFile(path.resolve("dist/index.html")),
    );
  }
  return app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
    console.log(`Bacnhabook server ready on port ${process.env.PORT || 3000}`),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve("server/index.js")
)
  start();
