import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { SuperAdmin } from "@/lib/models";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const WEEK = 60 * 60 * 24 * 7;

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    await connectDB();
    const sa = await SuperAdmin.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (!sa)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const ok = await bcrypt.compare(password, sa.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const token = await signToken({ sub: String(sa._id), role: "superadmin", name: sa.name || "Super Admin" });

    const res = NextResponse.json({ token, role: "superadmin", user: { id: String(sa._id), email: sa.email, name: sa.name } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: WEEK,
    });
    return res;
  } catch (err) {
    console.error("superadmin login error:", err?.message);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}