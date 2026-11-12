import fs from "node:fs/promises";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export const watermarkBrand = "BÁC NHÃ BOOKS · THANHMAIHSK";
export const viewerIdentity = (user) => user?.email || "Khách · Guest";
const fontBytes = fs.readFile(
  new URL(
    "../node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-400-normal.woff",
    import.meta.url,
  ),
);

// Create a personalized delivery copy. Never write back to the stored original.
export async function watermarkPdf(bytes, user) {
  const pdf = await PDFDocument.load(bytes);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await fontBytes, { subset: true });
  const identity = viewerIdentity(user);
  const supported = (text) =>
    [...text]
      .map((c) => {
        try {
          font.encodeText(c);
          return c;
        } catch {
          return "?";
        }
      })
      .join("");
  const lines = ["BÁC NHÃ BOOKS", "THANHMAIHSK", supported(identity)];
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(4, Math.min(20, width / 30));
    const fit = Math.min(
      size,
      (width * 0.68) /
        Math.max(...lines.map((s) => font.widthOfTextAtSize(s, 1))),
    );
    for (const anchor of [0.3, 0.6]) {
      lines.forEach((text, i) =>
        page.drawText(text, {
          x: width * 0.16,
          y: height * anchor - i * fit * 1.5,
          font,
          size: i === 2 ? fit * 0.7 : fit,
          color: i === 1 ? rgb(0.59, 0.08, 0.17) : rgb(0.03, 0.42, 0.68),
          opacity: i === 2 ? 0.24 : 0.15,
          rotate: degrees(24),
        }),
      );
    }
  }
  return Buffer.from(await pdf.save());
}
