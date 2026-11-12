import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { finished } from "node:stream/promises";
import { ZipArchive } from "archiver";
import ExcelJS from "exceljs";
import { sampleDocuments } from "../server/sample-catalog.js";
import { renderSamplePdf } from "../server/sample-data.js";
import { db } from "../server/db.js";

const output = path.resolve(process.argv[2] || ".data/uat-bacnhabook.zip");
try {
  await fs.access(output);
  throw Error(
    "File xuất đã tồn tại. Chọn tên file khác để giữ nguyên gói đã tạo: " +
      output,
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await fs.mkdir(path.dirname(output), { recursive: true });
const working = await fs.mkdtemp(path.join(path.dirname(output), "uat-pack-"));
const docs = sampleDocuments();
function sheet(workbook, name, columns) {
  const s = workbook.addWorksheet(name);
  s.columns = columns.map(([header, key, width = 24]) => ({
    header,
    key,
    width,
  }));
  s.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  s.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF086BAD" },
  };
  s.views = [{ state: "frozen", ySplit: 1 }];
  return s;
}
try {
  for (const doc of docs) {
    const folder = path.join(
      working,
      "tai-lieu-pdf",
      doc.repository,
      doc.folderId,
    );
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(
      path.join(folder, `${doc.id}.pdf`),
      await renderSamplePdf(doc.content),
    );
  }
  const guide = await fs.readFile(
    new URL("../docs/uat-guide.md", import.meta.url),
    "utf8",
  );
  await fs.writeFile(path.join(working, "BAT-DAU-TAI-DAY.md"), guide);
  await fs.writeFile(
    path.join(working, "HUONG-DAN-DUNG-THU.pdf"),
    await renderSamplePdf(guide.replace(/[#`*]/g, "")),
  );
  const manifest = new ExcelJS.Workbook();
  const catalog = sheet(manifest, "Danh mục 60 PDF", [
    ["Mã", "id", 32],
    ["Tên tài liệu", "title", 50],
    ["Kho", "repository", 16],
    ["Thư mục", "folderName", 36],
    ["Tình huống", "scenario", 32],
    ["Xuất bản", "publication"],
    ["Quyền truy cập", "access"],
    ["Cho tải", "downloadable", 12],
    ["Trong thùng rác", "deleted", 18],
  ]);
  docs.forEach((doc) => catalog.addRow(doc));
  await manifest.xlsx.writeFile(path.join(working, "danh-muc-tai-lieu.xlsx"));
  const valid = Array.from({ length: 12 }, (_, i) => ({
    email: `hocvien-uat-${String(i + 1).padStart(2, "0")}@example.test`,
    name: `Học viên giả lập UAT ${String(i + 1).padStart(2, "0")}`,
  }));
  for (const [filename, rows] of [
    ["import-hoc-vien-hop-le.xlsx", valid],
    [
      "import-hoc-vien-co-loi.xlsx",
      [
        valid[0],
        valid[1],
        valid[0],
        { email: "email-khong-hop-le", name: "Dòng email lỗi" },
        { email: "", name: "Dòng thiếu email" },
      ],
    ],
  ]) {
    const workbook = new ExcelJS.Workbook();
    const s = sheet(workbook, "HocVien", [
      ["email", "email", 48],
      ["name", "name", 38],
    ]);
    rows.forEach((row) => s.addRow(row));
    await workbook.xlsx.writeFile(path.join(working, filename));
  }
  const feedback = new ExcelJS.Workbook();
  const cases = sheet(feedback, "Phản hồi UAT", [
    ["Mã UAT", "id", 14],
    ["Vai trò", "role", 25],
    ["Thao tác", "action", 55],
    ["Kết quả mong đợi", "expected", 65],
    ["Kết quả thực tế", "actual", 55],
    ["Trạng thái", "status", 20],
    ["Mức độ", "severity", 18],
    ["Người thử", "tester", 24],
    ["Thiết bị / Trình duyệt", "device", 30],
    ["Thời điểm / Ghi chú / Ảnh", "notes", 55],
  ]);
  for (const line of guide
    .split("\n")
    .filter((line) => line.startsWith("| UAT-"))) {
    const [, id, role, action, expected] = line
      .split("|")
      .map((cell) => cell.trim());
    const row = cases.addRow({
      id,
      role,
      action,
      expected,
      status: "Chưa chạy",
    });
    row.alignment = { wrapText: true, vertical: "top" };
    row.height = 65;
    cases.getCell(`F${row.number}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Chưa chạy,Đạt,Không đạt,Bị chặn"'],
    };
    cases.getCell(`G${row.number}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Thấp,Trung bình,Cao,Nghiêm trọng"'],
    };
  }
  await feedback.xlsx.writeFile(path.join(working, "phan-hoi-dung-thu.xlsx"));
  await fs.writeFile(
    path.join(working, "README.txt"),
    "BỘ DỮ LIỆU DÙNG THỬ — HOÀN TOÀN GIẢ LẬP\n\nBắt đầu bằng BAT-DAU-TAI-DAY.md hoặc HUONG-DAN-DUNG-THU.pdf.\n60 PDF thật nằm trong tai-lieu-pdf. Danh mục và các trạng thái nằm trong danh-muc-tai-lieu.xlsx.\nGửi kết quả qua phan-hoi-dung-thu.xlsx. Không ghi mật khẩu vào phiếu phản hồi.\nGói này không có tài khoản/mật khẩu, database, khóa dịch vụ hoặc hồ sơ thật.\nViệc tải các PDF từ gói ZIP không tạo quyền xem hoặc trạng thái trên website. Bộ dữ liệu trên website do backend khởi tạo sau deploy.\n",
  );
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const stream = createWriteStream(output, { flags: "wx", mode: 0o600 });
  const completion = Promise.all([finished(stream), finished(archive)]);
  archive.pipe(stream);
  archive.directory(working, "bacnhabook-uat");
  await archive.finalize();
  await completion;
  console.log(`Share pack: ${output}`);
  console.log(
    `60 PDFs; 12 folders; 24 UAT cases; 2 import workbooks. No passwords or database included.`,
  );
} finally {
  db.close();
}
