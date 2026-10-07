import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** All shipments belonging to the signed-in customer. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "customer")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const shipments = await Shipment.find({
    tenantId: req.session.tenantId,
    customerId: req.session.sub,
  })
    .populate("driverId", "name phone")
    .populate("vehicleId", "vehicleNumber type")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ shipments });
});