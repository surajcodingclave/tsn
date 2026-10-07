import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Customer, Shipment } from "@/lib/models";
import { withAuth, requireRole } from "@/lib/auth";
import { generateId, generatePassword } from "@/lib/generate";

const publicFields = [
  "customerUserId", "name", "companyName", "contactPerson", "email", "phone",
  "customerType", "gstin", "status", "street", "city", "state", "pincode",
  "country", "billingAddress", "shippingAddress", "notes", "createdAt", "updatedAt",
];
const allowedUpdate = [
  "name", "companyName", "contactPerson", "email", "phone", "customerType", "gstin",
  "street", "city", "state", "pincode", "country", "billingAddress", "shippingAddress", "notes", "status",
];

const safe = (doc) => ({ ...doc, id: String(doc._id) });
/** Single customer (with shipment count). */
export const GET = withAuth(async (req, { params }) => {
  const deny = requireRole(req, ["admin"]);
  if (deny) return deny;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  await connectDB();
  const doc = await Customer.findOne({ _id: id, tenantId: req.session.tenantId }).select(publicFields.join(" ")).lean();
  if (!doc) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  const shipments = await Shipment.countDocuments({ tenantId: req.session.tenantId, customerId: id });
  return NextResponse.json({ customer: { ...safe(doc), shipments } });
});

/** Update a customer. body.regenerateCredentials=true re-issues User ID + password (returned once). */
export const PATCH = withAuth(async (req, { params }) => {
  const deny = requireRole(req, ["admin"]);
  if (deny) return deny;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  await connectDB();

  const body = await req.json();
  const update = {};
  for (const k of allowedUpdate) if (k in body) update[k] = body[k];

  let credentials = null;
  if (body.action === "toggleStatus") {
    const cur = await Customer.findOne({ _id: id, tenantId: req.session.tenantId }).select("status").lean();
    if (!cur) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    update.status = cur.status === "active" ? "blocked" : "active";
  }

  if (body.regenerateCredentials) {
    const password = generatePassword(12);
    update.passwordHash = await bcrypt.hash(password, 10);
    update.customerUserId = generateId("CUS");
    credentials = { userId: update.customerUserId, password, role: "Customer" };
  }

  const item = await Customer.findOneAndUpdate(
    { _id: id, tenantId: req.session.tenantId },
    update,
    { new: true, runValidators: true }
  ).select(publicFields.join(" ")).lean();
  if (!item) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const res = { customer: safe(item) };
  if (credentials) res.credentials = credentials;
  return NextResponse.json(res);
});
/** Delete a customer (only if they have no shipments). */
export const DELETE = withAuth(async (req, { params }) => {
  const deny = requireRole(req, ["admin"]);
  if (deny) return deny;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  await connectDB();
  const count = await Shipment.countDocuments({ tenantId: req.session.tenantId, customerId: id });
  if (count > 0) return NextResponse.json({ error: "Cannot delete a customer that has shipments. Block them instead." }, { status: 409 });
  const item = await Customer.findOneAndDelete({ _id: id, tenantId: req.session.tenantId });
  if (!item) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});