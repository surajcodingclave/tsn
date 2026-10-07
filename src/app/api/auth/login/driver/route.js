import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Driver, Admin } from "@/lib/models";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const WEEK = 60 * 60 * 24 * 7;

export async function POST(req) {
  try {
    const { userId, password } = await req.json();
    if (!userId || !password)
      return NextResponse.json({ error: "User ID and password are required." }, { status: 400 });

    await connectDB();
    const driver = await Driver.findOne({ driverUserId: String(userId).trim() }).lean();
    if (!driver)
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });

    // tenant gate — driver can't log in if the owning admin/business is blocked
    const tenant = await Admin.findById(driver.tenantId).lean();
    if (!tenant || tenant.status !== "active")
      return NextResponse.json({ error: "This account is currently disabled." }, { status: 403 });

    const ok = await bcrypt.compare(password, driver.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });

    const token = await signToken({
      sub: String(driver._id),
      role: "driver",
      tenantId: String(driver.tenantId),
      name: driver.name,
    });

    const res = NextResponse.json({
      token,
      role: "driver",
      user: {
        id: String(driver._id),
        name: driver.name,
        userId: driver.driverUserId,
        phone: driver.phone,
      },
      tenant: { name: tenant.businessName, logoUrl: tenant.logoUrl },
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
    console.error("driver login error:", err?.message);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}