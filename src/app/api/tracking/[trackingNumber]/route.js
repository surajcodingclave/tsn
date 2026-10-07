import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Shipment, Driver, LocationUpdate } from "@/lib/models";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req, { params }) => {
  const { trackingNumber } = await params;
  await connectDB();

  const shipment = await Shipment.findOne({
    trackingNumber: String(trackingNumber).toUpperCase(),
    tenantId: req.session.tenantId,
  }).populate("customerId", "companyName contactPerson address phone").lean();

  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  // role permissions: admin -> any in tenant; driver -> assigned; customer -> own
  if (req.session.role === "customer" && String(shipment.customerId._id) !== String(req.session.sub)) {
    return NextResponse.json({ error: "This shipment does not belong to you." }, { status: 403 });
  }
  if (req.session.role === "driver" && String(shipment.driverId) !== String(req.session.sub)) {
    return NextResponse.json({ error: "This shipment is not assigned to you." }, { status: 403 });
  }

  let live = null;
  if (shipment.driverId) {
    const driver = await Driver.findById(shipment.driverId).select("name phone vehicleId currentLocation").lean();
    if (driver) {
      live = {
        lat: driver.currentLocation?.lat ?? null,
        lng: driver.currentLocation?.lng ?? null,
        updatedAt: driver.currentLocation?.updatedAt ?? null,
        driverName: driver.name,
        driverPhone: driver.phone,
      };
    }
  }

  const history = await LocationUpdate.find({ shipmentId: shipment._id })
    .sort({ timestamp: 1 })
    .limit(500)
    .select("lat lng timestamp -_id")
    .lean();

  return NextResponse.json({
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    items: shipment.items,
    paymentStatus: shipment.paymentStatus,
    paymentMode: shipment.paymentMode,
    assignedAt: shipment.assignedAt,
    customer: shipment.customerId,
    live,
    history,
  });
});