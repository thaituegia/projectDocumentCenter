import fs from "node:fs/promises";
import path from "node:path";
import { dataDir } from "./db.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
let client;
export const remote = () => process.env.STORAGE_DRIVER === "r2";
function s3() {
  if (!client) {
    for (const k of [
      "R2_ENDPOINT",
      "R2_BUCKET",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ])
      if (!process.env[k]) throw new Error(`Thiếu cấu hình ${k}`);
    client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}
export async function putObject(key, buffer, mime) {
  if (remote()) {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mime,
      }),
    );
  } else {
    await fs.mkdir(path.join(dataDir, "objects"), { recursive: true });
    await fs.writeFile(
      path.join(dataDir, "objects", path.basename(key)),
      buffer,
    );
  }
}
export async function getObject(key) {
  if (!key) throw new Error("Chưa có nội dung");
  if (remote() && !key.startsWith("seed-")) {
    const out = await s3().send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
    );
    return Buffer.from(await out.Body.transformToByteArray());
  }
  return fs.readFile(path.join(dataDir, "objects", path.basename(key)));
}
