import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin, Driver, Customer, Vehicle, Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generateId, generatePassword } from "@/lib/generate";

const SHOW = "_id adminUserId businessName logoUrl email phone city state status gstin createdAt";

/** List all tenant admins with live tallies. Super Admin only. */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const search = req.nextUrl.searchParams.get("q") || "";
  const filter = search ? { $or: [{ businessName: { $regex: search, $options: "i" } }, { adminUserId: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] } : {};

  const admins = await Admin.find(filter).sort({ createdAt: -1 }).select(SHOW).lean();

  const adminIds = admins.map((a) => a._id);
  const [driverCounts, customerCounts, vehicleCounts, shipmentCounts] = await Promise.all([
    Driver.aggregate([{ $match: { tenantId: { $in: adminIds } } }, { $group: { _id: "$tenantId", n: { $sum: 1 } } }]),
    Customer.aggregate([{ $match: { tenantId: { $in: adminIds } } }, { $group: { _id: "$tenantId", n: { $sum: 1 } } }]),
    Vehicle.aggregate([{ $match: { tenantId: { $in: adminIds } } }, { $group: { _id: "$tenantId", n: { $sum: 1 } } }]),
    Shipment.aggregate([{ $match: { tenantId: { $in: adminIds } } }, { $group: { _id: "$tenantId", n: { $sum: 1 } } }]),
  ]);
  const countMap = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r.n]));

  const data = admins.map((a) => ({
    ...a,
    id: String(a._id),
    _id: undefined,
    stats: {
      drivers: countMap(driverCounts)[a.id] || 0,
      customers: countMap(customerCounts)[a.id] || 0,
      vehicles: countMap(vehicleCounts)[a.id] || 0,
      shipments: countMap(shipmentCounts)[a.id] || 0,
    },
  }));

  return NextResponse.json({ admins: data });
});

/** Create a new tenant (admin). Generates User ID + password returned ONLY here. */
export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "superadmin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await req.json();
    const {
      businessName, email, phone, logoUrl, contactPerson,
      address, city, state, country, gstin,
    } = body;

    if (!businessName || !email) {
      return NextResponse.json({ error: "Business name and email are required." }, { status: 400 });
    }

    await connectDB();
    const existing = await Admin.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });
    }

    const adminUserId = generateId("ADM");
    const password = generatePassword(11);
    const admin = await Admin.create({
      adminUserId,
      businessName,
      email: String(email).toLowerCase(),
      phone,
      logoUrl: logoUrl || "",
      contactPerson,
      address, city, state, country, gstin,
      passwordHash: await bcrypt.hash(password, 10),
      status: "active",
    });

    return NextResponse.json(
      {
        admin: { id: String(admin._id), businessName: admin.businessName, adminUserId },
        credentials: { userId: adminUserId, password },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create tenant error:", err?.message);
    return NextResponse.json({ error: "Failed to create admin." }, { status: 500 });
  }
});