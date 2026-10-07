import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Customer } from "@/lib/models";
import { withAuth, requireRole } from "@/lib/auth";
import { generateId, generatePassword } from "@/lib/generate";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const searchFields = [
  "companyName", "name", "contactPerson", "email", "phone", "gstin", "customerUserId",
];

/** Public (admin) + searchable fields returned to the client. Password hashes are stripped. */
const publicFields = [
  "customerUserId", "companyName", "name", "contactPerson", "email", "phone", "customerType", "gstin",
  "status", "street", "city", "state", "pincode", "country", "billingAddress",
  "shippingAddress", "notes", "createdAt", "updatedAt",
];
const allowedUpdate = [
  "name", "companyName", "contactPerson", "email", "phone", "customerType", "gstin",
  "street", "city", "state", "pincode", "country", "billingAddress", "shippingAddress", "notes", "status",
];

/** List / create customers. */
export const GET = withAuth(async (req) => {
  const deny = requireRole(req, ["admin"]);
  if (deny) return deny;
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const tenantId = req.session.tenantId;

  const filter = { tenantId };
  const q = (sp.get("q") || "").trim();
  if (q) filter.$or = searchFields.map((f) => ({ [f]: { $regex: q, $options: "i" } }));
  const status = sp.get("status");
  if (status) filter.status = status;
  const customerType = sp.get("customerType");
  if (customerType) filter.customerType = customerType;

  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") || 20)));

  const sortBy = sp.get("sortBy") || "createdAt";
  const sortDir = sp.get("sortDir") === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ [sortBy]: sortDir })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(publicFields.join(" "))
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return NextResponse.json({
    customers: items.map((c) => ({ ...c, id: String(c._id) })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

/** Create a customer. Generates User ID + password (returned once). */
export const POST = withAuth(async (req) => {
  const deny = requireRole(req, ["admin"]);
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const companyName = String((body.companyName || "").trim());
    if (!companyName) return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    if (body.email && !EMAIL_RE.test(body.email)) return NextResponse.json({ error: "Invalid email address." }, { status: 400 });

    const exists = await Customer.findOne({
      tenantId: req.session.tenantId,
      $or: [{ companyName }, { email: body.email }, { phone: body.phone }],
    });
    if (exists) return NextResponse.json({ error: "A customer with these details already exists." }, { status: 409 });

    const customerUserId = generateId("CUS");
    const password = generatePassword(12);

    const doc = {
      tenantId: req.session.tenantId,
      customerUserId,
      companyName,
      name: body.name || "",
      contactPerson: body.contactPerson || "",
      email: body.email ? String(body.email).toLowerCase() : "",
      phone: body.phone || "",
      customerType: body.customerType || "regular",
      gstin: body.gstin || "",
      status: body.status || "active",
      street: body.street || "",
      address: buildAddress(body),
      city: body.city || "",
      state: body.state || "",
      pincode: body.pincode || "",
      country: body.country || "",
      billingAddress: body.billingAddress || "",
      shippingAddress: body.shippingAddress || "",
      notes: body.notes || "",
      passwordHash: await bcrypt.hash(password, 10),
    };

    const created = await Customer.create(doc);
    return NextResponse.json(
      {
        customer: {
          id: String(created._id),
          customerUserId,
          companyName: created.companyName,
          email: created.email,
          phone: created.phone,
        },
        credentials: { userId: customerUserId, password, role: "Customer" },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("create customer error:", err?.message);
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
  }
});

function buildAddress(b) {
  const parts = [b.street, b.city, b.state, b.pincode, b.country].filter(Boolean);
  return parts.join(", ");
}
