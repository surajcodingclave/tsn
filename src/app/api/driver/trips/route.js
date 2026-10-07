import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** All trips assigned to the signed-in driver. Driver role only. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "driver")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const shipments = await Shipment.find({
    tenantId: req.session.tenantId,
    driverId: req.session.sub,
  })
    .populate("customerId", "companyName contactPerson phone")
    .populate("vehicleId", "vehicleNumber type")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ shipments });
});