import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "./db";
import { withAuth, requireRole } from "./auth";

/**
 * Build standard admin list + create handlers for a tenant-scoped model.
 * Returns { GET, POST } to be re-exported from a route file.
 */
export function makeListCreate({ model, searchFields = [], filterFields = [], allowedFields = [], populate = [], defaultSort = { createdAt: -1 }, coerce = {} }) {
  const GET = withAuth(async (req) => {
    const deny = requireRole(req, ["admin"]);
    if (deny) return deny;

    const sp = req.nextUrl.searchParams;
    const filter = { tenantId: req.session.tenantId };
    const q = sp.get("q") || "";
    if (q && searchFields.length) {
      filter.$or = searchFields.map((f) => ({ [f]: { $regex: q, $options: "i" } }));
    }
    for (const f of filterFields) {
      const v = sp.get(f);
      if (v) filter[f] = v;
    }

    await connectDB();
    let qy = model.find(filter).sort(defaultSort);
    populate.forEach((p) => { qy = qy.populate(p); });
    const items = await qy.lean();
    return NextResponse.json({ items });
  });

  const POST = withAuth(async (req) => {
    const deny = requireRole(req, ["admin"]);
    if (deny) return deny;
    try {
      await connectDB();
      const body = await req.json();
      const doc = { tenantId: req.session.tenantId };
      for (const k of allowedFields) if (k in body) doc[k] = coerce[k] ? coerce[k](body[k]) : body[k];
      const created = await model.create(doc);
      return NextResponse.json({ item: created }, { status: 201 });
    } catch (err) {
      console.error("create error:", err?.message);
      return NextResponse.json({ error: err?.message || "Failed to create." }, { status: 500 });
    }
  });

  return { GET, POST };
}

/** Build standard admin update + delete handlers by :id (tenant-scoped). */
export function makeItem({ model, allowedFields = [], coerce = {} }) {
  const PATCH = withAuth(async (req, { params }) => {
    const deny = requireRole(req, ["admin"]);
    if (deny) return deny;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    const body = await req.json();
    const update = {};
    for (const k of allowedFields) if (k in body) update[k] = coerce[k] ? coerce[k](body[k]) : body[k];
    await connectDB();
    const item = await model.findOneAndUpdate({ _id: id, tenantId: req.session.tenantId }, update, { new: true, runValidators: true }).lean();
    if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ item });
  });

  const DELETE = withAuth(async (req, { params }) => {
    const deny = requireRole(req, ["admin"]);
    if (deny) return deny;
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    await connectDB();
    const item = await model.findOneAndDelete({ _id: id, tenantId: req.session.tenantId });
    if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  });

  return { PATCH, DELETE };
}

export const toNumber = (v) => (v === "" || v == null ? 0 : Number(v));

/** Accepts "YYYY-MM" or "YYYY-MM-DD" and returns a valid Date. */
export const monthDate = (v) => {
  if (!v) return new Date();
  const s = String(v);
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(`${s}-01`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
};
