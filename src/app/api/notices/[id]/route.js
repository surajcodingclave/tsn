import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Notice } from "@/lib/models";
import { withAuth } from "@/lib/auth";

const scope = (req, id) => ({ _id: id, tenantId: req.session.tenantId });

export const PATCH = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const body = await req.json();
  const allowed = ["title", "body", "audience", "active"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  if ("active" in update) update.active = update.active === true || update.active === "true";
  const notice = await Notice.findOneAndUpdate(scope(req, id), update, { new: true, runValidators: true }).lean();
  if (!notice) return NextResponse.json({ error: "Notice not found." }, { status: 404 });
  return NextResponse.json({ notice });
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const notice = await Notice.findOneAndDelete(scope(req, id));
  if (!notice) return NextResponse.json({ error: "Notice not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});