import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Enquiry } from "@/lib/models";
import { withAuth } from "@/lib/auth";

const scope = (req, id) => ({ _id: id, tenantId: req.session.tenantId });

export const PATCH = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const body = await req.json();
  const allowed = ["name", "phone", "email", "from", "to", "vehicleType", "materialType", "weight", "notes", "status", "quoteAmount", "convertedShipment"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = k === "email" ? String(body[k]).toLowerCase() : body[k];
  if ("quoteAmount" in update) update.quoteAmount = Number(update.quoteAmount) || 0;
  if (update.status === "quoted") update.quotedBy = req.session.sub;

  const enquiry = await Enquiry.findOneAndUpdate(scope(req, id), update, { new: true, runValidators: true }).lean();
  if (!enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  return NextResponse.json({ enquiry });
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const enquiry = await Enquiry.findOneAndDelete(scope(req, id));
  if (!enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});