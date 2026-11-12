import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import roleDemoAccounts from "./role-demo-accounts.json" with { type: "json" };
export const dataDir = path.resolve(process.env.DATA_DIR || ".data");
fs.mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(dataDir, "bacnhabook.sqlite"));
db.exec(
  fs.readFileSync(
    new URL("./migrations/001_initial.sql", import.meta.url),
    "utf8",
  ),
);

export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const all = (sql, ...args) => db.prepare(sql).all(...args);
export const one = (sql, ...args) => db.prepare(sql).get(...args);
export const run = (sql, ...args) => db.prepare(sql).run(...args);
export function insert(table, obj) {
  const keys = Object.keys(obj);
  run(
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    ...Object.values(obj),
  );
  return obj;
}
export function update(table, key, values) {
  const keys = Object.keys(values);
  if (keys.length)
    run(
      `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(",")} WHERE id=?`,
      ...Object.values(values),
      key,
    );
}
export function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export const setting = (key, fallback) => {
  const r = one("SELECT value FROM settings WHERE key=?", key);
  return r ? JSON.parse(r.value) : fallback;
};
export function indexDoc(doc) {
  run("DELETE FROM document_search WHERE document_id=?", doc.id);
  if (!doc.deleted_at)
    run(
      "INSERT INTO document_search(document_id,content) VALUES (?,?)",
      doc.id,
      doc.fulltext || "",
    );
}
export function audit(user, action, target, outcome = "success", details = {}) {
  let repo = target?.repository_id;
  if (!repo && target?.folder_id)
    repo = one(
      "SELECT repository_id FROM folders WHERE id=?",
      target.folder_id,
    )?.repository_id;
  insert("audit", {
    id: id(),
    actor_id: user?.id || null,
    actor_name: user?.name || "Khách",
    action,
    target_id: target?.id || null,
    target_name: target?.name || "",
    repository_id: repo || null,
    outcome,
    details: JSON.stringify(details),
    created_at: now(),
  });
}
export function notify(userId, title, message, documentId = null) {
  insert("notifications", {
    id: id(),
    user_id: userId,
    title,
    message,
    document_id: documentId,
    created_at: now(),
  });
}
export async function seed() {
  if (one("SELECT id FROM repositories LIMIT 1")) {
    seedRoleDemoAccounts();
    return;
  }
  if (process.env.NODE_ENV === "production") return;
  const timestamp = now();
  const repos = [
    [
      "books",
      "Học liệu Bacnhabook",
      "BACNHABOOK",
      "green",
      "Đồng hành trên hành trình chinh phục tiếng Trung",
    ],
    [
      "common",
      "Tài liệu công ty",
      "COMMON",
      "blue",
      "Quy trình, biểu mẫu và tri thức chung",
    ],
    ["hr", "Hành chính nhân sự", "HR", "purple", "Hồ sơ và chính sách nhân sự"],
    [
      "marketing",
      "Phòng Marketing",
      "DEPARTMENT",
      "orange",
      "Chiến dịch và tài sản thương hiệu",
    ],
  ];
  for (const [id, name, type, color, description] of repos)
    insert("repositories", { id, name, type, color, description });
  const pass = await bcrypt.hash(
    crypto.randomBytes(24).toString("base64url"),
    12,
  );
  for (const [id, name, email, role, department, scope] of [
    [
      "admin",
      "Minh Anh",
      "minhanh@example.test",
      "SUPER_ADMIN",
      "Điều hành",
      "*",
    ],
    [
      "book-admin",
      "Thu Hà",
      "thuha@example.test",
      "BOOK_ADMIN",
      "Bacnhabook",
      "books",
    ],
    [
      "hr-admin",
      "Ngọc Linh",
      "ngoclinh@example.test",
      "HR_ADMIN",
      "HCNS",
      "hr",
    ],
    [
      "manager",
      "Hoàng Nam",
      "hoangnam@example.test",
      "MANAGER",
      "Marketing",
      "marketing",
    ],
    ["employee", "Hải Yến", "haiyen@example.test", "EMPLOYEE", "Marketing", ""],
    ["customer", "Nguyễn An", "nguyenan@example.test", "CUSTOMER", "", ""],
  ])
    insert("users", {
      id,
      name,
      email,
      password: pass,
      role,
      department,
      scope,
      status: "active",
    });
  const folders = [
    [
      "hsk1",
      "HSK 1 – Khởi đầu",
      "books",
      null,
      "Làm quen tiếng Trung từ những điều đơn giản",
    ],
    [
      "hsk2",
      "HSK 2 – Nền tảng",
      "books",
      null,
      "Xây dựng nền tảng ngôn ngữ vững chắc",
    ],
    [
      "hsk3",
      "HSK 3 – Bứt phá",
      "books",
      null,
      "Nâng tầm khả năng giao tiếp của bạn",
    ],
    [
      "hsk4",
      "HSK 4 – Chinh phục",
      "books",
      null,
      "Tự tin sử dụng tiếng Trung mỗi ngày",
    ],
    [
      "culture",
      "Văn hóa & giao tiếp",
      "books",
      null,
      "Hiểu ngôn ngữ, kết nối văn hóa",
    ],
    [
      "teachers",
      "Tài nguyên giáo viên",
      "books",
      null,
      "Công cụ hữu ích cho những giờ dạy truyền cảm hứng",
    ],
    ["lesson1", "Bài 01 – Chào bạn", "books", "hsk1", ""],
    [
      "process",
      "Quy trình & biểu mẫu",
      "common",
      null,
      "Cùng làm việc hiệu quả hơn",
    ],
    ["policies", "Chính sách nhân sự", "hr", null, ""],
    ["campaign", "Chiến dịch 2027", "marketing", null, ""],
  ];
  for (const [id, name, repository_id, parent_id, description] of folders)
    insert("folders", {
      id,
      name,
      repository_id,
      parent_id,
      description,
      approvers: JSON.stringify([
        repository_id === "books"
          ? "book-admin"
          : repository_id === "hr"
            ? "hr-admin"
            : "manager",
      ]),
      metadata_schema: JSON.stringify(
        repository_id === "books"
          ? [
              {
                key: "level",
                label: "Cấp độ HSK",
                type: "select",
                choices: ["HSK 1", "HSK 2", "HSK 3", "HSK 4"],
                required: false,
              },
              {
                key: "author",
                label: "Tác giả",
                type: "text",
                required: false,
              },
            ]
          : [],
      ),
    });
  const fixtures = [
    [
      "d1",
      "Giáo trình HSK 1 – Bài 01: Chào bạn",
      "hsk1",
      "PDF",
      "PUBLIC",
      1,
      "PUBLISHED",
      "Học cách chào hỏi, giới thiệu bản thân và những mẫu câu đầu tiên.",
    ],
    [
      "d2",
      "Slide bài giảng HSK 1 – Bài 01",
      "hsk1",
      "PPTX",
      "PRIVATE",
      0,
      "PUBLISHED",
      "Bộ slide trực quan dành cho lớp học tiếng Trung sơ cấp.",
    ],
    [
      "d3",
      "Luyện nghe HSK 1 – Hội thoại chào hỏi",
      "hsk1",
      "AUDIO",
      "PRIVATE",
      1,
      "PUBLISHED",
      "Luyện nghe các đoạn hội thoại giao tiếp cơ bản.",
    ],
    [
      "d4",
      "Tập viết chữ Hán – 150 từ vựng HSK 1",
      "hsk1",
      "PDF",
      "PRIVATE",
      1,
      "PUBLISHED",
      "Tài liệu luyện viết và ghi nhớ những từ vựng nền tảng.",
    ],
    [
      "d5",
      "Sổ tay 300 từ vựng HSK 2",
      "hsk2",
      "PDF",
      "PUBLIC",
      1,
      "PUBLISHED",
      "Từ vựng theo chủ đề, ví dụ và hướng dẫn ôn tập.",
    ],
    [
      "d6",
      "Ngữ pháp HSK 3 – Tổng hợp kiến thức",
      "hsk3",
      "PDF",
      "PRIVATE",
      0,
      "PUBLISHED",
      "Hệ thống ngữ pháp và bài tập ứng dụng theo từng chủ điểm.",
    ],
    [
      "d7",
      "Giao tiếp tiếng Trung trong công việc",
      "hsk4",
      "VIDEO",
      "PRIVATE",
      0,
      "PUBLISHED",
      "Các tình huống giao tiếp trong môi trường làm việc.",
    ],
    [
      "d8",
      "Khám phá văn hóa trà Trung Hoa",
      "culture",
      "PDF",
      "PUBLIC",
      1,
      "PUBLISHED",
      "Một hành trình nhỏ qua những câu chuyện văn hóa và ngôn ngữ.",
    ],
    [
      "d9",
      "Kế hoạch giảng dạy HSK 1",
      "teachers",
      "DOCX",
      "PRIVATE",
      1,
      "PENDING_APPROVAL",
      "Kế hoạch bài giảng dành cho giáo viên.",
    ],
    [
      "d10",
      "Quy trình làm việc & phối hợp nội bộ",
      "process",
      "PDF",
      "PRIVATE",
      1,
      "PUBLISHED",
      "Hướng dẫn phối hợp giữa các phòng ban.",
    ],
    [
      "d11",
      "Chính sách nghỉ phép năm 2026",
      "policies",
      "PDF",
      "PRIVATE",
      0,
      "PUBLISHED",
      "Chính sách và biểu mẫu nhân sự.",
    ],
    [
      "d12",
      "Kế hoạch truyền thông quý I/2027",
      "campaign",
      "DOCX",
      "PRIVATE",
      1,
      "DRAFT",
      "Kế hoạch chiến dịch và các đầu việc cần triển khai.",
    ],
  ];
  fs.mkdirSync(path.join(dataDir, "objects"), { recursive: true });
  const { default: PDFDocument } = await import("pdfkit");
  for (let n = 0; n < fixtures.length; n++) {
    const [
      docId,
      name,
      folder_id,
      type,
      access,
      downloadable,
      publication,
      description,
    ] = fixtures[n];
    const content = `${name}\n\n${description}\n\nTài liệu minh họa Bacnhabook\n\nBài 01 · Chào bạn\nMục tiêu bài học\n• Làm quen với ngôn ngữ và cách học chủ động.\n• Luyện tập mỗi ngày, ghi nhớ theo ngữ cảnh.\n• Kết nối kiến thức với tình huống thực tế.\n\nXin chào — 你好 — Nǐ hǎo\nCảm ơn — 谢谢 — Xièxie\nTạm biệt — 再见 — Zàijiàn\n\nBài tập thực hành\n1. Giới thiệu tên và sở thích của bạn.\n2. Luyện đọc các mẫu câu cùng một người bạn.\n3. Viết lại ba điều bạn đã học hôm nay.\n\nĐây là nội dung mẫu để trải nghiệm hệ thống, không phải học liệu thương mại chính thức.`;
    const key = `seed-${docId}.pdf`;
    await new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ size: "A4", margin: 60 });
      const stream = fs.createWriteStream(path.join(dataDir, "objects", key));
      pdf.pipe(stream);
      pdf.fontSize(24).text("BACNHABOOK");
      pdf
        .moveDown()
        .fontSize(14)
        .text(`Sample learning material ${n + 1}`);
      pdf
        .moveDown()
        .fontSize(12)
        .text(
          "Hello - Ni hao\n\nWelcome to your learning journey.\n\nThis is a sample document for development and acceptance testing.\n\n1. Introduce yourself\n2. Practice new vocabulary\n3. Review your progress",
        );
      pdf.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
    // Seed previews are separate text renditions, never original objects.
    const previewKey = `seed-${docId}.txt`;
    fs.writeFileSync(path.join(dataDir, "objects", previewKey), content);
    const created = new Date(Date.now() - (n + 1) * 86400000).toISOString();
    insert("documents", {
      id: docId,
      name,
      folder_id,
      type,
      mime: "application/pdf",
      size: fs.statSync(path.join(dataDir, "objects", key)).size,
      description,
      access,
      downloadable,
      publication,
      processing:
        type === "AUDIO" || type === "VIDEO" ? "unsupported" : "ready",
      object_key: key,
      preview_key: previewKey,
      fulltext: content,
      version: 1,
      metadata: JSON.stringify({
        level: "HSK " + (folder_id.match(/\d/)?.[0] || "1"),
        author: "Bacnhabook",
      }),
      created_by: "book-admin",
      created_at: created,
      updated_at: created,
    });
    const doc = one("SELECT * FROM documents WHERE id=?", docId);
    indexDoc(doc);
    insert("versions", {
      id: id(),
      document_id: docId,
      number: 1,
      object_key: key,
      preview_key: previewKey,
      fulltext: content,
      mime: doc.mime,
      size: doc.size,
      created_at: created,
      created_by: "book-admin",
    });
    audit({ id: "book-admin", name: "Thu Hà" }, "DOCUMENT_CREATED", doc);
  }
  for (const u of all(
    "SELECT * FROM users WHERE role IN ('SUPER_ADMIN','BOOK_ADMIN','HR_ADMIN','MANAGER')",
  ))
    for (const f of all("SELECT * FROM folders WHERE parent_id IS NULL")) {
      if (u.role === "SUPER_ADMIN" || u.scope === f.repository_id)
        for (const action of ["VIEW", "DOWNLOAD"])
          insert("grants", {
            id: id(),
            subject_type: "USER",
            subject_id: u.id,
            target_type: "FOLDER",
            target_id: f.id,
            action,
            effect: "ALLOW",
            created_by: "admin",
            created_at: timestamp,
          });
    }
  for (const target of ["hsk1", "hsk2"])
    for (const action of ["VIEW", "DOWNLOAD"])
      insert("grants", {
        id: id(),
        subject_type: "USER",
        subject_id: "customer",
        target_type: "FOLDER",
        target_id: target,
        action,
        effect: "ALLOW",
        created_by: "admin",
        created_at: timestamp,
      });
  for (const target of ["campaign", "process"])
    for (const action of ["VIEW", "DOWNLOAD"])
      insert("grants", {
        id: id(),
        subject_type: "DEPARTMENT",
        subject_id: "Marketing",
        target_type: "FOLDER",
        target_id: target,
        action,
        effect: "ALLOW",
        created_by: "admin",
        created_at: timestamp,
      });
  insert("access_requests", {
    id: id(),
    user_id: "customer",
    document_id: "d6",
    reason: "Tôi muốn ôn tập để chuẩn bị cho kỳ thi HSK 3 sắp tới.",
    status: "pending",
    created_at: timestamp,
  });
  insert("approvals", {
    id: id(),
    document_id: "d9",
    requester_id: "admin",
    status: "pending",
    created_at: timestamp,
  });
  notify(
    "admin",
    "Chào mừng đến với không gian tri thức",
    "Khám phá kho học liệu và tổ chức tài liệu của bạn.",
  );
  notify(
    "admin",
    "Có yêu cầu truy cập mới",
    "Nguyễn An đã gửi một yêu cầu truy cập học liệu.",
    "d6",
  );
  notify(
    "book-admin",
    "Tài liệu đang chờ phê duyệt",
    "Một tài liệu mới đã được gửi đến bạn.",
    "d9",
  );
  for (const doc of ["d1", "d5"])
    run("INSERT INTO favorites VALUES (?,?)", "admin", doc);
  seedRoleDemoAccounts();
}

