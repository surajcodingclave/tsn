import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Driver, Vehicle, Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generateId, generatePassword } from "@/lib/generate";

/** List drivers for this tenant. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const search = req.nextUrl.searchParams.get("q") || "";
  const filter = { tenantId: req.session.tenantId };
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { driverUserId: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];

  const drivers = await Driver.find(filter).populate("vehicleId", "vehicleNumber type model").sort({ createdAt: -1 }).lean();
  const driverIds = drivers.map((d) => d._id);
  const trips = await Shipment.aggregate([
    { $match: { tenantId: req.session.tenantId, driverId: { $in: driverIds }, status: { $in: ["assigned", "picked", "in-transit", "out-for-delivery"] } } },
    { $group: { _id: "$driverId", n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(trips.map((r) => [String(r._id), r.n]));
  return NextResponse.json({
    drivers: drivers.map((d) => ({ ...d, id: String(d._id), passwordHash: undefined, activeTrips: map[String(d._id)] || 0 })),
  });
});

/** Create a driver, optionally assign a vehicle. Generates driver User ID + password. */
export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await req.json();
    const { name, email, phone, licenseNumber, vehicleId } = body;
    if (!name) return NextResponse.json({ error: "Driver name is required." }, { status: 400 });

    await connectDB();
    const driverUserId = generateId("DRV");
    const password = generatePassword(10);

    let resolvedVehicle = null;
    if (vehicleId && mongoose.isValidObjectId(vehicleId)) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, tenantId: req.session.tenantId });
      if (vehicle) resolvedVehicle = vehicle._id;
    }

    const driver = await Driver.create({
      tenantId: req.session.tenantId,
      driverUserId,
      name,
      email: email ? String(email).toLowerCase() : "",
      phone,
      licenseNumber,
      vehicleId: resolvedVehicle,
      passwordHash: await bcrypt.hash(password, 10),
      status: "idle",
    });

    if (resolvedVehicle) {
      await Vehicle.findByIdAndUpdate(resolvedVehicle, { driverId: driver._id, status: "allocated" });
    }

    return NextResponse.json({
      driver: { id: String(driver._id), name, driverUserId },
      credentials: { userId: driverUserId, password },
    }, { status: 201 });
  } catch (err) {
    console.error("create driver error:", err?.message);
    return NextResponse.json({ error: "Failed to create driver." }, { status: 500 });
  }
});