import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Shipment, Customer, Driver, Vehicle } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generateId } from "@/lib/generate";
import { geocodeAddress } from "@/lib/geocode";
import { emitShipmentUpdate } from "@/lib/socket";

const LIST_STATUS = ["pending", "assigned", "picked", "in-transit", "out-for-delivery", "delivered", "cancelled"];

export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const q = searchParams.get("q") || "";
  let page = parseInt(searchParams.get("page") || "1", 10);
  page = Math.max(1, page);
  const limit = 20;

  const pay = searchParams.get("pay");
  const assign = searchParams.get("assign");
  const filter = { tenantId: req.session.tenantId };
  if (status && LIST_STATUS.includes(status)) filter.status = status;
  if (pay === "paid" || pay === "unpaid") filter.paymentStatus = pay;
  if (assign === "unassigned") filter.driverId = null;
  if (assign === "assigned") filter.driverId = { $ne: null };
  if (q) filter.$or = [{ trackingNumber: { $regex: q, $options: "i" } }, { "destination.address": { $regex: q, $options: "i" } }, { "origin.address": { $regex: q, $options: "i" } }];

  const [shipments, total] = await Promise.all([
    Shipment.find(filter)
      .populate("customerId", "companyName contactPerson")
      .populate("driverId", "name phone")
      .populate("vehicleId", "vehicleNumber type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Shipment.countDocuments(filter),
  ]);

  return NextResponse.json({ shipments, total, page, pages: Math.ceil(total / limit) });
});

export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await req.json();
    const {
      customerId, driverId, vehicleId,
      origin, destination, items, dimensions, weight,
      freightCharge, paymentMode, notes,
    } = body;

    if (!customerId) return NextResponse.json({ error: "Select a client for this shipment." }, { status: 400 });
    if (!origin?.address || !destination?.address)
      return NextResponse.json({ error: "Origin and destination addresses are required." }, { status: 400 });

    await connectDB();
    const customer = await Customer.findOne({ _id: customerId, tenantId: req.session.tenantId }).lean();
    if (!customer) return NextResponse.json({ error: "Client not found." }, { status: 404 });

    let resolvedDriver = null;
    if (driverId && mongoose.isValidObjectId(driverId)) {
      const d = await Driver.findOne({ _id: driverId, tenantId: req.session.tenantId });
      if (d) resolvedDriver = d._id;
    }
    let resolvedVehicle = null;
    if (vehicleId && mongoose.isValidObjectId(vehicleId)) {
      const v = await Vehicle.findOne({ _id: vehicleId, tenantId: req.session.tenantId });
      if (v) resolvedVehicle = v._id;
    }

    // geocode addresses so maps + route work; non-fatal if no key
    const [o, de] = await Promise.all([geocodeAddress(origin.address), geocodeAddress(destination.address)]);

    const trackingNumber = `SHP-${generateId("", 8)}`;
    const status = resolvedDriver ? "assigned" : "pending";

    const shipment = await Shipment.create({
      tenantId: req.session.tenantId,
      trackingNumber,
      customerId,
      driverId: resolvedDriver,
      vehicleId: resolvedVehicle,
      origin: {
        address: origin.address,
        lat: origin.lat ?? o?.lat ?? null,
        lng: origin.lng ?? o?.lng ?? null,
      },
      destination: {
        address: destination.address,
        lat: destination.lat ?? de?.lat ?? null,
        lng: destination.lng ?? de?.lng ?? null,
      },
      status,
      items: Array.isArray(items) ? items : [],
      dimensions,
      weight: Number(weight) || 0,
      freightCharge: Number(freightCharge) || 0,
      paymentMode: paymentMode || "offline",
      notes,
      assignedAt: resolvedDriver ? new Date() : null,
    });

    if (resolvedDriver) {
      await Driver.findByIdAndUpdate(resolvedDriver, { status: "on-trip" });
      emitShipmentUpdate({ trackingNumber, status });
    }
    if (resolvedVehicle) {
      await Vehicle.findByIdAndUpdate(resolvedVehicle, { status: "allocated" });
    }

    return NextResponse.json({ shipment }, { status: 201 });
  } catch (err) {
    console.error("create shipment error:", err?.message);
    return NextResponse.json({ error: "Failed to create shipment." }, { status: 500 });
  }
});