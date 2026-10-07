import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Customer } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generatePassword } from "@/lib/generate";

const tenantScope = (req, id) => ({ _id: id, tenantId: req.session.tenantId });

export const GET = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const client = await Customer.findOne(tenantScope(req, id)).lean();
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  return NextResponse.json({ client: { ...client, passwordHash: undefined } });
});

export const PATCH = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["companyName", "contactPerson", "email", "phone", "address", "status"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = k === "email" ? String(body[k]).toLowerCase() : body[k];
  const client = await Customer.findOneAndUpdate(tenantScope(req, id), update, { new: true, runValidators: true }).lean();
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  return NextResponse.json({ client: { ...client, passwordHash: undefined } });
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const client = await Customer.findOneAndDelete(tenantScope(req, id));
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});

/** Reset a client password. */
export const POST = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (req.nextUrl.searchParams.get("action") !== "reset-password")
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const password = generatePassword(10);
  const client = await Customer.findOneAndUpdate(tenantScope(req, id), { passwordHash: await bcrypt.hash(password, 10) }, { new: true }).select("customerUserId companyName").lean();
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  return NextResponse.json({ credentials: { userId: client.customerUserId, password } });
});