import { test, expect } from "@playwright/test";

for (const [id, label, title, repository] of [
  ["admin", "Super Admin", "Quản trị toàn hệ thống", "Học liệu Bacnhabook"],
  [
    "book-admin",
    "Admin Bacnhabook",
    "Không gian quản trị học liệu",
    "Học liệu Bacnhabook",
  ],
  ["hr-admin", "HCNS", "Không gian quản trị HCNS", "Hành chính nhân sự"],
  [
    "manager",
    "Quản lý Marketing",
    "Không gian quản lý phòng ban",
    "Phòng Marketing",
  ],
  [
    "employee",
    "Nhân viên",
    "Tài liệu cho công việc của bạn",
    "Tài liệu công ty",
  ],
]) {
  test(`Role workspace: ${id} opens its own tasks and default repository`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Quản trị toàn hệ thống",
        exact: true,
      }),
    ).toBeVisible();
    if (id !== "admin") {
      await page.locator(".profile").click();
      await page
        .locator(".profile-dropdown")
        .getByRole("button", { name: label, exact: true })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".workspace-task")).toHaveCount(4);
    await expect(page.locator(".workspace-primary")).toHaveCSS(
      "background-color",
      "rgb(151, 21, 43)",
    );
    await expect(page.locator(".workspace-repositories")).toContainText(
      repository,
    );
    const toastClose = page.locator(".toast > button");
    if (await toastClose.isVisible()) await toastClose.click();
    await page.screenshot({
      path: `test-results/workspace-${id}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".sidebar")).not.toBeInViewport();
    await expect(page.locator(".workspace-task").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/workspace-${id}-mobile.png`,
      fullPage: true,
    });
    await page.locator(".workspace-primary").click();
    await expect(
      page.getByRole("heading", { name: repository, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: repository, exact: true }),
    ).toBeVisible();
    if (id !== "admin") {
      await page.goto("/settings");
      await expect(
        page.getByRole("heading", {
          name: "Bạn không có quyền truy cập trang này",
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => fetch("/api/settings").then((r) => r.status)),
      ).toBe(403);
    }
    if (id === "employee") {
      await page.goto("/people");
      await expect(
        page.getByRole("heading", {
          name: "Bạn không có quyền truy cập trang này",
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => fetch("/api/users").then((r) => r.status)),
      ).toBe(403);
    }
  });
}

