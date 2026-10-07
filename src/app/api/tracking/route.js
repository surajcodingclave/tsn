import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Shipment, Driver } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** Active shipments with live driver positions. Role-scoped. */
export const GET = withAuth(async (req) => {
  await connectDB();
  const tenantId = req.session.tenantId;
  const statuses = ["assigned", "picked", "in-transit", "out-for-delivery"];

  const filter = { tenantId, status: { $in: statuses } };
  if (req.session.role === "customer") filter.customerId = req.session.sub;
  if (req.session.role === "driver") filter.driverId = req.session.sub;

  const shipments = await Shipment.find(filter)
    .populate("driverId", "name phone currentLocation")
    .populate("vehicleId", "vehicleNumber type")
    .populate("customerId", "companyName")
    .select("trackingNumber status origin destination driverId vehicleId customerId createdAt")
    .lean();

  const out = shipments.map((s) => ({
    id: String(s._id),
    trackingNumber: s.trackingNumber,
    status: s.status,
    origin: s.origin,
    destination: s.destination,
    customer: s.customerId?.companyName,
    vehicle: s.vehicleId?.vehicleNumber || "",
    driver: s.driverId?.name || "",
    live: s.driverId?.currentLocation
      ? { lat: s.driverId.currentLocation.lat, lng: s.driverId.currentLocation.lng, updatedAt: s.driverId.currentLocation.updatedAt }
      : null,
  }));

  return NextResponse.json({ shipments: out });
});