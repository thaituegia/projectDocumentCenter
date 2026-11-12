import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  db,
  dataDir,
  all,
  one,
  insert,
  transaction,
  indexDoc,
  now,
  audit,
} from "./db.js";
import { sampleGroups, sampleDocuments } from "./sample-catalog.js";

const fonts = Promise.all(
  ["latin", "vietnamese"].map(async (subset) => {
    const bytes = await fs.readFile(
      new URL(
        `../node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-${subset}-400-normal.woff`,
        import.meta.url,
      ),
    );
    return { bytes, coverage: new Set(fontkit.create(bytes).characterSet) };
  }),
);

export async function renderSamplePdf(content) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const source = await fonts;
  const embedded = await Promise.all(
    source.map((f) => pdf.embedFont(f.bytes, { subset: true })),
  );
  let page = pdf.addPage([595, 842]),
    y = 778;
  const newPage = () => {
    page = pdf.addPage([595, 842]);
    y = 778;
  };
  const fontFor = (c) =>
    source[0].coverage.has(c.codePointAt(0))
      ? 0
      : source[1].coverage.has(c.codePointAt(0))
        ? 1
        : -1;
  for (const [paragraphIndex, paragraph] of content.split("\n").entries()) {
    const size = paragraphIndex === 0 ? 17 : 10;
    if (!paragraph) {
      y -= 8;
      continue;
    }
    let line = [],
      width = 0;
    const drawLine = () => {
      if (y < 58) newPage();
      let x = 48;
      // Group adjacent glyphs that use the same Vietnamese/Latin subset.
      for (let i = 0; i < line.length;) {
        const fontIndex = line[i].fontIndex;
        let text = "";
        while (i < line.length && line[i].fontIndex === fontIndex)
          text += line[i++].char;
        page.drawText(text, {
          x,
          y,
          size,
          font: embedded[fontIndex],
          color:
            paragraphIndex === 0 ? rgb(0.05, 0.3, 0.5) : rgb(0.2, 0.22, 0.25),
        });
        x += embedded[fontIndex].widthOfTextAtSize(text, size);
      }
      y -= size * 1.65;
      line = [];
      width = 0;
    };
    // Word wrapping preserves readable text in the exported PDF.
    for (const word of paragraph.split(/(?<=\s)/u)) {
      const chars = [...word].map((char) => {
        const selected = fontFor(char);
        return {
          char: selected < 0 ? "?" : char,
          fontIndex: selected < 0 ? 0 : selected,
        };
      });
      const wordWidth = chars.reduce(
        (sum, c) => sum + embedded[c.fontIndex].widthOfTextAtSize(c.char, size),
        0,
      );
      if (width + wordWidth > 499 && line.length) drawLine();
      line.push(...chars);
      width += wordWidth;
    }
    if (line.length) drawLine();
  }
  pdf.setTitle(content.split("\n")[0]);
  pdf.setSubject("Synthetic UAT data, not real business records");
  return Buffer.from(await pdf.save());
}

