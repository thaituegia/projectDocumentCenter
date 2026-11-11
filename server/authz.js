import { all, one, now, audit } from "./db.js";
export function ancestry(folderId) {
  const result = [];
  let f = one("SELECT * FROM folders WHERE id=?", folderId);
  const visited = new Set();
  while (f && !visited.has(f.id)) {
    visited.add(f.id);
    result.push(f);
    f = f.parent_id
      ? one("SELECT * FROM folders WHERE id=?", f.parent_id)
      : null;
  }
  return result;
}
export function repoFor(target) {
  return target.repository_id || ancestry(target.folder_id)[0]?.repository_id;
}
export function canManage(user, target) {
  if (!user || user.status !== "active" || user.must_change) return false;
  const repo = repoFor(target);
  return (
    user.role === "SUPER_ADMIN" ||
    (["BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(user.role) &&
      user.scope?.split(",").includes(repo))
  );
}
export function lifecycle(doc, time = now()) {
  if (doc.effective_from && doc.effective_from > time) return "SCHEDULED";
  if (doc.effective_until && doc.effective_until <= time) return "EXPIRED";
  return "ACTIVE";
}
export function can(user, doc, action, time = now()) {
  if (doc.deleted_at || ancestry(doc.folder_id).some((f) => f.deleted_at))
    return false;
  if (user && (user.status !== "active" || user.must_change)) return false;
  if (["MANAGE", "GRANT", "PUBLISH"].includes(action))
    return canManage(user, doc);
  const manage = canManage(user, doc);
  if (doc.publication !== "PUBLISHED" || lifecycle(doc, time) === "SCHEDULED")
    return manage && action === "VIEW";
  const targets = new Set([
    doc.id,
    ...ancestry(doc.folder_id).map((f) => f.id),
  ]);
  const grants = user
    ? all("SELECT * FROM grants WHERE action=?", action).filter(
        (g) =>
          targets.has(g.target_id) &&
          ((g.subject_type === "USER" && g.subject_id === user.id) ||
            (g.subject_type === "DEPARTMENT" &&
              g.subject_id === user.department)) &&
          (!g.valid_from || g.valid_from <= time) &&
          (!g.valid_until || g.valid_until > time),
      )
    : [];
  if (grants.some((g) => g.effect === "DENY")) return false;
  if (
    action === "DOWNLOAD" &&
    (!doc.downloadable || !can(user, doc, "VIEW", time))
  )
    return false;
  if (doc.access === "PUBLIC" && action === "VIEW") return true;
  return grants.some((g) => g.effect === "ALLOW");
}
export function approvers(folderId) {
  for (const f of ancestry(folderId)) {
    if (f.approvers !== null && f.approvers !== undefined)
      return JSON.parse(f.approvers);
  }
  return [];
}
export function schema(folderId) {
  const result = new Map();
  for (const f of ancestry(folderId).reverse()) {
    for (const field of JSON.parse(f.metadata_schema || "[]"))
      result.set(field.key, field);
  }
  return [...result.values()];
}
export function visibleRepo(user, repo) {
  if (repo.type === "BACNHABOOK" || repo.type === "COMMON") return true;
  if (!user || user.role === "CUSTOMER") return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (["BOOK_ADMIN", "HR_ADMIN", "MANAGER"].includes(user.role))
    return user.scope?.split(",").includes(repo.id);
  return repo.type === "DEPARTMENT" || repo.type === "HR";
}
export function requireManage(req, res, next) {
  const target = req.doc || req.folder;
  if (!canManage(req.user, target)) {
    audit(req.user, "PERMISSION_DENIED", target, "denied");
    return res
      .status(403)
      .json({ error: "Bạn không có quyền quản lý tài liệu trong kho này." });
  }
  next();
}
export function safeDoc(user, doc) {
  const view = can(user, doc, "VIEW"),
    manage = canManage(user, doc);
  const base = {
    id: doc.id,
    name: doc.name,
    folder_id: doc.folder_id,
    type: doc.type,
    access: doc.access,
    publication: doc.publication,
    lifecycle: lifecycle(doc),
    updated_at: doc.updated_at,
    can_view: view,
    can_download: can(user, doc, "DOWNLOAD"),
    can_manage: manage,
    is_favorite: !!(
      user &&
      one(
        "SELECT * FROM favorites WHERE user_id=? AND document_id=?",
        user.id,
        doc.id,
      )
    ),
    repository_id: repoFor(doc),
  };
  return view || manage
    ? {
        ...base,
        size: doc.size,
        description: doc.description,
        downloadable: !!doc.downloadable,
        processing: doc.processing,
        version: doc.version,
        metadata: JSON.parse(doc.metadata || "{}"),
        effective_from: doc.effective_from,
        effective_until: doc.effective_until,
        replacement_id: doc.replacement_id,
        legal_hold: !!doc.legal_hold,
        created_at: doc.created_at,
      }
    : base;
}
