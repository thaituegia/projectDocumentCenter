let csrf = "";
export function setCsrf(value) {
  csrf = value || "";
}
export async function api(url, options = {}) {
  const { body, ...rest } = options;
  const headers = { ...options.headers };
  if (csrf) headers["X-CSRF-Token"] = csrf;
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch("/api" + url, {
    ...rest,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const result = await response
    .json()
    .catch(() => ({ error: "Không thể kết nối máy chủ." }));
  if (!response.ok) {
    const e = new Error(result.error || "Đã có lỗi xảy ra.");
    e.status = response.status;
    e.code = result.code;
    throw e;
  }
  if (result.csrf) setCsrf(result.csrf);
  return result;
}
export const bytes = (n) =>
  !n
    ? "0 KB"
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(1)} KB`
      : n < 1024 ** 3
        ? `${(n / 1024 ** 2).toFixed(1)} MB`
        : `${(n / 1024 ** 3).toFixed(2)} GB`;
export const date = (v) =>
  v
    ? new Date(v).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";
export const roleName = {
  SUPER_ADMIN: "Super Admin",
  BOOK_ADMIN: "Admin Bacnhabook",
  HR_ADMIN: "Quản trị HCNS",
  MANAGER: "Quản lý kho",
  EMPLOYEE: "Nhân viên",
  CUSTOMER: "Khách hàng",
};
export const pubName = {
  PUBLISHED: "Đã xuất bản",
  DRAFT: "Bản nháp",
  PENDING_APPROVAL: "Chờ phê duyệt",
  REJECTED: "Bị từ chối",
};
