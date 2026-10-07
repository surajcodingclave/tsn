import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { POD, Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** Get the POD for a specific shipment by tracking number. Role-scoped. */
export const GET = withAuth(async (req, { params }) => {
  const { trackingNumber } = await params;
  await connectDB();
  const shipment = await Shipment.findOne({
    tenantId: req.session.tenantId,
    trackingNumber: String(trackingNumber).toUpperCase(),
  }).lean();
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  if (req.session.role === "customer" && String(shipment.customerId) !== String(req.session.sub))
    return NextResponse.json({ error: "Not your shipment." }, { status: 403 });
  if (req.session.role === "driver" && String(shipment.driverId) !== String(req.session.sub))
    return NextResponse.json({ error: "Not assigned to you." }, { status: 403 });

  const pod = await POD.findOne({ shipmentId: shipment._id }).populate("deliveredBy", "name").lean();
  if (!pod) return NextResponse.json({ pod: null });
  return NextResponse.json({ pod });
});