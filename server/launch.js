if (process.env.SITE_MODE === "customer") {
  const { startCustomer } = await import("./customer.js");
  await startCustomer();
} else {
  const { start } = await import("./index.js");
  await start();
}
