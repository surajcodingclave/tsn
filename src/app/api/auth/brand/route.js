import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Admin, Driver, Customer } from "@/lib/models";

/** Public — resolves a tenant's branding (name + logo) from a generated User ID.
 * Returns only businessName + logoUrl; never credentials. Used on login pages. */
export async function GET(req) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ tenant: null });
    await connectDB();

    let tenant = null;
    const id = String(userId).trim();

    const admin = await Admin.findOne({ adminUserId: id }).select("businessName logoUrl").lean();
    if (admin) {
      tenant = { name: admin.businessName, logoUrl: admin.logoUrl, kind: "admin" };
    }

    if (!tenant) {
      const driver = await Driver.findOne({ driverUserId: id }).select("tenantId").lean();
      if (driver) {
        const t = await Admin.findById(driver.tenantId).select("businessName logoUrl").lean();
        if (t) tenant = { name: t.businessName, logoUrl: t.logoUrl, kind: "driver" };
      }
    }

    if (!tenant) {
      const customer = await Customer.findOne({ customerUserId: id }).select("tenantId").lean();
      if (customer) {
        const t = await Admin.findById(customer.tenantId).select("businessName logoUrl").lean();
        if (t) tenant = { name: t.businessName, logoUrl: t.logoUrl, kind: "customer" };
      }
    }

    return NextResponse.json({ tenant });
  } catch (err) {
    console.error("brand lookup error:", err?.message);
    return NextResponse.json({ tenant: null });
  }
}