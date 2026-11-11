import express from "express";
import path from "node:path";
import fs from "node:fs";
const allowed = [
  [
    "GET",
    /^\/(auth\/me|repositories|folders|documents|access-requests|notifications)$/,
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
export async function startCustomer() {
  const app = express();
  app.disable("x-powered-by");
  const rawUrl =
    process.env.INTERNAL_API_URL ||
    (process.env.INTERNAL_API_HOST
      ? `http://${process.env.INTERNAL_API_HOST}:${process.env.INTERNAL_API_PORT || 10000}`
      : "");
  if (!rawUrl)
    throw Error(
      "Cần INTERNAL_API_URL hoặc INTERNAL_API_HOST để kết nối website quản trị.",
    );
  const backend = new URL(rawUrl);
  if (
    !["http:", "https:"].includes(backend.protocol) ||
    backend.username ||
    backend.password ||
    backend.pathname !== "/"
  )
    throw Error("Địa chỉ backend không hợp lệ.");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Frame-Options": "SAMEORIGIN",
    });
    next();
  });
  app.get("/api/site", (req, res) =>
    res.json({
      portal: "customer",
      name: "Bác Nhã Book · Học liệu",
      development: process.env.NODE_ENV !== "production",
    }),
  );
  app.get("/api/health", async (req, res) => {
    try {
      const response = await fetch(new URL("/api/customer/health", backend), {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw Error("Backend not ready");
      res.json({ status: "ok", portal: "customer", backend: "connected" });
    } catch {
      res
        .status(503)
        .json({
          error: "Không thể kết nối kho học liệu. Vui lòng thử lại sau.",
        });
    }
  });
  app.use(
    "/api",
    express.raw({ type: () => true, limit: "2mb" }),
    async (req, res) => {
      res.set("Cache-Control", "no-store");
      if (!allowed.some(([m, p]) => req.method === m && p.test(req.path)))
        return res
          .status(403)
          .json({ error: "Chức năng này không có trên website học liệu." });
      if (req.headers.origin) {
        try {
          if (new URL(req.headers.origin).host !== req.headers.host)
            throw Error();
        } catch {
          return res.status(403).json({ error: "Nguồn yêu cầu không hợp lệ." });
        }
      }
      try {
        const headers = {};
        for (const key of ["content-type", "x-csrf-token", "range"])
          if (req.headers[key]) headers[key] = req.headers[key];
        if (req.headers.cookie)
          headers.cookie = req.headers.cookie
            .split(";")
            .filter((c) => c.trim().startsWith("bacnha_customer_session="))
            .join(";");
        headers.origin = backend.origin;
        const target = new URL("/api/customer" + req.url, backend);
        const response = await fetch(target, {
          method: req.method,
          headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
          redirect: "manual",
          signal: AbortSignal.timeout(30000),
        });
        res.status(response.status);
        for (const name of [
          "content-type",
          "content-disposition",
          "cache-control",
          "content-range",
          "accept-ranges",
          "x-request-id",
        ])
          if (response.headers.has(name))
            res.set(name, response.headers.get(name));
        for (const cookie of response.headers.getSetCookie())
          res.append("Set-Cookie", cookie);
        res.send(Buffer.from(await response.arrayBuffer()));
      } catch {
        res
          .status(502)
          .json({
            error: "Kho học liệu tạm thời chưa phản hồi. Vui lòng thử lại.",
          });
      }
    },
  );
  if (
    process.env.SERVE_BUILD === "true" ||
    process.env.NODE_ENV === "production"
  ) {
    if (!fs.existsSync(path.resolve("dist/index.html")))
      throw Error("Chạy npm run build trước.");
    app.use(express.static(path.resolve("dist")));
    app.get("/{*path}", (req, res) =>
      res.sendFile(path.resolve("dist/index.html")),
    );
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: { port: Number(process.env.PORT || 3003) + 21678 },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  app.use((err, req, res, next) =>
    res
      .status(err.type === "entity.too.large" ? 413 : 500)
      .json({ error: "Không thể xử lý yêu cầu." }),
  );
  return app.listen(Number(process.env.PORT || 3003), "0.0.0.0", () =>
    console.log(
      `Bacnhabook customer website ready on port ${process.env.PORT || 3003}`,
    ),
  );
}
