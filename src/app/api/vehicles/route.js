import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Vehicle, Driver } from "@/lib/models";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const search = req.nextUrl.searchParams.get("q") || "";
  const status = req.nextUrl.searchParams.get("status") || "";
  const filter = { tenantId: req.session.tenantId };
  if (search) filter.$or = [{ vehicleNumber: { $regex: search, $options: "i" } }, { type: { $regex: search, $options: "i" } }];
  if (status && ["available", "allocated", "maintenance"].includes(status)) filter.status = status;

  const vehicles = await Vehicle.find(filter)
    .populate("driverId", "name phone driverUserId")
    .populate("ownerId", "name")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ vehicles: vehicles.map((v) => ({ ...v, id: String(v._id) })) });
});

export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await req.json();
    const { vehicleNumber, type, model, capacity, rcNumber, driverId, ownerId, status, vendorId, gpsDevice, gpsStatus } = body;
    if (!vehicleNumber) return NextResponse.json({ error: "Vehicle number is required." }, { status: 400 });

    await connectDB();
    const exists = await Vehicle.findOne({ tenantId: req.session.tenantId, vehicleNumber });
    if (exists) return NextResponse.json({ error: "This vehicle number already exists." }, { status: 409 });

    let resolvedDriver = null;
    if (driverId && mongoose.isValidObjectId(driverId)) {
      const d = await Driver.findOne({ _id: driverId, tenantId: req.session.tenantId });
      if (d) resolvedDriver = d._id;
    }

    const vehicle = await Vehicle.create({
      tenantId: req.session.tenantId,
      vehicleNumber,
      type: type || "truck",
      model,
      capacity,
      rcNumber,
      driverId: resolvedDriver,
      ownerId: ownerId && mongoose.isValidObjectId(ownerId) ? ownerId : null,
      vendorId: vendorId && mongoose.isValidObjectId(vendorId) ? vendorId : null,
      gpsDevice,
      gpsStatus: gpsStatus || "none",
      status: status || (resolvedDriver ? "allocated" : "available"),
    });

    if (resolvedDriver) {
      await Driver.findByIdAndUpdate(resolvedDriver, { vehicleId: vehicle._id });
    }
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (err) {
    console.error("create vehicle error:", err?.message);
    return NextResponse.json({ error: "Failed to create vehicle." }, { status: 500 });
  }
});