export async function seedSampleData() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_SAMPLE_DATA === "false"
  )
    return { skipped: true };
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.ENABLE_SAMPLE_DATA !== "true"
  )
    return { skipped: true };
  if (one("SELECT key FROM settings WHERE key='sample-data-v1'"))
    return { retained: true };
  const accounts = new Map(
    all("SELECT * FROM users WHERE id LIKE 'role-demo-%'").map((u) => [
      u.role,
      u,
    ]),
  );
  for (const role of [
    "SUPER_ADMIN",
    "BOOK_ADMIN",
    "HR_ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "CUSTOMER",
  ]) {
    if (!accounts.has(role))
      throw Error(`Missing role demo account for sample data: ${role}`);
  }
  const roleFor = (repo) =>
    repo === "books"
      ? "BOOK_ADMIN"
      : repo === "hr"
        ? "HR_ADMIN"
        : repo === "marketing"
          ? "MANAGER"
          : "SUPER_ADMIN";
  const creatorFor = (repo) =>
    repo === "books"
      ? "book-admin"
      : repo === "hr"
        ? "hr-admin"
        : repo === "marketing"
          ? "manager"
          : "employee";
  const timestamp = now();
  for (const [slug, name, repository_id, parent_id] of sampleGroups) {
    const folderId = `uat-${slug}`;
    if (!one("SELECT id FROM folders WHERE id=?", parent_id))
      throw Error("Missing sample parent folder " + parent_id);
    if (!one("SELECT id FROM folders WHERE id=?", folderId))
      insert("folders", {
        id: folderId,
        name,
        repository_id,
        parent_id,
        description: "Dữ liệu mẫu UAT — không chứa thông tin thật",
        approvers: JSON.stringify([accounts.get(roleFor(repository_id)).id]),
        metadata_schema: "[]",
      });
  }
  await fs.mkdir(path.join(dataDir, "objects"), { recursive: true });
  const docs = sampleDocuments(new Date(timestamp));
  for (const fixture of docs) {
    if (one("SELECT id FROM documents WHERE id=?", fixture.id)) continue;
    const objectKey = `seed-${fixture.id}.pdf`,
      previewKey = `seed-${fixture.id}.txt`;
    const bytes = await renderSamplePdf(fixture.content);
    await fs.writeFile(path.join(dataDir, "objects", objectKey), bytes);
    await fs.writeFile(
      path.join(dataDir, "objects", previewKey),
      fixture.content,
    );
    let oldPdf, oldText, oldBytes;
    if (fixture.versioned) {
      oldPdf = `seed-${fixture.id}-v1.pdf`;
      oldText = `seed-${fixture.id}-v1.txt`;
      const oldContent =
        fixture.content +
        "\n\nPhiên bản 1: nội dung giả lập trước khi cập nhật. Bản hiện hành là phiên bản 2.";
      oldBytes = await renderSamplePdf(oldContent);
      await fs.writeFile(path.join(dataDir, "objects", oldPdf), oldBytes);
      await fs.writeFile(path.join(dataDir, "objects", oldText), oldContent);
    }
    transaction(() => {
      const doc = insert("documents", {
        id: fixture.id,
        name: fixture.title + ".pdf",
        folder_id: fixture.folderId,
        type: "PDF",
        mime: "application/pdf",
        size: bytes.length,
        description: `Dữ liệu mẫu: ${fixture.scenario}. Không sử dụng trong vận hành thật.`,
        access: fixture.access,
        downloadable: Number(fixture.downloadable),
        publication: fixture.publication,
        processing: "ready",
        object_key: objectKey,
        preview_key: previewKey,
        fulltext: fixture.content,
        version: fixture.versioned ? 2 : 1,
        metadata: JSON.stringify({
          dataset: "UAT-2026-11",
          scenario: fixture.scenario,
          ...(fixture.level ? { level: fixture.level } : {}),
        }),
        effective_from: fixture.effective_from,
        effective_until: fixture.effective_until,
        created_by: creatorFor(fixture.repository),
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: fixture.deleted ? timestamp : null,
      });
      if (fixture.versioned)
        insert("versions", {
          id: fixture.id + "-v1",
          document_id: doc.id,
          number: 1,
          object_key: oldPdf,
          preview_key: oldText,
          fulltext: fixture.content + "\nPhiên bản cũ",
          mime: doc.mime,
          size: oldBytes.length,
          created_by: doc.created_by,
          created_at: timestamp,
        });
      insert("versions", {
        id: fixture.id + `-v${doc.version}`,
        document_id: doc.id,
        number: doc.version,
        object_key: objectKey,
        preview_key: previewKey,
        fulltext: doc.fulltext,
        mime: doc.mime,
        size: doc.size,
        created_by: doc.created_by,
        created_at: timestamp,
      });
      indexDoc(doc);
      if (fixture.pending)
        insert("approvals", {
          id: fixture.id + "-approval",
          document_id: doc.id,
          requester_id: doc.created_by,
          status: "pending",
          created_at: timestamp,
        });
    });
  }
  transaction(() => {
    for (const [role, documentId, reason] of [
      [
        "CUSTOMER",
        "uat-hsk2-course-03",
        "Đề nghị cấp quyền bài đọc HSK 2 để hoàn thành kịch bản UAT.",
      ],
      [
        "EMPLOYEE",
        "uat-hr-records-01",
        "Yêu cầu thử nghiệm truy cập hồ sơ giả lập, không phải hồ sơ nhân sự thật.",
      ],
    ]) {
      const requestId = `uat-request-${role.toLowerCase()}`;
      if (!one("SELECT id FROM access_requests WHERE id=?", requestId))
        insert("access_requests", {
          id: requestId,
          user_id: accounts.get(role).id,
          document_id: documentId,
          reason,
          status: "pending",
          created_at: timestamp,
        });
    }
    for (const action of ["VIEW", "DOWNLOAD"]) {
      const grantId = `uat-deny-customer-${action.toLowerCase()}`;
      if (!one("SELECT id FROM grants WHERE id=?", grantId))
        insert("grants", {
          id: grantId,
          subject_type: "USER",
          subject_id: accounts.get("CUSTOMER").id,
          target_type: "FILE",
          target_id: "uat-hsk1-exercises-05",
          action,
          effect: "DENY",
          created_by: accounts.get("BOOK_ADMIN").id,
          created_at: timestamp,
        });
    }
    for (const account of accounts.values()) {
      const notificationId = `uat-ready-${account.id}`;
      if (!one("SELECT id FROM notifications WHERE id=?", notificationId))
        insert("notifications", {
          id: notificationId,
          user_id: account.id,
          title: "Bộ dữ liệu dùng thử đã sẵn sàng",
          message:
            "60 PDF mẫu và 12 thư mục đã được tạo. Hãy dùng checklist theo vai trò; không nhập thông tin thật.",
          created_at: timestamp,
        });
    }
    audit(
      { name: "Công cụ tạo dữ liệu dùng thử" },
      "SAMPLE_DATA_CREATED",
      null,
      "success",
      { dataset: "UAT-2026-11", documents: 60, folders: 12, synthetic: true },
    );
    db.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)").run(
      "sample-data-v1",
      JSON.stringify({ created_at: timestamp, documents: 60, folders: 12 }),
    );
  });
  return { documents: docs.length, folders: sampleGroups.length };
}
