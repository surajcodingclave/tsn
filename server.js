import next from "next";
import http from "http";
import { initSocketServer } from "./src/lib/socket.js";
import { seedSuperAdmin } from "./src/lib/seed.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();
await seedSuperAdmin();

const server = http.createServer((req, res) => {
  handle(req, res);
});

// Attach Socket.io to the same HTTP server
initSocketServer(server);

server.listen(port, hostname, () => {
  console.log(`>> Transport server ready on http://${hostname}:${port} (${dev ? "dev" : "prod"})`);
});