if (process.env.NODE_ENV === "production") {
  throw Error("Không tạo dữ liệu dùng thử trong production.");
}
process.env.ENABLE_SAMPLE_DATA = "true";
const { seed, db, all } = await import("../server/db.js");
try {
  await seed();
  const docs = all("SELECT id FROM documents WHERE id LIKE 'uat-%'");
  const folders = all("SELECT id FROM folders WHERE id LIKE 'uat-%'");
  console.log(
    `Sample data ready: ${docs.length} PDFs, ${folders.length} folders. Existing changes retained.`,
  );
} finally {
  db.close();
}
