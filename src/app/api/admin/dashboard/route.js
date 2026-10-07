import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Shipment, Driver, Customer, Vehicle, POD, TripExpense, Enquiry, Ticket, Vendor } from "@/lib/models";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  await connectDB();
  const tenantId = req.session.tenantId;

  const ACTIVE = ["assigned", "picked", "in-transit", "out-for-delivery"];
  const [
    totalShip, delivered, inTransit, pending, cancelled, unpaidCount, assignedCount, unassigned,
    revenueAgg, unpaidAgg, expensesAgg, driversBusy,
    drivers, customers, vehicles, vendors, podsToday, openEnquiries, openTickets,
    recent,
  ] = await Promise.all([
    Shipment.countDocuments({ tenantId }),
    Shipment.countDocuments({ tenantId, status: "delivered" }),
    Shipment.countDocuments({ tenantId, status: { $in: ACTIVE } }),
    Shipment.countDocuments({ tenantId, status: "pending" }),
    Shipment.countDocuments({ tenantId, status: "cancelled" }),
    Shipment.countDocuments({ tenantId, paymentStatus: "unpaid" }),
    Shipment.countDocuments({ tenantId, status: "assigned" }),
    Shipment.countDocuments({ tenantId, driverId: null, status: { $nin: ["delivered", "cancelled"] } }),
    Shipment.aggregate([{ $match: { tenantId, paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$freightCharge" } } }]),
    Shipment.aggregate([{ $match: { tenantId, paymentStatus: "unpaid" } }, { $group: { _id: null, total: { $sum: "$freightCharge" } } }]),
    TripExpense.aggregate([{ $match: { tenantId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Driver.countDocuments({ tenantId, status: "on-trip" }),
    Driver.countDocuments({ tenantId }),
    Customer.countDocuments({ tenantId }),
    Vehicle.countDocuments({ tenantId }),
    Vendor.countDocuments({ tenantId }),
    POD.countDocuments({ tenantId, deliveredAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    Enquiry.countDocuments({ tenantId, status: { $nin: ["won", "lost"] } }),
    Ticket.countDocuments({ tenantId, status: { $in: ["open", "in-progress"] } }),
    Shipment.find({ tenantId }).populate("customerId", "companyName").sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const revenue = revenueAgg[0]?.total || 0;
  const receivables = unpaidAgg[0]?.total || 0;
  const expenses = expensesAgg[0]?.total || 0;

  // 6-month revenue vs expense trend
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const [revTrend, expTrend] = await Promise.all([
    Shipment.aggregate([
      { $match: { tenantId, paymentStatus: "paid", createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, v: { $sum: "$freightCharge" } } },
    ]),
    TripExpense.aggregate([
      { $match: { tenantId, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, v: { $sum: "$amount" } } },
    ]),
  ]);
  const months = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const k = d.toISOString().slice(0, 7);
    months[k] = { month: k, revenue: 0, expense: 0 };
  }
  revTrend.forEach((r) => { if (months[r._id]) months[r._id].revenue = r.v; });
  expTrend.forEach((r) => { if (months[r._id]) months[r._id].expense = r.v; });
  const trend = Object.values(months);

  return NextResponse.json({
    stats: {
      totalShip, delivered, inTransit, pending, cancelled, assignedCount, unassigned,
      revenue, receivables, expenses, profit: revenue - expenses,
      drivers, driversBusy, customers, vehicles, vendors,
      podsToday, openEnquiries, openTickets, unpaidCount,
    },
    recent,
    trend,
  });
});