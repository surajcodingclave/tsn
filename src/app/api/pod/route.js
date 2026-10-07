import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { POD, Shipment, Driver } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { emitShipmentUpdate } from "@/lib/socket";

/** List PODs for this tenant (admin) or own (customer/driver). */
export const GET = withAuth(async (req) => {
  await connectDB();
  let filter = { tenantId: req.session.tenantId };
  if (req.session.role === "customer") {
    const shipments = await Shipment.find({ tenantId: req.session.tenantId, customerId: req.session.sub }).select("_id").lean();
    filter = { tenantId: req.session.tenantId, shipmentId: { $in: shipments.map((s) => s._id) } };
  } else if (req.session.role === "driver") {
    filter = { tenantId: req.session.tenantId, deliveredBy: req.session.sub };
  }
  const pods = await POD.find(filter)
    .populate("shipmentId", "trackingNumber destination.address")
    .populate("deliveredBy", "name")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ pods });
});

/** Driver records proof of delivery (signature + photo). */
export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "driver" && req.session.role !== "admin")
      return NextResponse.json({ error: "Only drivers (or admins) can record POD." }, { status: 403 });

    const { trackingNumber, receiverName, signatureDataUrl, photoUrl, notes } = await req.json();
    if (!trackingNumber) return NextResponse.json({ error: "trackingNumber is required." }, { status: 400 });
    if (!receiverName) return NextResponse.json({ error: "Receiver name is required." }, { status: 400 });

    await connectDB();
    const shipment = await Shipment.findOne({ tenantId: req.session.tenantId, trackingNumber: String(trackingNumber).toUpperCase() }).lean();
    if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

    if (req.session.role === "driver" && String(shipment.driverId) !== String(req.session.sub))
      return NextResponse.json({ error: "Not assigned to you." }, { status: 403 });

    const existing = await POD.findOne({ shipmentId: shipment._id }).lean();
    if (existing) return NextResponse.json({ error: "POD already recorded for this shipment." }, { status: 409 });

    const pod = await POD.create({
      tenantId: req.session.tenantId,
      shipmentId: shipment._id,
      receiverName,
      signatureDataUrl: signatureDataUrl || "",
      photoUrl: photoUrl || "",
      notes,
      deliveredBy: req.session.role === "driver" ? req.session.sub : null,
      deliveredAt: new Date(),
    });

    await Shipment.updateOne({ _id: shipment._id }, { $set: { status: "delivered" } });
    if (req.session.role === "driver") await Driver.findByIdAndUpdate(req.session.sub, { status: "idle" });
    emitShipmentUpdate({ trackingNumber: shipment.trackingNumber, status: "delivered" });

    return NextResponse.json({ pod }, { status: 201 });
  } catch (err) {
    console.error("create POD error:", err?.message);
    return NextResponse.json({ error: "Failed to save POD." }, { status: 500 });
  }
});