import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Customer, Admin } from "@/lib/models";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const WEEK = 60 * 60 * 24 * 7;

export async function POST(req) {
  try {
    const { userId, password } = await req.json();
    if (!userId || !password)
      return NextResponse.json({ error: "User ID and password are required." }, { status: 400 });

    await connectDB();
    const customer = await Customer.findOne({ customerUserId: String(userId).trim() }).lean();
    if (!customer)
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });

    if (customer.status !== "active")
      return NextResponse.json({ error: "This account is blocked." }, { status: 403 });

    const tenant = await Admin.findById(customer.tenantId).lean();
    if (!tenant || tenant.status !== "active")
      return NextResponse.json({ error: "This account is currently disabled." }, { status: 403 });

    const ok = await bcrypt.compare(password, customer.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Invalid User ID or password." }, { status: 401 });

    const token = await signToken({
      sub: String(customer._id),
      role: "customer",
      tenantId: String(customer.tenantId),
      name: customer.companyName,
    });

    const res = NextResponse.json({
      token,
      role: "customer",
      user: {
        id: String(customer._id),
        name: customer.companyName,
        contactPerson: customer.contactPerson,
        userId: customer.customerUserId,
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
    console.error("customer login error:", err?.message);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}