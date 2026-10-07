import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Driver, Shipment, LocationUpdate } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { emitTracking } from "@/lib/socket";

/**
 * Driver pushes their live location for an assigned shipment.
 * Auth: driver role only.
 */
export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "driver") {
      return NextResponse.json({ error: "Only drivers can update location." }, { status: 403 });
    }
    const { trackingNumber, lat, lng } = await req.json();
    if (!trackingNumber || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "trackingNumber, lat and lng are required." }, { status: 400 });
    }

    await connectDB();
    const shipment = await Shipment.findOne({
      trackingNumber: String(trackingNumber),
      tenantId: req.session.tenantId,
    }).lean();
    if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    if (String(shipment.driverId) !== String(req.session.sub)) {
      return NextResponse.json({ error: "This shipment is not assigned to you." }, { status: 403 });
    }

    await LocationUpdate.create({
      tenantId: shipment.tenantId,
      shipmentId: shipment._id,
      driverId: req.session.sub,
      lat,
      lng,
    });

    await Driver.findByIdAndUpdate(req.session.sub, {
      currentLocation: { lat, lng, updatedAt: new Date() },
      status: shipment.status === "assigned" ? "on-trip" : shipment.status === "delivered" || shipment.status === "cancelled" ? "idle" : undefined,
    });

    emitTracking({
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("tracking update error:", err?.message);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
});