import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import { SuperAdmin } from "./models.js";

/** Creates the initial Super Admin account from env if it doesn't exist yet. */
export async function seedSuperAdmin() {
  try {
    await connectDB();
    const email = (process.env.SUPER_ADMIN_EMAIL || "superadmin@transport.com").toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
    const existing = await SuperAdmin.findOne({ email }).lean();
    if (!existing) {
      await SuperAdmin.create({
        email,
        passwordHash: await bcrypt.hash(password, 10),
        name: "Super Admin",
      });
      console.log(`>> Seeded Super Admin: ${email}`);
    }
  } catch (err) {
    console.error("seedSuperAdmin error:", err?.message);
  }
}