import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { Admin, Driver, Customer } from "@/lib/models";
import { withAuth } from "@/lib/auth";

const SHOW = "name businessName logoUrl email phone adminUserId driverUserId customerUserId contactPerson";

/**
 * Returns the current session (user + tenant branding).
 * Used by the web UI to render branding and by the socket client to grab a token.
 */
export const GET = withAuth(async (req) => {
  const s = req.session;
  await connectDB();

  // expose the token (cookie on web, bearer for future app) so the socket client can auth
  const store = await cookies();
  const cookieToken = store.get("tms_token")?.value;
  const token = req.headers.get("authorization")?.slice(7) || cookieToken || "";

  let user = null;
  let tenant = null;

  if (s.role === "admin") {
    user = await Admin.findById(s.sub).select(SHOW).lean();
    if (user) tenant = { name: user.businessName, logoUrl: user.logoUrl, userId: user.adminUserId };
  } else if (s.role === "driver") {
    user = await Driver.findById(s.sub).select(SHOW).lean();
    if (user) {
      const t = await Admin.findById(user.tenantId).select("businessName logoUrl").lean();
      tenant = t ? { name: t.businessName, logoUrl: t.logoUrl } : null;
    }
  } else if (s.role === "customer") {
    user = await Customer.findById(s.sub).select(SHOW).lean();
    if (user) {
      const t = await Admin.findById(user.tenantId).select("businessName logoUrl").lean();
      tenant = t ? { name: t.businessName, logoUrl: t.logoUrl } : null;
    }
  } else if (s.role === "superadmin") {
    user = { id: s.sub, name: s.name, email: s.email };
  }

  return NextResponse.json({
    role: s.role,
    token,
    user,
    tenant,
  });
});