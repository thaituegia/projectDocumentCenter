import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "bacnhabook-production-"));
const port = Number(process.env.SMOKE_PORT || 3002);
const child = spawn(process.execPath, ["server/index.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    DATA_DIR: temp,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Production startup timeout")),
      20000,
    );
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes("server ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(Error("Server exited " + code));
    });
  });
  const base = `http://127.0.0.1:${port}`;
  const health = await (await fetch(base + "/api/health")).json();
  assert.equal(health.status, "ok");
  assert.equal(health.mode, "production");
  const html = await (await fetch(base + "/")).text();
  assert.ok(html.includes("Bacnhabook"));
  const asset = html.match(/src="([^"]+\.js)"/)[1];
  assert.equal((await fetch(base + asset)).status, 200);
  const dev = await fetch(base + "/api/dev/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "admin" }),
  });
  assert.equal(dev.status, 404);
  const me = await (await fetch(base + "/api/auth/me")).json();
  assert.equal(me.user, null);
  assert.equal(me.development, false);
  const repos = await fetch(base + "/api/repositories");
  assert.equal(repos.status, 401);
  console.log(
    "Production smoke PASS: static bundle, DB health, no demo login, no demo seed, guest session.",
  );
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("close", resolve));
  await fs.rm(temp, { recursive: true, force: true });
}
