import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

process.env.DATA_DIR = await fs.mkdtemp(
  path.join(os.tmpdir(), "bacnha-sample-"),
);
process.env.NODE_ENV = "production";
process.env.ENABLE_SAMPLE_DATA = "true";
const { db, seed, all, one, update } = await import("../server/db.js");
const { seedSampleData } = await import("../server/sample-data.js");
const { can, canManage, approvers } = await import("../server/authz.js");
const { getObject } = await import("../server/storage.js");

await test("Sample data has genuine PDFs, scoped UAT scenarios and preserves edits on restart", async () => {
  try {
    await seed();
    assert.deepEqual(await seedSampleData(), { skipped: true });
    assert.equal(all("SELECT id FROM documents").length, 0);
    process.env.NODE_ENV = "test";
    await seed();
    const docs = all("SELECT * FROM documents WHERE id LIKE 'uat-%'");
    assert.equal(docs.length, 60);
    assert.equal(
      all("SELECT id FROM folders WHERE id LIKE 'uat-%'").length,
      12,
    );
    assert.equal(
      docs.filter((d) => d.publication === "PENDING_APPROVAL").length,
      6,
    );
    assert.equal(docs.filter((d) => d.publication === "DRAFT").length, 6);
    assert.equal(docs.filter((d) => d.deleted_at).length, 2);
    assert.equal(docs.filter((d) => d.effective_until).length, 3);
    assert.equal(docs.filter((d) => d.effective_from).length, 2);
    assert.equal(docs.filter((d) => d.version === 2).length, 4);
    for (const doc of docs) {
      assert.equal(doc.mime, "application/pdf");
      assert.equal(doc.type, "PDF");
      const bytes = await getObject(doc.object_key);
      assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
      const pdf = await PDFDocument.load(bytes);
      assert.ok(pdf.getPageCount() >= 1);
      assert.match(
        (await getObject(doc.preview_key)).toString(),
        /DỮ LIỆU MẪU UAT/,
      );
    }
    const person = (role) => ({
      ...one(
        "SELECT * FROM users WHERE role=? AND id LIKE 'role-demo-%'",
        role,
      ),
      must_change: 0,
    });
    const doc = (id) => one("SELECT * FROM documents WHERE id=?", id);
    const customer = person("CUSTOMER"),
      employee = person("EMPLOYEE");
    assert.equal(can(customer, doc("uat-hsk1-lessons-03"), "VIEW"), true);
    assert.equal(can(customer, doc("uat-hsk1-lessons-02"), "DOWNLOAD"), false);
    assert.equal(can(customer, doc("uat-hsk1-exercises-05"), "VIEW"), false);
    assert.equal(can(customer, doc("uat-hsk2-course-03"), "VIEW"), false);
    assert.equal(can(employee, doc("uat-common-onboarding-01"), "VIEW"), true);
    assert.equal(can(employee, doc("uat-hr-records-01"), "VIEW"), false);
    assert.equal(
      canManage(person("BOOK_ADMIN"), doc("uat-hr-records-01")),
      false,
    );
    assert.equal(canManage(person("HR_ADMIN"), doc("uat-hr-records-01")), true);
    assert.ok(
      approvers("uat-marketing-campaign").includes(person("MANAGER").id),
    );
    assert.equal(
      all("SELECT id FROM access_requests WHERE id LIKE 'uat-request-%'")
        .length,
      2,
    );
    assert.equal(
      all("SELECT id FROM approvals WHERE id LIKE 'uat-%'").length,
      6,
    );
    // Exercise the actual HTTP workflow against this isolated synthetic database.
    for (const user of all("SELECT id FROM users WHERE id LIKE 'role-demo-%'"))
      update("users", user.id, { must_change: 0 });
    const { app } = await import("../server/index.js");
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    try {
      const login = async (role) => {
        const portal = role === "CUSTOMER" ? "/customer" : "";
        const result = await fetch(base + portal + "/dev/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: person(role).id }),
        });
        assert.equal(result.status, 200);
        const session = await result.json();
        return async (url, options = {}) =>
          fetch(base + portal + url, {
            ...options,
            headers: {
              Cookie: result.headers.get("set-cookie").split(";")[0],
              "X-CSRF-Token": session.csrf,
              "Content-Type": "application/json",
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
          });
      };
      const learner = await login("CUSTOMER"),
        book = await login("BOOK_ADMIN"),
        hr = await login("HR_ADMIN"),
        staff = await login("EMPLOYEE"),
        manager = await login("MANAGER");
      assert.equal(
        (await (await learner("/documents/uat-hsk1-lessons-03/preview")).json())
          .watermark_enabled,
        true,
      );
      assert.equal(
        (await learner("/documents/uat-hsk1-lessons-02/download")).status,
        403,
      );
      assert.equal(
        (await learner("/documents/uat-hsk1-exercises-05/preview")).status,
        403,
      );
      assert.equal(
        (await learner("/documents/uat-hsk2-course-03/preview")).status,
        403,
      );
      assert.equal(
        (await (await hr("/documents/uat-hr-records-01/preview")).json())
          .watermark_enabled,
        false,
      );
      assert.equal(
        (await staff("/documents/uat-hr-records-01/preview")).status,
        403,
      );
      assert.equal(
        (
          await book("/access-requests/uat-request-customer", {
            method: "PATCH",
            body: { status: "approved" },
          })
        ).status,
        200,
      );
      assert.equal(
        (await learner("/documents/uat-hsk2-course-03/preview")).status,
        200,
        "grant approval opens the requested sample",
      );
      assert.equal(
        (
          await manager("/approvals/uat-marketing-campaign-04-approval", {
            method: "PATCH",
            body: { status: "approved" },
          })
        ).status,
        200,
      );
      assert.equal(doc("uat-marketing-campaign-04").publication, "PUBLISHED");
      // Validate the import previews without creating accounts or sending mail.
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet("HocVien").addRows([
        ["email", "name"],
        ["uat-import@example.test", "Học viên mẫu"],
        ["email-loi", "Dòng lỗi"],
        ["uat-import@example.test", "Dòng trùng"],
      ]);
      const form = new FormData();
      form.append(
        "file",
        new Blob([await workbook.xlsx.writeBuffer()], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "uat.xlsx",
      );
      const session = await fetch(base + "/dev/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: person("BOOK_ADMIN").id }),
      });
      const auth = await session.json();
      const imported = await fetch(base + "/imports/preview", {
        method: "POST",
        headers: {
          Cookie: session.headers.get("set-cookie").split(";")[0],
          "X-CSRF-Token": auth.csrf,
        },
        body: form,
      });
      assert.equal(imported.status, 200);
      assert.deepEqual(
        (await imported.json()).items.map((row) => row.status),
        ["new", "invalid", "duplicate"],
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
    update("documents", "uat-hsk1-lessons-01", {
      name: "Tên đã sửa trong buổi dùng thử",
    });
    await seed();
    assert.equal(
      all("SELECT id FROM documents WHERE id LIKE 'uat-%'").length,
      60,
    );
    assert.equal(
      doc("uat-hsk1-lessons-01").name,
      "Tên đã sửa trong buổi dùng thử",
    );
  } finally {
    db.close();
    await fs.rm(process.env.DATA_DIR, { recursive: true, force: true });
  }
});
