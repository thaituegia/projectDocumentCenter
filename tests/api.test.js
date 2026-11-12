import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  PDFDocument,
  PDFArray,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";
process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "bacnha-test-"));
process.env.NODE_ENV = "test";
const { app } = await import("../server/index.js");
const { db, seed, all, one, insert, run, update, id, now, indexDoc } =
  await import("../server/db.js");
const { can, ancestry, lifecycle } = await import("../server/authz.js");
const { decryptMail } = await import("../server/mail.js");
const { processOne } = await import("../server/worker.js");
const { putObject } = await import("../server/storage.js");
const ExcelJS = (await import("exceljs")).default;
await seed();
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
function client(portal = "internal") {
  let cookie = "",
    csrf = "";
  return {
    async call(url, options = {}) {
      const headers = { ...options.headers };
      if (cookie) headers.Cookie = cookie;
      if (csrf) headers["X-CSRF-Token"] = csrf;
      if (options.body && !(options.body instanceof FormData))
        headers["Content-Type"] = "application/json";
      const res = await fetch(
        base + (portal === "customer" ? "/customer" : "") + url,
        {
          ...options,
          headers,
          body:
            options.body instanceof FormData
              ? options.body
              : options.body
                ? JSON.stringify(options.body)
                : undefined,
        },
      );
      if (res.headers.has("set-cookie"))
        cookie = res.headers.get("set-cookie").split(";")[0];
      const type = res.headers.get("content-type") || "";
      const rawBytes = type.includes("json")
        ? null
        : Buffer.from(await res.arrayBuffer());
      const body = rawBytes ? rawBytes.toString("utf8") : await res.json();
      if (body.csrf) csrf = body.csrf;
      return { status: res.status, body, rawBytes };
    },
    async login(userId) {
      return this.call("/dev/session", { method: "POST", body: { userId } });
    },
    clearCsrf() {
      csrf = "";
    },
  };
}
const admin = client(),
  guest = client("customer"),
  customer = client("customer"),
  book = client(),
  employee = client(),
  manager = client();
