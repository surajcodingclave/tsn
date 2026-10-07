import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Admin } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generatePassword } from "@/lib/generate";

const SHOW = "-passwordHash";

export const GET = withAuth(async (req, { params }) => {
  if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const admin = await Admin.findById(id).select(SHOW).lean();
  if (!admin) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  return NextResponse.json({ admin });
});

/** Update tenant details or block/unblock (status). */
export const PATCH = withAuth(async (req, { params }) => {
  try {
    if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }
    const body = await req.json();
    const allowed = ["businessName", "email", "phone", "logoUrl", "contactPerson", "address", "city", "state", "country", "gstin", "status"];
    const update = {};
    for (const k of allowed) if (k in body) update[k] = k === "email" ? String(body[k]).toLowerCase() : body[k];

    const admin = await Admin.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(SHOW).lean();
    if (!admin) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    return NextResponse.json({ admin });
  } catch (err) {
    console.error("update tenant error:", err?.message);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const admin = await Admin.findByIdAndDelete(id).lean();
  if (!admin) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});

/** Generate a fresh password for an admin (User ID stays the same). */
export const POST = withAuth(async (req, { params }) => {
  if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const bodyType = req.nextUrl.searchParams.get("action");
  if (bodyType !== "reset-password") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const password = generatePassword(11);
  await Admin.findByIdAndUpdate(id, { passwordHash: await bcrypt.hash(password, 10) });
  const admin = await Admin.findById(id).select("adminUserId businessName").lean();
  if (!admin) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  return NextResponse.json({ credentials: { userId: admin.adminUserId, password } });
});