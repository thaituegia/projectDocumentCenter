import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  all,
  one,
  insert,
  update,
  run,
  id,
  now,
  indexDoc,
  audit,
  notify,
  transaction,
} from "./db.js";
import { getObject, putObject } from "./storage.js";
import { approvers } from "./authz.js";
import { decryptMail } from "./mail.js";
const exec = promisify(execFile);
export async function processOne() {
  const job = one(
    "SELECT * FROM jobs WHERE status='queued' ORDER BY created_at LIMIT 1",
  );
  if (!job) return false;
  update("jobs", job.id, { status: "processing", updated_at: now() });
  const doc = one("SELECT * FROM documents WHERE id=?", job.document_id);
  let temp;
  try {
    if (!process.env.CLAMSCAN_PATH)
      throw Error(
        "SCANNER_NOT_CONFIGURED: cấu hình CLAMSCAN_PATH và cơ sở chữ ký ClamAV, sau đó thử lại.",
      );
    const versionJob = job.type.startsWith("{") ? JSON.parse(job.type) : null;
    const key = versionJob?.key || doc.object_key;
    const bytes = await getObject(key);
    temp = await fs.mkdtemp(path.join(os.tmpdir(), "bacnha-scan-"));
    const input = path.join(temp, "input." + key.split(".").at(-1));
    await fs.writeFile(input, bytes);
    try {
      await exec(process.env.CLAMSCAN_PATH, ["--no-summary", input], {
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      });
    } catch (e) {
      if (e.code === 1) {
        if (!versionJob)
          update("documents", doc.id, { processing: "quarantined" });
        throw Error("QUARANTINED: phần mềm quét phát hiện tệp không an toàn.");
      }
      throw Error("SCANNER_FAILED: dịch vụ quét chưa sẵn sàng.");
    }
    let text = "",
      previewKey = null;
    const mime = versionJob?.mime || doc.mime;
    if (["text/plain", "text/csv"].includes(mime))
      text = bytes.toString("utf8");
    else if (mime === "application/pdf") {
      try {
        const result = await exec(
          process.env.PDFTOTEXT_PATH || "pdftotext",
          [input, "-"],
          { timeout: 60000, maxBuffer: 20 * 1024 * 1024 },
        );
        text = result.stdout;
      } catch {
        throw Error("CONVERSION_FAILED: cần pdftotext để tạo bản đọc PDF.");
      }
    } else if (/officedocument|msword|ms-excel|ms-powerpoint/.test(mime)) {
      if (!process.env.LIBREOFFICE_PATH)
        throw Error("CONVERTER_NOT_CONFIGURED: cần LibreOffice cho Office.");
      await exec(
        process.env.LIBREOFFICE_PATH,
        [
          "-env:UserInstallation=file://" + path.join(temp, "profile"),
          "--headless",
          "--convert-to",
          "pdf",
          "--outdir",
          temp,
          input,
        ],
        { timeout: 120000 },
      );
      const pdf = path.join(
        temp,
        path.basename(input, path.extname(input)) + ".pdf",
      );
      const result = await exec(
        process.env.PDFTOTEXT_PATH || "pdftotext",
        [pdf, "-"],
        { timeout: 60000, maxBuffer: 20 * 1024 * 1024 },
      );
      text = result.stdout;
    }
    if (text) {
      previewKey = `preview-${id()}.txt`;
      await putObject(
        previewKey,
        Buffer.from(text),
        "text/plain; charset=utf-8",
      );
    }
    transaction(() => {
      const state = text ? "ready" : "unsupported";
      if (versionJob) {
        const number =
          versionJob.mode === "new"
            ? one(
                "SELECT COALESCE(MAX(number),0)+1 AS n FROM versions WHERE document_id=?",
                doc.id,
              ).n
            : doc.version;
        update("documents", doc.id, {
          object_key: key,
          mime,
          size: versionJob.size,
          preview_key: previewKey,
          fulltext: text,
          processing: state,
          version: number,
          updated_at: now(),
        });
        if (versionJob.mode === "new")
          insert("versions", {
            id: id(),
            document_id: doc.id,
            number,
            object_key: key,
            preview_key: previewKey,
            fulltext: text,
            mime,
            size: versionJob.size,
            created_at: now(),
            created_by: doc.created_by,
          });
        else
          run(
            "UPDATE versions SET object_key=?,preview_key=?,fulltext=?,mime=?,size=? WHERE document_id=? AND number=?",
            key,
            previewKey,
            text,
            mime,
            versionJob.size,
            doc.id,
            number,
          );
      } else {
        const publication = job.type.split(":")[1] || "DRAFT";
        update("documents", doc.id, {
          preview_key: previewKey,
          fulltext: text,
          processing: state,
          publication,
          updated_at: now(),
        });
        insert("versions", {
          id: id(),
          document_id: doc.id,
          number: 1,
          object_key: key,
          preview_key: previewKey,
          fulltext: text,
          mime,
          size: doc.size,
          created_at: now(),
          created_by: doc.created_by,
        });
        if (publication === "PENDING_APPROVAL") {
          insert("approvals", {
            id: id(),
            document_id: doc.id,
            requester_id: doc.created_by,
            status: "pending",
            created_at: now(),
          });
          for (const u of approvers(doc.folder_id))
            notify(
              u,
              "Tài liệu cần phê duyệt",
              "Một tài liệu mới đang chờ xem xét.",
              doc.id,
            );
        }
      }
      indexDoc(one("SELECT * FROM documents WHERE id=?", doc.id));
      update("jobs", job.id, {
        status: "completed",
        error: null,
        updated_at: now(),
      });
      audit(null, "PROCESSING_COMPLETED", doc);
      notify(
        doc.created_by,
        "Tài liệu đã được xử lý",
        "Tài liệu đã hoàn tất kiểm tra an toàn.",
        doc.id,
      );
    });
  } catch (e) {
    update("jobs", job.id, {
      status: "failed",
      error: e.message.slice(0, 500),
      updated_at: now(),
    });
    audit(null, "PROCESSING_FAILED", doc, "failed", {
      reason: e.message.split(":")[0],
    });
  } finally {
    if (temp) await fs.rm(temp, { recursive: true, force: true });
  }
  return true;
}
export async function sendOneEmail() {
  const mail = one(
    "SELECT * FROM email_outbox WHERE status='pending' AND attempts<5 ORDER BY created_at LIMIT 1",
  );
  if (!mail || !process.env.EMAIL_API_URL) return false;
  try {
    const url = new URL(process.env.EMAIL_API_URL);
    if (url.protocol !== "https:") throw Error("Email API phải dùng HTTPS.");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EMAIL_API_KEY || ""}`,
        "Idempotency-Key": mail.id,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: mail.recipient,
        subject: mail.subject,
        text: decryptMail(mail.body),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw Error("Nhà cung cấp trả lỗi " + response.status);
    run(
      "UPDATE email_outbox SET status='sent',body='',attempts=attempts+1,error=NULL WHERE id=?",
      mail.id,
    );
  } catch (e) {
    run(
      "UPDATE email_outbox SET attempts=attempts+1,error=?,status=CASE WHEN attempts>=4 THEN 'failed' ELSE 'pending' END WHERE id=?",
      e.message.slice(0, 150),
      mail.id,
    );
  }
  return true;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve("server/worker.js")
) {
  console.log("Bacnhabook worker started; scanner required, email optional.");
  let lastEmail = 0;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processOne();
      if (Date.now() - lastEmail > 30000) {
        await sendOneEmail();
        lastEmail = Date.now();
      }
    } catch (e) {
      console.error("Worker error:", e.name);
    } finally {
      running = false;
    }
  };
  await tick();
  setInterval(tick, 2000);
}