await admin.login("admin");
await customer.login("customer");
await book.login("book-admin");
await employee.login("employee");
await manager.login("manager");
await test("Bacnhabook functional API and permission regression suite", async (t) => {
  await t.test("Health checks the database", async () => {
    const r = await guest.call("/health");
    assert.equal(r.status, 200);
    assert.equal(r.body.status, "ok");
  });
  await t.test(
    "Guest can list Private names but cannot receive protected metadata",
    async () => {
      const r = await guest.call("/documents?repository=books");
      const d = r.body.items.find((d) => d.id === "d2");
      assert.equal(d.can_view, false);
      for (const key of [
        "description",
        "metadata",
        "fulltext",
        "object_key",
        "preview_key",
        "size",
      ])
        assert.equal(d[key], undefined, key);
    },
  );
  await t.test("Guest can read a Public published preview", async () => {
    const r = await guest.call("/documents/d1/preview");
    assert.equal(r.status, 200);
    assert.ok(r.body.content.includes("Tài liệu minh họa"));
    assert.equal(r.body.object_key, undefined);
    assert.equal(r.body.watermark_brand, "BÁC NHÃ BOOKS · THANHMAIHSK");
    assert.equal(r.body.watermark, "Khách · Guest");
    assert.equal(r.body.watermark_enabled, true);
    const anonymousInternal = await client().call("/documents/d1/preview");
    assert.equal(anonymousInternal.status, 401);
  });
  await t.test(
    "All internal roles preview and download without watermark",
    async () => {
      const original = await admin.call("/documents/d1/original");
      for (const userId of [
        "admin",
        "book-admin",
        "hr-admin",
        "manager",
        "employee",
      ]) {
        const internal = client();
        await internal.login(userId);
        const grantId = id();
        insert("grants", {
          id: grantId,
          subject_type: "USER",
          subject_id: userId,
          target_type: "FILE",
          target_id: "d1",
          action: "DOWNLOAD",
          effect: "ALLOW",
          created_at: now(),
        });
        try {
          const preview = await internal.call("/documents/d1/preview");
          assert.equal(preview.status, 200, userId);
          assert.equal(preview.body.watermark_enabled, false, userId);
          assert.equal(preview.body.watermark, null, userId);
          assert.equal(preview.body.watermark_brand, null, userId);
          const download = await internal.call("/documents/d1/download");
          assert.equal(download.status, 200, userId);
          assert.deepEqual(download.rawBytes, original.rawBytes, userId);
        } finally {
          run("DELETE FROM grants WHERE id=?", grantId);
        }
      }
    },
  );
  await t.test(
    "Guest cannot read Private preview by manually calling API",
    async () => {
      assert.equal((await guest.call("/documents/d2/preview")).status, 403);
    },
  );
  await t.test("VIEW-only has no original download path", async () => {
    assert.equal((await customer.call("/documents/d2/preview")).status, 200);
    assert.equal((await customer.call("/documents/d2/download")).status, 403);
    assert.equal((await customer.call("/documents/d2/original")).status, 403);
  });
  await t.test(
    "DOWNLOAD requires document policy and explicit ACL",
    async () => {
      assert.equal((await customer.call("/documents/d1/download")).status, 200);
      assert.equal((await guest.call("/documents/d1/download")).status, 403);
    },
  );
  await t.test(
    "PDF delivery is watermarked on every page and preserves the stored original",
    async () => {
      const original = await admin.call("/documents/d1/original");
      const download = await customer.call(
        "/documents/d1/download?watermark=false",
      );
      assert.equal(original.status, 200);
      assert.equal(download.status, 200);
      assert.notDeepEqual(download.rawBytes, original.rawBytes);
      const sourcePdf = await PDFDocument.load(original.rawBytes);
      const deliveredPdf = await PDFDocument.load(download.rawBytes);
      assert.equal(deliveredPdf.getPageCount(), sourcePdf.getPageCount());
      for (const page of deliveredPdf.getPages()) {
        const contents = page.node.Contents();
        const streams =
          contents instanceof PDFArray
            ? contents.asArray().map((ref) => deliveredPdf.context.lookup(ref))
            : [contents];
        const drawn = streams
          .filter((s) => s instanceof PDFRawStream)
          .map((s) =>
            Buffer.from(decodePDFRawStream(s).decode()).toString("latin1"),
          )
          .join("\n");
        assert.ok(
          (drawn.match(/Tj/g) || []).length >= 6,
          "two watermark blocks with brand names and identity per page",
        );
        assert.ok(
          drawn.includes("0.59 0.08 0.17 rg"),
          "ThanhmaiHSK watermark uses its red brand color",
        );
      }
      const unchanged = await admin.call("/documents/d1/original");
      assert.deepEqual(unchanged.rawBytes, original.rawBytes);
      const preview = await customer.call("/documents/d1/preview");
      assert.equal(preview.body.watermark, "nguyenan@example.test");
      assert.equal(preview.body.watermark_enabled, true);
    },
  );
  await t.test(
    "An unreadable PDF cannot bypass delivery watermarking",
    async () => {
      const doc = one("SELECT * FROM documents WHERE id=?", "d1");
      const key = `test-invalid-${id()}.pdf`;
      await putObject(key, Buffer.from("not a PDF"), "application/pdf");
      try {
        update("documents", doc.id, { object_key: key });
        const response = await customer.call("/documents/d1/download");
        assert.equal(response.status, 422);
        assert.match(response.body.error, /watermark/);
      } finally {
        update("documents", doc.id, { object_key: doc.object_key });
      }
    },
  );
  await t.test("Ancestor Deny overrides a direct Allow", async () => {
    const grant = insert("grants", {
      id: id(),
      subject_type: "USER",
      subject_id: "customer",
      target_type: "FOLDER",
      target_id: "hsk1",
      action: "VIEW",
      effect: "DENY",
      created_at: now(),
    });
    assert.equal((await customer.call("/documents/d1/preview")).status, 403);
    run("DELETE FROM grants WHERE id=?", grant.id);
    assert.equal((await customer.call("/documents/d1/preview")).status, 200);
  });
  await t.test(
    "Expired Allow and future Allow are ignored without a scheduler",
    async () => {
      const user = one("SELECT * FROM users WHERE id=?", "customer"),
        d = one("SELECT * FROM documents WHERE id=?", "d6");
      for (const range of [
        { valid_until: "2020-01-01T00:00:00.000Z" },
        { valid_from: "2099-01-01T00:00:00.000Z" },
      ]) {
        const grant = insert("grants", {
          id: id(),
          subject_type: "USER",
          subject_id: user.id,
          target_type: "FILE",
          target_id: d.id,
          action: "VIEW",
          effect: "ALLOW",
          ...range,
        });
        assert.equal(can(user, d, "VIEW"), false);
        run("DELETE FROM grants WHERE id=?", grant.id);
      }
    },
  );
  await t.test(
    "Department Allow and individual Deny are recomputed live",
    async () => {
      const user = one("SELECT * FROM users WHERE id=?", "employee"),
        d = one("SELECT * FROM documents WHERE id=?", "d10");
      assert.equal(can(user, d, "VIEW"), true);
      const grant = insert("grants", {
        id: id(),
        subject_type: "USER",
        subject_id: user.id,
        target_type: "FILE",
        target_id: d.id,
        action: "VIEW",
        effect: "DENY",
      });
      assert.equal(can(user, d, "VIEW"), false);
      run("DELETE FROM grants WHERE id=?", grant.id);
      assert.equal(can({ ...user, department: "Finance" }, d, "VIEW"), false);
    },
  );
  await t.test("Bacnhabook admin cannot mutate HR documents", async () => {
    assert.equal(
      (
        await book.call("/documents/d11", {
          method: "PATCH",
          body: { name: "illegal" },
        })
      ).status,
      403,
    );
    assert.equal((await book.call("/documents/d11/original")).status, 403);
    assert.equal((await book.call("/settings")).status, 403);
  });
  await t.test("Bacnhabook admin cannot assign a privileged role", async () => {
    assert.equal(
      (
        await book.call("/users", {
          method: "POST",
          body: {
            name: "Evil",
            email: "evil@example.test",
            role: "SUPER_ADMIN",
          },
        })
      ).status,
      403,
    );
  });
  await t.test(
    "Search cannot reveal unauthorized fulltext matches or snippets",
    async () => {
      const marker = "UNIQUE_PRIVATE_MARKER";
      update("documents", "d6", { fulltext: marker });
      const r = await guest.call("/documents?q=" + marker);
      assert.equal(r.body.items.length, 0);
      const a = await admin.call("/documents?q=" + marker);
      assert.ok(a.body.items.some((d) => d.id === "d6"));
      assert.equal(a.body.items[0].fulltext, undefined);
    },
  );
  await t.test("CSRF is required on authenticated mutations", async () => {
    const c = client();
    await c.login("admin");
    c.clearCsrf();
    assert.equal(
      (
        await c.call("/folders", {
          method: "POST",
          body: { name: "Bad", repository_id: "books" },
        })
      ).status,
      403,
    );
  });
  let folderId;
  await t.test("Create folder and reject duplicate names", async () => {
    const body = {
      name: "API test folder",
      repository_id: "books",
      parent_id: "hsk1",
    };
    const r = await admin.call("/folders", { method: "POST", body });
    assert.equal(r.status, 201);
    folderId = r.body.id;
    assert.equal(
      (await admin.call("/folders", { method: "POST", body })).status,
      409,
    );
  });
  await t.test("Folder cannot be moved into its own descendant", async () => {
    assert.equal(
      (
        await admin.call("/folders/hsk1", {
          method: "PATCH",
          body: { parent_id: folderId },
        })
      ).status,
      400,
    );
  });
  await t.test("Scope is checked for folder creation", async () => {
    assert.equal(
      (
        await manager.call("/folders", {
          method: "POST",
          body: { name: "Unauthorized", repository_id: "books" },
        })
      ).status,
      403,
    );
  });
  await t.test(
    "Parent folder deletion hides subtree and documents",
    async () => {
      await admin.call("/folders/hsk1", { method: "DELETE" });
      let r = await customer.call("/documents?folder=hsk1");
      assert.equal(r.body.items.length, 0);
      assert.equal((await customer.call("/documents/d1/preview")).status, 403);
      await admin.call("/folders/hsk1/restore", { method: "POST" });
      r = await customer.call("/documents?folder=hsk1");
      assert.ok(r.body.items.length > 0);
    },
  );
  await t.test("Favorites persist on the server", async () => {
    await customer.call("/documents/d1/favorite", { method: "POST" });
    const r = await customer.call("/documents?favorite=true");
    assert.ok(r.body.items.some((d) => d.id === "d1"));
    await customer.call("/documents/d1/favorite", { method: "POST" });
  });
  await t.test(
    "Access request is idempotent while pending; approval grants access",
    async () => {
      const first = await customer.call("/documents/d7/access-requests", {
        method: "POST",
        body: { reason: "Tôi cần nội dung để học tập." },
      });
      assert.equal(first.status, 201);
      assert.equal(
        (
          await customer.call("/documents/d7/access-requests", {
            method: "POST",
            body: { reason: "Tôi cần nội dung để học tập." },
          })
        ).status,
        409,
      );
      const r = await admin.call("/access-requests/" + first.body.id, {
        method: "PATCH",
        body: { status: "approved", download: false },
      });
      assert.equal(r.status, 200);
      const d = await customer.call("/documents/d7");
      assert.equal(d.body.can_view, true);
    },
  );
  await t.test(
    "New account stores only a password hash and encrypted email body",
    async () => {
      const r = await book.call("/users", {
        method: "POST",
        body: {
          name: "Test Customer",
          email: "new@example.test",
          role: "CUSTOMER",
        },
      });
      assert.equal(r.status, 201);
      assert.equal(r.body.password, undefined);
      assert.equal(r.body.must_change, true);
      const email = one(
        "SELECT * FROM email_outbox WHERE recipient=?",
        "new@example.test",
      );
      assert.equal(email.body.includes("Mật khẩu"), false);
      assert.ok(decryptMail(email.body).includes("Mật khẩu tạm thời"));
    },
  );
  await t.test(
    "Duplicate customer creation does not reset password or email",
    async () => {
      const before = one("SELECT COUNT(*) as n FROM email_outbox").n;
      const r = await book.call("/users", {
        method: "POST",
        body: {
          name: "Test Customer",
          email: "new@example.test",
          role: "CUSTOMER",
        },
      });
      assert.equal(r.status, 409);
      assert.equal(one("SELECT COUNT(*) as n FROM email_outbox").n, before);
    },
  );
  await t.test(
    "Forced initial password change blocks private APIs and revokes old password",
    async () => {
      const mail = one(
        "SELECT * FROM email_outbox WHERE recipient=?",
        "new@example.test",
      );
      const password = decryptMail(mail.body).split("\n")[0].split(": ")[1];
      const c = client("customer");
      const login = await c.call("/auth/login", {
        method: "POST",
        body: { email: "new@example.test", password },
      });
      assert.equal(login.status, 200);
      assert.equal((await c.call("/documents/d2/preview")).status, 403);
      assert.equal(
        (
          await c.call("/auth/change-password", {
            method: "POST",
            body: { current_password: password, password: "short" },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await c.call("/auth/change-password", {
            method: "POST",
            body: {
              current_password: password,
              password: "A-new-strong-Password-2026",
            },
          })
        ).status,
        200,
      );
      assert.equal((await c.call("/auth/me")).body.user.must_change, false);
      const old = client("customer");
      assert.equal(
        (
          await old.call("/auth/login", {
            method: "POST",
            body: { email: "new@example.test", password },
          })
        ).status,
        401,
      );
    },
  );
  await t.test(
    "Locking an employee invalidates existing sessions",
    async () => {
      const c = client();
      await c.login("employee");
      assert.ok((await c.call("/auth/me")).body.user);
      await admin.call("/users/employee", {
        method: "PATCH",
        body: { status: "locked" },
      });
      assert.equal((await c.call("/auth/me")).body.user, null);
      await admin.call("/users/employee", {
        method: "PATCH",
        body: { status: "active" },
      });
    },
  );
  await t.test(
    "Approval requires assigned reviewer and prevents self-approval",
    async () => {
      const a = one(
        "SELECT * FROM approvals WHERE document_id='d9' AND status='pending'",
      );
      assert.equal(
        (
          await manager.call("/approvals/" + a.id, {
            method: "PATCH",
            body: { status: "approved" },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await admin.call("/approvals/" + a.id, {
            method: "PATCH",
            body: { status: "approved" },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await book.call("/approvals/" + a.id, {
            method: "PATCH",
            body: { status: "rejected" },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await book.call("/approvals/" + a.id, {
            method: "PATCH",
            body: { status: "approved" },
          })
        ).status,
        200,
      );
      assert.equal(
        one("SELECT publication FROM documents WHERE id=?", "d9").publication,
        "PUBLISHED",
      );
    },
  );
  await t.test(
    "Upload preserves nested paths and remains inaccessible before scan",
    async () => {
      const form = new FormData();
      form.set("folder_id", "hsk1");
      form.set("paths", JSON.stringify(["Nested/Sample.txt"]));
      form.set("publication", "PUBLISHED");
      form.append(
        "files",
        new Blob(["hello private upload"], { type: "text/plain" }),
        "Sample.txt",
      );
      const r = await admin.call("/uploads", { method: "POST", body: form });
      assert.equal(r.status, 201);
      const d = one("SELECT * FROM documents WHERE id=?", r.body.items[0].id);
      assert.equal(d.processing, "pending_scan");
      assert.equal(d.publication, "DRAFT");
      assert.equal(ancestry(d.folder_id)[0].name, "Nested");
      assert.equal(
        (await customer.call("/documents/" + d.id + "/preview")).status,
        404,
      );
      assert.equal(
        (
          await admin.call("/documents/" + d.id + "/publication", {
            method: "POST",
            body: { action: "publish" },
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "Missing scanner fails closed and records a retryable job error",
    async () => {
      delete process.env.CLAMSCAN_PATH;
      assert.equal(await processOne(), true);
      const j = one("SELECT * FROM jobs WHERE status='failed'");
      assert.ok(j.error.includes("SCANNER_NOT_CONFIGURED"));
      assert.equal(
        one("SELECT processing FROM documents WHERE id=?", j.document_id)
          .processing,
        "pending_scan",
      );
    },
  );
  await t.test(
    "Metadata types and effective date ranges are validated",
    async () => {
      assert.equal(
        (
          await admin.call("/documents/d1", {
            method: "PATCH",
            body: {
              effective_from: "2026-12-10T00:00:00.000Z",
              effective_until: "2026-12-01T00:00:00.000Z",
            },
          })
        ).status,
        400,
      );
      assert.equal(
        lifecycle({ effective_until: "2020-01-01T00:00:00.000Z" }),
        "EXPIRED",
      );
      assert.equal(
        lifecycle({ effective_from: "2099-01-01T00:00:00.000Z" }),
        "SCHEDULED",
      );
    },
  );
  await t.test(
    "Soft delete and restore preserve grants, metadata, and versions",
    async () => {
      const before = one("SELECT * FROM documents WHERE id=?", "d1");
      await admin.call("/documents/d1", { method: "DELETE" });
      assert.equal((await customer.call("/documents/d1/preview")).status, 404);
      await admin.call("/documents/d1/restore", { method: "POST" });
      const after = one("SELECT * FROM documents WHERE id=?", "d1");
      assert.equal(before.metadata, after.metadata);
      assert.equal(before.version, after.version);
      assert.equal((await customer.call("/documents/d1/preview")).status, 200);
    },
  );
  await t.test(
    "Excel import previews invalid and duplicate rows, commits idempotently",
    async () => {
      const wb = new ExcelJS.Workbook(),
        sheet = wb.addWorksheet("Customers");
      sheet.addRows([
        ["email", "name"],
        ["imported@example.test", "Imported"],
        ["imported@example.test", "Duplicate"],
        ["bad", "Invalid"],
        ["new@example.test", "Existing"],
      ]);
      const form = new FormData();
      form.append(
        "file",
        new Blob([await wb.xlsx.writeBuffer()]),
        "customers.xlsx",
      );
      const preview = await book.call("/imports/preview", {
        method: "POST",
        body: form,
      });
      assert.equal(preview.status, 200);
      assert.deepEqual(
        preview.body.items.map((i) => i.status),
        ["new", "duplicate", "invalid", "existing"],
      );
      const body = {
        items: [{ email: "imported@example.test", name: "Imported" }],
        folder_id: "hsk1",
      };
      await book.call("/imports/commit", { method: "POST", body });
      const before = one("SELECT COUNT(*) as n FROM email_outbox").n;
      await book.call("/imports/commit", { method: "POST", body });
      assert.equal(one("SELECT COUNT(*) as n FROM email_outbox").n, before);
      const u = one(
        "SELECT * FROM users WHERE email=?",
        "imported@example.test",
      );
      assert.equal(
        one(
          "SELECT COUNT(*) as n FROM grants WHERE subject_id=? AND target_id=?",
          u.id,
          "hsk1",
        ).n,
        1,
      );
    },
  );
  await t.test(
    "Notification endpoints only return the current account records",
    async () => {
      const r = await customer.call("/notifications");
      assert.ok(r.body.every((n) => n.user_id === "customer"));
    },
  );
  await t.test("Audit and dashboard stay within a manager scope", async () => {
    const logs = await book.call("/audit");
    assert.ok(logs.body.every((e) => e.repository_id === "books"));
    const dash = await book.call("/dashboard");
    assert.ok(dash.body.repositories.every((r) => r.id === "books"));
  });
  await t.test("Version restore is restricted to managers", async () => {
    const v = one("SELECT * FROM versions WHERE document_id=?", "d1");
    assert.equal(
      (
        await customer.call("/documents/d1/versions/" + v.id + "/restore", {
          method: "POST",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin.call("/documents/d1/versions/" + v.id + "/restore", {
          method: "POST",
        })
      ).status,
      200,
    );
  });
  await t.test(
    "Password recovery token expires after use and returns no enumeration signal",
    async () => {
      const anon = client("customer");
      const existing = await anon.call("/auth/forgot-password", {
        method: "POST",
        body: { email: "new@example.test" },
      });
      const absent = await anon.call("/auth/forgot-password", {
        method: "POST",
        body: { email: "not-registered@example.test" },
      });
      assert.deepEqual(existing.body, absent.body);
      const outbox = all(
        "SELECT * FROM email_outbox WHERE recipient=? ORDER BY created_at DESC",
        "new@example.test",
      ).find((m) => m.subject === "Đặt lại mật khẩu Bacnhabook");
      const token = new URL(decryptMail(outbox.body)).searchParams.get("token");
      const body = { token, password: "Recovery-Password-2026" };
      assert.equal(
        (await anon.call("/auth/reset-password", { method: "POST", body }))
          .status,
        200,
      );
      assert.equal(
        (await anon.call("/auth/reset-password", { method: "POST", body }))
          .status,
        400,
      );
    },
  );
  await t.test(
    "Idle timeout and session concurrency are enforced server-side",
    async () => {
      const c = client("customer");
      await c.login("customer");
      run(
        "UPDATE sessions SET last_active='2020-01-01T00:00:00.000Z' WHERE user_id='customer'",
      );
      assert.equal((await c.call("/auth/me")).body.user, null);
      const u = one("SELECT * FROM users WHERE email=?", "new@example.test");
      run("DELETE FROM sessions WHERE user_id=?", u.id);
      run(
        "INSERT INTO settings(key,value) VALUES ('max_sessions','1') ON CONFLICT(key) DO UPDATE SET value='1'",
      );
      const a = client("customer"),
        b = client("customer");
      assert.equal(
        (
          await a.call("/auth/login", {
            method: "POST",
            body: { email: u.email, password: "Recovery-Password-2026" },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await b.call("/auth/login", {
            method: "POST",
            body: { email: u.email, password: "Recovery-Password-2026" },
          })
        ).status,
        409,
      );
      run("UPDATE settings SET value='3' WHERE key='max_sessions'");
    },
  );
  await t.test(
    "Local backup verifies checksums and restores DB, objects and ACL into a fresh directory",
    async () => {
      const { createBackup, verifyBackup, restoreBackup } =
        await import("../server/backup.js");
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), "bacnha-backup-test-"),
      );
      try {
        const snapshot = await createBackup(root);
        const report = await verifyBackup(snapshot);
        assert.ok(report.documents >= 12);
        assert.ok(report.objects >= 24);
        assert.ok(report.grants > 0);
        const destination = path.join(root, "restored");
        await restoreBackup(snapshot, destination);
        const { DatabaseSync } = await import("node:sqlite");
        const restored = new DatabaseSync(
          path.join(destination, "bacnhabook.sqlite"),
          { readOnly: true },
        );
        assert.equal(
          restored.prepare("SELECT COUNT(*) as n FROM grants").get().n,
          report.grants,
        );
        restored.close();
        await assert.rejects(
          () => restoreBackup(snapshot, destination),
          /thư mục mới/,
        );
        const manifest = JSON.parse(
          await fs.readFile(path.join(snapshot, "manifest.json"), "utf8"),
        );
        await fs.writeFile(
          path.join(snapshot, "objects", manifest.objects[0].key),
          "corrupt",
        );
        await assert.rejects(() => verifyBackup(snapshot), /checksum/);
      } finally {
        await fs.rm(root, { recursive: true, force: true });
      }
    },
  );
  await t.test(
    "Malformed cross-site origin is rejected, not treated as a server failure",
    async () => {
      const r = await guest.call("/auth/forgot-password", {
        method: "POST",
        headers: { Origin: "null" },
        body: { email: "no@example.test" },
      });
      assert.equal(r.status, 403);
    },
  );
  await t.test(
    "Production disables demo login and rejects previously issued demo sessions",
    async () => {
      const c = client();
      await c.login("admin");
      process.env.NODE_ENV = "production";
      try {
        assert.equal(
          (
            await c.call("/dev/session", {
              method: "POST",
              body: { userId: "admin" },
            })
          ).status,
          404,
        );
        assert.equal((await c.call("/auth/me")).body.user, null);
      } finally {
        process.env.NODE_ENV = "test";
      }
    },
  );
  await t.test(
    "Customer portal lists only Bacnhabook repositories and denies internal endpoints",
    async () => {
      const repos = await guest.call("/repositories");
      assert.deepEqual(
        repos.body.map((r) => r.type),
        ["BACNHABOOK"],
      );
      for (const endpoint of [
        "/users",
        "/dashboard",
        "/audit",
        "/settings",
        "/trash",
        "/approvals",
        "/export",
      ])
        assert.equal((await customer.call(endpoint)).status, 403, endpoint);
      for (const target of ["d10", "d11", "d12"])
        assert.equal(
          (await customer.call("/documents/" + target + "/preview")).status,
          404,
          target,
        );
    },
  );
  await t.test(
    "Role cannot cross website boundaries through demo login",
    async () => {
      const outside = client("customer"),
        inside = client();
      assert.equal((await outside.login("admin")).status, 403);
      assert.equal((await outside.login("employee")).status, 403);
      assert.equal((await inside.login("customer")).status, 403);
      assert.equal((await inside.call("/repositories")).status, 401);
    },
  );
  await t.test(
    "Independent cookie names prevent reusing an internal session on the customer website",
    async () => {
      const response = await fetch(base + "/dev/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "admin" }),
      });
      const cookie = response.headers.get("set-cookie").split(";")[0];
      assert.ok(cookie.startsWith("bacnha_internal_session="));
      const forged = cookie.replace(
        "bacnha_internal_session=",
        "bacnha_customer_session=",
      );
      const result = await fetch(base + "/customer/auth/me", {
        headers: { Cookie: forged },
      });
      assert.equal((await result.json()).user, null);
    },
  );
  await t.test(
    "Internal updates are immediately visible through the customer API",
    async () => {
      const text = "Đã cập nhật từ website quản trị riêng";
      assert.equal(
        (
          await admin.call("/documents/d1", {
            method: "PATCH",
            body: { description: text },
          })
        ).status,
        200,
      );
      assert.equal((await guest.call("/documents/d1")).body.description, text);
    },
  );
  await t.test("Logout revokes session immediately", async () => {
    const c = client("customer");
    await c.login("customer");
    await c.call("/auth/logout", { method: "POST" });
    assert.equal((await c.call("/auth/me")).body.user, null);
  });
});
await new Promise((resolve) => server.close(resolve));
db.close();
await fs.rm(process.env.DATA_DIR, { recursive: true, force: true });
