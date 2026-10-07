import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Admin, Driver, Customer, Vehicle, Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** Global platform statistics for the Super Admin dashboard. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const [tenants, activeTenants, drivers, customers, vehicles, shipments] = await Promise.all([
    Admin.countDocuments({}),
    Admin.countDocuments({ status: "active" }),
    Driver.estimatedDocumentCount() || Driver.countDocuments({}),
    Customer.estimatedDocumentCount() || Customer.countDocuments({}),
    Vehicle.estimatedDocumentCount() || Vehicle.countDocuments({}),
    Shipment.estimatedDocumentCount() || Shipment.countDocuments({}),
  ]);

  const statusBreakdown = await Shipment.aggregate([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    stats: {
      tenants,
      activeTenants,
      drivers,
      customers,
      vehicles,
      shipments,
    },
    statusBreakdown: Object.fromEntries(statusBreakdown.map((r) => [r._id, r.n])),
  });
});