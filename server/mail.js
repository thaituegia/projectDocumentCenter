import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { dataDir, id, now, insert } from "./db.js";
function key() {
  const configured = process.env.EMAIL_OUTBOX_KEY;
  if (configured) {
    const bytes = Buffer.from(configured, "base64");
    if (bytes.length !== 32)
      throw Error("EMAIL_OUTBOX_KEY phải là khóa base64 32 byte.");
    return bytes;
  }
  if (process.env.NODE_ENV === "production")
    throw Error(
      "Cần cấu hình EMAIL_OUTBOX_KEY trước khi tạo tài khoản hoặc khôi phục mật khẩu.",
    );
  const local = path.join(dataDir, "email-outbox.key");
  if (!fs.existsSync(local))
    fs.writeFileSync(local, crypto.randomBytes(32), {
      mode: 0o600,
      flag: "wx",
    });
  return fs.readFileSync(local);
}
export function encryptMail(body) {
  const nonce = crypto.randomBytes(12),
    cipher = crypto.createCipheriv("aes-256-gcm", key(), nonce);
  const encrypted = Buffer.concat([
    cipher.update(body, "utf8"),
    cipher.final(),
  ]);
  return [nonce, cipher.getAuthTag(), encrypted]
    .map((b) => b.toString("base64"))
    .join(".");
}
export function decryptMail(body) {
  const [nonce, tag, encrypted] = body
    .split(".")
    .map((v) => Buffer.from(v, "base64"));
  const cipher = crypto.createDecipheriv("aes-256-gcm", key(), nonce);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(encrypted), cipher.final()]).toString(
    "utf8",
  );
}
