import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Customer, Shipment } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { generateId, generatePassword } from "@/lib/generate";

/** List this admin's clients (customers). */
export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const search = req.nextUrl.searchParams.get("q") || "";
  const filter = { tenantId: req.session.tenantId };
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { contactPerson: { $regex: search, $options: "i" } },
      { customerUserId: { $regex: search, $options: "i" } },
    ];
  }
  const clients = await Customer.find(filter).sort({ createdAt: -1 }).lean();
  const ids = clients.map((c) => c._id);
  const counts = await Shipment.aggregate([
    { $match: { tenantId: req.session.tenantId, customerId: { $in: ids } } },
    { $group: { _id: "$customerId", n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((r) => [String(r._id), r.n]));
  return NextResponse.json({
    clients: clients.map((c) => ({ ...c, id: String(c._id), passwordHash: undefined, shipments: map[String(c._id)] || 0 })),
  });
});

/** Create a client. Generates a customer User ID + password returned once. */
export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await req.json();
    const { companyName, contactPerson, email, phone, address } = body;
    if (!companyName) return NextResponse.json({ error: "Company name is required." }, { status: 400 });

    await connectDB();
    const exists = await Customer.findOne({ tenantId: req.session.tenantId, companyName });
    if (exists) return NextResponse.json({ error: "A client with this company name already exists." }, { status: 409 });

    const customerUserId = generateId("CUS");
    const password = generatePassword(10);
    const client = await Customer.create({
      tenantId: req.session.tenantId,
      customerUserId,
      companyName,
      contactPerson,
      email: email ? String(email).toLowerCase() : "",
      phone,
      address,
      passwordHash: await bcrypt.hash(password, 10),
      status: "active",
    });

    return NextResponse.json({
      client: { id: String(client._id), customerUserId, companyName },
      credentials: { userId: customerUserId, password },
    }, { status: 201 });
  } catch (err) {
    console.error("create client error:", err?.message);
    return NextResponse.json({ error: "Failed to create client." }, { status: 500 });
  }
});