export function seedRoleDemoAccounts() {
  if (process.env.NODE_ENV === "production") return;
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.ENABLE_ROLE_DEMO_ACCOUNTS !== "true"
  )
    return;
  transaction(() => {
    for (const account of roleDemoAccounts) {
      // Preserve password changes, locks and revoked grants on later starts.
      if (
        one(
          "SELECT id FROM users WHERE email=? OR id=?",
          account.email,
          account.id,
        )
      )
        continue;
      insert("users", { ...account, status: "active", must_change: 1 });
      const folders =
        account.role === "CUSTOMER"
          ? all("SELECT id FROM folders WHERE id='hsk1' AND deleted_at IS NULL")
          : all(
              "SELECT id, repository_id FROM folders WHERE parent_id IS NULL AND deleted_at IS NULL",
            ).filter((folder) => {
              if (account.role === "SUPER_ADMIN") return true;
              const scope =
                account.role === "EMPLOYEE"
                  ? ["common", "marketing"]
                  : [account.scope, "common"];
              return scope.includes(folder.repository_id);
            });
      for (const folder of folders)
        for (const action of ["VIEW", "DOWNLOAD"]) {
          insert("grants", {
            id: id(),
            subject_type: "USER",
            subject_id: account.id,
            target_type: "FOLDER",
            target_id: folder.id,
            action,
            effect: "ALLOW",
            created_at: now(),
          });
        }
      audit({ name: "Khởi tạo tài khoản demo" }, "DEMO_USER_CREATED", {
        id: account.id,
        name: account.email,
      });
    }
  });
}
