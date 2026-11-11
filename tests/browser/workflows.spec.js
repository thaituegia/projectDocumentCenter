import { test, expect } from "@playwright/test";
test("Library, collection browsing, file preview and grid view", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Học liệu Bacnhabook", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xem dạng lưới" }).click();
  await expect(page.locator(".document-card")).toHaveCount(9);
  await page.getByRole("button", { name: "Xem danh sách" }).click();
  await page
    .locator(".document-name")
    .filter({ hasText: "Giáo trình HSK 1 – Bài 01: Chào bạn" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".preview-paper")).toBeVisible();
  await expect(page.locator(".watermark")).toContainText(
    "minhanh@example.test",
  );
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.locator(".collection-card").first().click();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(4);
  expect(errors).toEqual([]);
});
test("Search, type filter and empty state", async ({ page }) => {
  await page.goto("/");
  await page.locator("#global-search").fill("Sổ tay");
  await expect(page.locator(".document-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".document-table")).toContainText("300 từ vựng");
  await page.locator("#global-search").fill("zz-no-matching-content");
  await expect(
    page.getByRole("heading", { name: "Chưa tìm thấy tài liệu" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page.getByRole("button", { name: "Âm thanh", exact: true }).click();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(1);
});
test("Create a folder and see server-persisted data after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tạo thư mục", exact: true }).click();
  const name = "Thư mục kiểm thử " + Date.now();
  await page.getByRole("textbox", { name: "Tên thư mục" }).fill(name);
  await page
    .getByRole("button", { name: "Tạo thư mục", exact: true })
    .last()
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});
test("Customer receives access denied and can send an access request", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".profile").click();
  await page
    .locator(".profile-dropdown")
    .getByRole("button", { name: "Khách hàng", exact: true })
    .click();
  await expect(page.locator(".profile-name")).toContainText("Nguyễn An");
  await page
    .locator(".document-name")
    .filter({ hasText: "Ngữ pháp HSK 3 – Tổng hợp kiến thức" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bạn chưa có quyền truy cập" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Gửi yêu cầu truy cập", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Vì sao bạn cần tài liệu này?" })
    .fill("Tôi muốn học ngữ pháp để ôn tập.");
  await page.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("đã có một yêu cầu");
});
test("Dashboard, people, audit and settings pages render real data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bức tranh tri thức" }),
  ).toBeVisible();
  await expect(page.locator(".stats-grid")).toContainText("Tổng số tài liệu");
  await page.getByRole("button", { name: "Người dùng", exact: true }).click();
  await expect(page.locator(".people-table tbody tr")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Nhật ký hoạt động", exact: true })
    .click();
  await expect(page.locator(".audit-table tbody tr").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Cài đặt hệ thống", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Một nền tảng vững vàng" }),
  ).toBeVisible();
  await expect(page.locator(".integrations-grid")).toContainText(
    "Chưa cấu hình",
  );
});
test("Mobile navigation, viewer and modal do not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".document-table")).toBeVisible();
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Yêu cầu truy cập", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Kết nối với tri thức" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Thư viện tài liệu", exact: true })
    .click();
  await page
    .locator(".document-name")
    .filter({ hasText: "Giáo trình HSK 1 – Bài 01: Chào bạn" })
    .click();
  await expect(page.locator(".preview-paper")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/mobile-viewer.png",
    fullPage: true,
  });
});
test("Role switch hides admin menus; API still enforces scope", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".profile").click();
  await page
    .getByRole("button", { name: "Admin Bacnhabook", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cài đặt hệ thống", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Hành chính nhân sự", exact: true }),
  ).toHaveCount(0);
  const result = await page.evaluate(() =>
    fetch("/api/settings").then((r) => r.status),
  );
  expect(result).toBe(403);
  await page.locator(".profile").click();
  await page
    .locator(".profile-dropdown")
    .getByRole("button", { name: "Khách hàng", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tổng quan", exact: true }),
  ).toHaveCount(0);
});
test("Document editing and permissions persist through the UI", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".document-name")
    .filter({ hasText: "Giáo trình HSK 1 – Bài 01: Chào bạn" })
    .click();
  await expect(page.locator(".preview-paper")).toBeVisible();
  await page.getByRole("button", { name: "Thông tin", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Mô tả", exact: true })
    .fill("Mô tả đã được cập nhật bằng kiểm thử trình duyệt.");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu thông tin");
  await page
    .locator(".document-name")
    .filter({ hasText: "Giáo trình HSK 1 – Bài 01: Chào bạn" })
    .click();
  await expect(page.locator(".viewer-detail")).toContainText(
    "Mô tả đã được cập nhật",
  );
  await page.getByRole("button", { name: "Quyền", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Quản lý quyền truy cập" }),
  ).toBeVisible();
  await expect(page.locator(".grants-list")).toContainText(
    "Kế thừa từ thư mục",
  );
});
test("File upload creates a real queued record and reports safe pending state", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Tải tài liệu lên", exact: true })
    .click();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "browser-upload.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Browser upload integration fixture"),
    });
  await page.getByRole("button", { name: "Tải lên (1)", exact: true }).click();
  await expect(page.locator(".upload-file-list")).toContainText("Chờ kiểm tra");
  await page.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await expect(page.locator(".document-table")).toContainText(
    "browser-upload.txt",
  );
  await page
    .locator(".document-name")
    .filter({ hasText: "browser-upload.txt" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Chưa có bản xem trước" }),
  ).toBeVisible();
});
