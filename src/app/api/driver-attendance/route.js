import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** List attendance for a given date (defaults to today). Admin only. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const dateStr = req.nextUrl.searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();
  const from = new Date(date); from.setHours(0, 0, 0, 0);
  const to = new Date(date); to.setHours(23, 59, 59, 999);

  const records = await Attendance.find({ tenantId: req.session.tenantId, date: { $gte: from, $lte: to } })
    .populate("driverId", "name phone driverUserId status")
    .lean();
  return NextResponse.json({ records });
});

/** Mark attendance for (multiple) drivers on a date. Upserts per driver+date. */
export const POST = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const body = await req.json();
    const { date, entries } = body; // entries: [{driverId, status, checkIn, checkOut, notes}]
    if (!date || !Array.isArray(entries) || !entries.length)
      return NextResponse.json({ error: "Provide a date and at least one entry." }, { status: 400 });
    const d = new Date(date); d.setHours(0, 0, 0, 0);

    for (const e of entries) {
      await Attendance.findOneAndUpdate(
        { tenantId: req.session.tenantId, driverId: e.driverId, date: d },
        { $set: { status: e.status || "present", checkIn: e.checkIn || "", checkOut: e.checkOut || "", notes: e.notes || "" } },
        { upsert: true, new: true }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("attendance error:", err?.message);
    return NextResponse.json({ error: "Failed to save attendance." }, { status: 500 });
  }
});