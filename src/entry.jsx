import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/noto-serif/vietnamese-400.css";
import "@fontsource/noto-serif/vietnamese-400-italic.css";
import "@fontsource/noto-serif/latin-400.css";
import "@fontsource/noto-serif/latin-400-italic.css";
(async () => {
  try {
    const response = await fetch("/api/site");
    if (!response.ok) throw Error();
    const site = await response.json();
    document.title =
      site.portal === "customer"
        ? "Bác Nhã Book · Thư viện học liệu"
        : "Bác Nhã Book · Quản trị & Nội bộ";
    if (site.portal === "customer") await import("./customer.jsx");
    else await import("./main.jsx");
  } catch {
    document.getElementById("root").textContent =
      "Không thể kết nối website. Vui lòng tải lại trang sau ít phút.";
  }
})();
