import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Driver, Vehicle } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generatePassword } from "@/lib/generate";

const scope = (req, id) => ({ _id: id, tenantId: req.session.tenantId });

export const GET = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const driver = await Driver.findOne(scope(req, id)).populate("vehicleId", "vehicleNumber type model").lean();
  if (!driver) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  return NextResponse.json({ driver: { ...driver, passwordHash: undefined } });
});

export const PATCH = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "email", "phone", "licenseNumber", "vehicleId", "status", "avatarUrl"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = k === "email" ? String(body[k]).toLowerCase() : body[k];

  if ("vehicleId" in update) {
    // free the previous vehicle if any
    const before = await Driver.findById(id).select("vehicleId").lean();
    if (before?.vehicleId) {
      await Vehicle.findByIdAndUpdate(before.vehicleId, { $unset: { driverId: 1 }, status: "available" });
    }
    if (update.vehicleId && mongoose.isValidObjectId(update.vehicleId)) {
      const v = await Vehicle.findOne({ _id: update.vehicleId, tenantId: req.session.tenantId });
      if (!v) delete update.vehicleId;
      else {
        await Vehicle.findByIdAndUpdate(update.vehicleId, { driverId: id, status: "allocated" });
      }
    } else {
      update.vehicleId = null;
    }
  }

  const driver = await Driver.findOneAndUpdate(scope(req, id), update, { new: true, runValidators: true }).lean();
  if (!driver) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  return NextResponse.json({ driver: { ...driver, passwordHash: undefined } });
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const driver = await Driver.findOne(scope(req, id)).lean();
  if (!driver) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  if (driver.vehicleId) {
    await Vehicle.findByIdAndUpdate(driver.vehicleId, { $unset: { driverId: 1 }, status: "available" });
  }
  await Driver.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
});

export const POST = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (req.nextUrl.searchParams.get("action") !== "reset-password")
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const password = generatePassword(10);
  const driver = await Driver.findOneAndUpdate(scope(req, id), { passwordHash: await bcrypt.hash(password, 10) }, { new: true }).select("driverUserId name").lean();
  if (!driver) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  return NextResponse.json({ credentials: { userId: driver.driverUserId, password } });
});