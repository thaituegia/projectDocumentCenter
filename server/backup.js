import { backup, DatabaseSync } from "node:sqlite";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { db, all, dataDir, now, audit } from "./db.js";
import { getObject } from "./storage.js";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
export async function createBackup(destination) {
  const root = path.resolve(destination);
  if (root === dataDir || root.startsWith(dataDir + path.sep))
    throw Error("Kho backup phải nằm ngoài DATA_DIR.");
  await fs.mkdir(root, { recursive: true });
  const output = path.join(
    root,
    new Date().toISOString().replaceAll(":", "-") +
      "-" +
      crypto.randomUUID().slice(0, 8),
  );
  await fs.mkdir(path.join(output, "objects"), { recursive: true });
  await backup(db, path.join(output, "database.sqlite"));
  const snapshot = new DatabaseSync(path.join(output, "database.sqlite"), {
    readOnly: true,
  });
  const documents = snapshot.prepare("SELECT * FROM documents").all(),
    versions = snapshot.prepare("SELECT * FROM versions").all();
  const keys = [
    ...new Set(
      [...documents, ...versions]
        .flatMap((d) => [d.object_key, d.preview_key])
        .filter(Boolean),
    ),
  ];
  const manifest = {
    created_at: now(),
    kind: "local-rehearsal",
    database_sha256: sha(
      await fs.readFile(path.join(output, "database.sqlite")),
    ),
    document_count: documents.length,
    grant_count: snapshot.prepare("SELECT COUNT(*) as n FROM grants").get().n,
    objects: [],
  };
  snapshot.close();
  for (const key of keys) {
    const bytes = await getObject(key);
    await fs.writeFile(path.join(output, "objects", path.basename(key)), bytes);
    manifest.objects.push({ key, size: bytes.length, sha256: sha(bytes) });
  }
  try {
    await fs.copyFile(
      path.join(dataDir, "email-outbox.key"),
      path.join(output, "email-outbox.key"),
    );
    await fs.chmod(path.join(output, "email-outbox.key"), 0o600);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  await fs.writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  audit(null, "BACKUP_COMPLETED", null, "success", {
    objects: keys.length,
    kind: "local-rehearsal",
  });
  return output;
}
export async function verifyBackup(source) {
  const root = path.resolve(source),
    manifest = JSON.parse(
      await fs.readFile(path.join(root, "manifest.json"), "utf8"),
    );
  if (
    sha(await fs.readFile(path.join(root, "database.sqlite"))) !==
    manifest.database_sha256
  )
    throw Error("Database checksum không khớp.");
  for (const object of manifest.objects) {
    const bytes = await fs.readFile(
      path.join(root, "objects", path.basename(object.key)),
    );
    if (bytes.length !== object.size || sha(bytes) !== object.sha256)
      throw Error("Object checksum không khớp: " + object.key);
  }
  const copy = new DatabaseSync(path.join(root, "database.sqlite"), {
    readOnly: true,
  });
  try {
    const integrity = copy.prepare("PRAGMA integrity_check").get();
    if (Object.values(integrity)[0] !== "ok")
      throw Error("Database integrity check failed.");
    if (
      copy.prepare("SELECT COUNT(*) as n FROM documents").get().n !==
      manifest.document_count
    )
      throw Error("Document count mismatch.");
    if (
      copy.prepare("SELECT COUNT(*) as n FROM grants").get().n !==
      manifest.grant_count
    )
      throw Error("ACL count mismatch.");
  } finally {
    copy.close();
  }
  return {
    documents: manifest.document_count,
    grants: manifest.grant_count,
    objects: manifest.objects.length,
    checksums: "verified",
    integrity: "ok",
  };
}
export async function restoreBackup(source, destination) {
  await verifyBackup(source);
  const target = path.resolve(destination);
  try {
    await fs.mkdir(target);
  } catch (e) {
    if (e.code === "EEXIST")
      throw Error(
        "Chỉ khôi phục vào thư mục mới, không ghi đè dữ liệu đang chạy.",
      );
    throw e;
  }
  for (const entry of await fs.readdir(path.resolve(source))) {
    await fs.cp(
      path.join(path.resolve(source), entry),
      path.join(target, entry),
      { recursive: true, force: false, errorOnExist: true },
    );
  }
  await fs.rename(
    path.join(target, "database.sqlite"),
    path.join(target, "bacnhabook.sqlite"),
  );
  return target;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve("server/backup.js")
) {
  const [action, source, destination] = process.argv.slice(2);
  try {
    if (action === "create") {
      if (!source && !process.env.BACKUP_DIR)
        throw Error("Chỉ định thư mục backup.");
      console.log(await createBackup(source || process.env.BACKUP_DIR));
    } else if (action === "verify")
      console.log(JSON.stringify(await verifyBackup(source)));
    else if (action === "restore")
      console.log(await restoreBackup(source, destination));
    else
      throw Error(
        "Dùng: node server/backup.js create <dir> | verify <snapshot> | restore <snapshot> <new-dir>",
      );
  } finally {
    db.close();
  }
}
