import { one } from "./db.js";
import { repoFor } from "./authz.js";
export const customerRoutes = [
  [
    "GET",
    /^\/(health|site|auth\/me|repositories|folders|documents|access-requests|notifications)$/,
  ],
  ["GET", /^\/documents\/[^/]+(?:\/(preview|download))?$/],
  [
    "POST",
    /^\/auth\/(login|logout|change-password|forgot-password|reset-password)$/,
  ],
  ["POST", /^\/dev\/session$/],
  ["POST", /^\/documents\/[^/]+\/(favorite|access-requests)$/],
  ["PATCH", /^\/notifications\/read$/],
];
export const customerRouteAllowed = (method, path) =>
  customerRoutes.some(([m, p]) => m === method && p.test(path));
export const roleAllowed = (portal, user) =>
  !user ||
  (portal === "customer" ? user.role === "CUSTOMER" : user.role !== "CUSTOMER");
export const sessionCookie = (portal) =>
  portal === "customer" ? "bacnha_customer_session" : "bacnha_internal_session";
export function customerResourceCheck(req, res, next) {
  if (req.portal !== "customer") return next();
  if (!customerRouteAllowed(req.method, req.path))
    return res
      .status(403)
      .json({ error: "Chức năng này không có trên website học liệu." });
  const match = req.path.match(/^\/documents\/([^/]+)/);
  if (match) {
    const d = one("SELECT * FROM documents WHERE id=?", match[1]);
    const repo =
      d && one("SELECT type FROM repositories WHERE id=?", repoFor(d));
    if (
      !d ||
      repo?.type !== "BACNHABOOK" ||
      d.publication !== "PUBLISHED" ||
      d.deleted_at
    )
      return res.status(404).json({ error: "Không tìm thấy học liệu." });
  }
  next();
}
