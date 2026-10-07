import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin } from "@/lib/models";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const WEEK = 60 * 60 * 24 * 7;

export async function POST(req) {
  try {
    const { userId, password } = await req.json();
    if (!userId || !password)
      return NextResponse.json({ error: "User ID and password are required." }, { status: 400 });

    await connectDB();
    const admin = await Admin.findOne({ adminUserId: String(userId).trim() }).lean();
    if (!admin)
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });
    if (admin.status !== "active")
      return NextResponse.json({ error: "This account is blocked. Contact Super Admin." }, { status: 403 });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });

    const token = await signToken({
      sub: String(admin._id),
      role: "admin",
      tenantId: String(admin._id),
      name: admin.businessName,
    });

    const res = NextResponse.json({
      token,
      role: "admin",
      user: {
        id: String(admin._id),
        name: admin.businessName,
        userId: admin.adminUserId,
        logoUrl: admin.logoUrl,
        email: admin.email,
        phone: admin.phone,
      },
      tenant: { name: admin.businessName, logoUrl: admin.logoUrl, userId: admin.adminUserId },
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: WEEK,
    });
    return res;
  } catch (err) {
    console.error("admin login error:", err?.message);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}