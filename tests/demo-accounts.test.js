import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

process.env.DATA_DIR = await fs.mkdtemp(
  path.join(os.tmpdir(), "bacnha-role-demo-"),
);
process.env.NODE_ENV = "production";
process.env.ENABLE_ROLE_DEMO_ACCOUNTS = "true";
const { db, seed, seedRoleDemoAccounts, all, one, run, update } =
  await import("../server/db.js");

await test("Role demo accounts are scoped, repeatable and excluded from production", async () => {
  try {
    seedRoleDemoAccounts();
    assert.equal(
      all("SELECT id FROM users").length,
      0,
      "production never provisions demo accounts even with the flag",
    );
    process.env.NODE_ENV = "test";
    await seed();
    const accounts = all("SELECT * FROM users WHERE id LIKE 'role-demo-%'");
    assert.equal(accounts.length, 6);
    assert.equal(new Set(accounts.map((u) => u.role)).size, 6);
    assert.equal(new Set(accounts.map((u) => u.password)).size, 6);
    for (const account of accounts) {
      assert.match(account.password, /^\$2[aby]\$12\$/);
      assert.equal(account.must_change, 1);
      assert.equal(account.status, "active");
    }
    const customer = accounts.find((u) => u.role === "CUSTOMER");
    const grants = all("SELECT * FROM grants WHERE subject_id=?", customer.id);
    assert.deepEqual(
      new Set(grants.map((g) => g.target_id)),
      new Set(["hsk1"]),
    );
    assert.deepEqual(
      new Set(grants.map((g) => g.action)),
      new Set(["VIEW", "DOWNLOAD"]),
    );
    const hr = accounts.find((u) => u.role === "HR_ADMIN");
    assert.equal(hr.scope, "hr");
    update("users", customer.id, { status: "locked", must_change: 0 });
    run("DELETE FROM grants WHERE subject_id=?", customer.id);
    await seed();
    assert.equal(
      all("SELECT id FROM users WHERE id LIKE 'role-demo-%'").length,
      6,
    );
    assert.equal(
      one("SELECT status FROM users WHERE id=?", customer.id).status,
      "locked",
    );
    assert.equal(
      all("SELECT id FROM grants WHERE subject_id=?", customer.id).length,
      0,
      "restart preserves revoked access",
    );
    assert.equal(
      one("SELECT password FROM users WHERE id=?", customer.id).password,
      customer.password,
    );
  } finally {
    db.close();
    await fs.rm(process.env.DATA_DIR, { recursive: true, force: true });
  }
});
