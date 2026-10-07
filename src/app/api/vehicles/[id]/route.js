import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Vehicle, Driver } from "@/lib/models";
import { withAuth } from "@/lib/auth";

const scope = (req, id) => ({ _id: id, tenantId: req.session.tenantId });

export const GET = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const vehicle = await Vehicle.findOne(scope(req, id)).populate("driverId", "name phone").lean();
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  return NextResponse.json({ vehicle });
});

export const PATCH = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["vehicleNumber", "type", "model", "capacity", "rcNumber", "driverId", "ownerId", "status", "vendorId", "gpsDevice", "gpsStatus"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = body[k];

  if ("driverId" in update) {
    const before = await Vehicle.findById(id).select("driverId").lean();
    if (before?.driverId && String(before.driverId) !== String(update.driverId)) {
      await Driver.findByIdAndUpdate(before.driverId, { $unset: { vehicleId: 1 } });
    }
    if (update.driverId && mongoose.isValidObjectId(update.driverId)) {
      const d = await Driver.findOne({ _id: update.driverId, tenantId: req.session.tenantId });
      if (!d) delete update.driverId;
      else await Driver.findByIdAndUpdate(update.driverId, { vehicleId: id });
    } else {
      update.driverId = null;
    }
  }

  const vehicle = await Vehicle.findOneAndUpdate(scope(req, id), update, { new: true, runValidators: true }).lean();
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  return NextResponse.json({ vehicle });
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const vehicle = await Vehicle.findOne(scope(req, id)).lean();
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  if (vehicle.driverId) await Driver.findByIdAndUpdate(vehicle.driverId, { $unset: { vehicleId: 1 } });
  await Vehicle.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
});