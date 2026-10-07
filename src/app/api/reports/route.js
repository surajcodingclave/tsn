import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Shipment, Driver, Vehicle, Customer } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** Admin reports: KPIs + revenue over an optional date range. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const filter = { tenantId: req.session.tenantId };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  await connectDB();
  const [shipments, byStatus, byPayment, revenueAgg, drivers, vehicles, customers, byDriverAgg, byVehicleAgg] = await Promise.all([
    Shipment.find(filter).select("freightCharge paymentStatus status createdAt driverId vehicleId").lean(),
    Shipment.aggregate([{ $match: filter }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Shipment.aggregate([{ $match: filter }, { $group: { _id: "$paymentStatus", n: { $sum: 1 }, amount: { $sum: "$freightCharge" } } }]),
    Shipment.aggregate([{ $match: { ...filter, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$freightCharge" } } }]),
    Driver.countDocuments({ tenantId: req.session.tenantId }),
    Vehicle.countDocuments({ tenantId: req.session.tenantId }),
    Customer.countDocuments({ tenantId: req.session.tenantId }),
    Shipment.aggregate([
      { $match: filter },
      { $group: { _id: "$driverId", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$freightCharge", 0] } } } },
    ]),
    Shipment.aggregate([
      { $match: filter },
      { $group: { _id: "$vehicleId", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$freightCharge", 0] } } } },
    ]),
  ]);

  const driverNames = await Driver.find({ tenantId: req.session.tenantId, _id: { $in: byDriverAgg.map((r) => r._id) } }).select("name").lean();
  const vehicleNumbers = await Vehicle.find({ tenantId: req.session.tenantId, _id: { $in: byVehicleAgg.map((r) => r._id) } }).select("vehicleNumber").lean();
  const driverNameMap = Object.fromEntries(driverNames.map((d) => [String(d._id), d.name]));
  const vehicleNumberMap = Object.fromEntries(vehicleNumbers.map((v) => [String(v._id), v.vehicleNumber]));

  const byDriver = byDriverAgg.map((r) => ({ id: r._id, name: driverNameMap[String(r._id)] || "Unassigned", count: r.count, revenue: r.revenue }));
  const byVehicle = byVehicleAgg.map((r) => ({ id: r._id, number: vehicleNumberMap[String(r._id)] || "Unassigned", count: r.count, revenue: r.revenue }));

  const statusMap = Object.fromEntries(byStatus.map((r) => [r._id, r.n]));
  const paymentMap = Object.fromEntries(byPayment.map((r) => [r._id, { n: r.n, amount: r.amount }]));

  // daily trend for the range
  const trend = await Shipment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$freightCharge", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json({
    stats: {
      total: shipments.length,
      delivered: statusMap.delivered || 0,
      inTransit: (statusMap["in-transit"] || 0) + (statusMap["out-for-delivery"] || 0) + (statusMap.picked || 0),
      pending: statusMap.pending || 0,
      cancelled: statusMap.cancelled || 0,
      revenue: revenueAgg[0]?.total || 0,
      unpaidAmount: paymentMap.unpaid?.amount || 0,
      paidCount: paymentMap.paid?.n || 0,
      unpaidCount: paymentMap.unpaid?.n || 0,
      drivers,
      vehicles,
      customers,
    },
    statusMap,
    paymentMap,
    trend,
    byDriver,
    byVehicle,
  });
});