test("Library, collection browsing, file preview and grid view", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/library");
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
  await expect(page.locator(".watermark")).toHaveCount(0);
  await expect(page.locator(".preview-paper-brand")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/internal-unwatermarked.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.locator(".collection-card").first().click();
  await expect(page.locator(".document-table tbody tr")).toHaveCount(4);
  expect(errors).toEqual([]);
});
test("Search, type filter and empty state", async ({ page }) => {
  await page.goto("/library");
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
  await page.goto("/library");
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
test("Customer website has its own login and access request journey", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3003/");
  await page
    .getByRole("button", { name: "Dùng tài khoản học viên mẫu" })
    .click();
  await expect(page.locator(".customer-profile")).toContainText("Nguyễn An");
  await expect(page.locator(".customer-hero .button")).toHaveCSS(
    "background-color",
    "rgb(8, 107, 173)",
  );
  await page
    .getByRole("button", {
      name: "Giáo trình HSK 1 – Bài 01: Chào bạn",
      exact: true,
    })
    .click();
  await expect(page.locator(".preview-paper .watermark > span")).toHaveCount(8);
  await expect(page.locator(".watermark")).toContainText(
    "nguyenan@example.test",
  );
  await expect(page.locator(".watermark")).toContainText("BÁC NHÃ BOOKS");
  await expect(page.locator(".watermark")).toContainText("THANHMAIHSK");
  await page.screenshot({
    path: "test-results/customer-watermarked.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Ngữ pháp HSK 3 – Tổng hợp kiến thức",
      exact: true,
    })
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
  await page.goto("/library");
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
  await page.goto("/library");
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
  await page.goto("/library");
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
    .getByRole("button", { name: "Nhân viên", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tổng quan", exact: true }),
  ).toHaveCount(0);
});
test("Document editing and permissions persist through the UI", async ({
  page,
}) => {
  await page.goto("/library");
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
  await page.goto("/library");
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

test("Separate websites keep sessions isolated and show shared document updates", async ({
  page,
  context,
}) => {
  await page.goto("/library");
  await expect(page.locator(".profile-name")).toContainText("Minh Anh");
  const customerPage = await context.newPage();
  await customerPage.goto("http://127.0.0.1:3003/");
  await expect(
    customerPage.getByRole("button", { name: "Dùng tài khoản học viên mẫu" }),
  ).toBeVisible();
  await customerPage
    .getByRole("button", { name: "Dùng tài khoản học viên mẫu" })
    .click();
  await expect(customerPage.locator(".customer-profile")).toContainText(
    "Nguyễn An",
  );
  await page.reload();
  await expect(page.locator(".profile-name")).toContainText("Minh Anh");
  const me = await (await page.request.get("/api/auth/me")).json();
  const original = await (await page.request.get("/api/documents/d1")).json();
  const text = "Học liệu dùng chung giữa hai website — dấu tiếng Việt đầy đủ.";
  const changed = await page.request.patch("/api/documents/d1", {
    headers: { "X-CSRF-Token": me.csrf },
    data: { description: text },
  });
  expect(changed.ok()).toBeTruthy();
  const shared = await customerPage.request.get(
    "http://127.0.0.1:3003/api/documents/d1",
  );
  expect((await shared.json()).description).toBe(text);
  await page.request.patch("/api/documents/d1", {
    headers: { "X-CSRF-Token": me.csrf },
    data: { description: original.description },
  });
});

test("Customer website cannot call administrative routes or read internal repositories", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3003/");
  await expect(page.locator(".customer-header")).toBeVisible();
  await expect(page.locator(".sidebar")).toHaveCount(0);
  for (const endpoint of [
    "users",
    "audit",
    "settings",
    "approvals",
    "uploads",
  ]) {
    const r = await page.request.get("http://127.0.0.1:3003/api/" + endpoint);
    expect(r.status()).toBe(403);
  }
  const repos = await (
    await page.request.get("http://127.0.0.1:3003/api/repositories")
  ).json();
  expect(repos.map((r) => r.type)).toEqual(["BACNHABOOK"]);
  const internal = await page.request.get(
    "http://127.0.0.1:3003/api/documents/d11/preview",
  );
  expect(internal.status()).toBe(404);
  await page.goto("http://127.0.0.1:3003/dashboard");
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy trang học liệu" }),
  ).toBeVisible();
  await expect(page.locator(".stats-grid")).toHaveCount(0);
});

test("Vietnamese regular and italic headings load complete fonts on desktop and mobile", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("http://127.0.0.1:3003/");
  const heading = page.locator(".customer-hero h1");
  await expect(heading).toContainText("Mở trang sách mới,");
  await expect(heading).toContainText("chạm đến chân trời mới.");
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.locator(".customer-document-grid .document-card"),
  ).toHaveCount(8);
  const font = await heading.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toContain("Noto Serif");
  expect(
    await page.evaluate(() =>
      document.fonts.check(
        '400 24px "Noto Serif"',
        "Mở chạm đến trời mới học liệu tiếng Việt",
      ),
    ),
  ).toBeTruthy();
  expect(
    await page.evaluate(() =>
      document.fonts.check('italic 400 24px "Noto Serif"', "chân trời mới"),
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/customer-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(heading).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({
    path: "test-results/customer-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("Internal website has a distinct login wall after logout", async ({
  page,
}) => {
  await page.goto("/library");
  await page.locator(".profile").click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Không gian làm việc nội bộ" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveCount(0);
  await expect(page.locator(".customer-hero")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/internal-login.png",
    fullPage: true,
  });
});
