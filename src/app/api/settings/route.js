import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** Admin settings: read + update own business branding/profile. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const admin = await Admin.findById(req.session.tenantId).select("-passwordHash").lean();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ admin });
});

export const PATCH = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await req.json();
  const allowed = ["businessName", "logoUrl", "email", "phone", "contactPerson", "address", "city", "state", "country", "gstin"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = k === "email" ? String(body[k]).toLowerCase() : body[k];

  const admin = await Admin.findByIdAndUpdate(req.session.tenantId, update, { new: true, runValidators: true }).select("-passwordHash").lean();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ admin });
});

/** Change own admin login password. */
export const POST = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (req.nextUrl.searchParams.get("action") !== "change-password")
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const { current, next } = await req.json();
  if (!current || !next) return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });

  const admin = await Admin.findById(req.session.tenantId).lean();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const ok = await bcrypt.compare(current, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  await Admin.findByIdAndUpdate(req.session.tenantId, { passwordHash: await bcrypt.hash(next, 10) });
  return NextResponse.json({ ok: true });
});