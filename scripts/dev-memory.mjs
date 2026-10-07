// Dev-only helper: boots an in-memory MongoDB, then starts the app with it.
// Usage: node scripts/dev-memory.mjs
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create({ instance: { dbName: "transport" } });
process.env.MONGODB_URI = mongod.getUri("transport");
process.env.SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@transport.com";
process.env.SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
console.log(">> In-memory MongoDB:", process.env.MONGODB_URI);

await import("../server.js");
