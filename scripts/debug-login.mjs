import { MongoMemoryServer } from "mongodb-memory-server";
const mongod = await MongoMemoryServer.create({ instance: { dbName: "transport" } });
process.env.MONGODB_URI = mongod.getUri("transport");
process.env.JWT_SECRET = "x";

const bcrypt = (await import("bcryptjs")).default;
const { connectDB } = await import("../src/lib/db.js");
const { SuperAdmin, Admin } = await import("../src/lib/models.js");

await connectDB();
console.log("connected");

const email = "superadmin@transport.com";
await SuperAdmin.create({ email, passwordHash: await bcrypt.hash("SuperAdmin@123", 10), name: "Super Admin" });
const sa = await SuperAdmin.findOne({ email }).lean();
console.log("found:", !!sa, "hash?", !!sa?.passwordHash);
console.log("compare:", await bcrypt.compare("SuperAdmin@123", sa.passwordHash));

// admin model sanity
const a = await Admin.create({ adminUserId: "ADM-TEST01", businessName: "X", email: "x@y.com", passwordHash: "h", status: "active" });
console.log("admin created:", !!a._id);

process.exit(0);
