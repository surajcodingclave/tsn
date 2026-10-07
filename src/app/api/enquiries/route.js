import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Enquiry } from "@/lib/models";
import { withAuth } from "@/lib/auth";

const SHOW = "name phone email from to vehicleType materialType weight notes status quoteAmount createdAt convertedShipment";

export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const status = req.nextUrl.searchParams.get("status");
  const filter = { tenantId: req.session.tenantId };
  if (status) filter.status = status;
  const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).select(SHOW).lean();
  return NextResponse.json({ enquiries });
});

export const POST = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Contact name is required." }, { status: 400 });
    await connectDB();
    const enquiry = await Enquiry.create({
      tenantId: req.session.tenantId,
      name: body.name,
      phone: body.phone || "",
      email: body.email ? String(body.email).toLowerCase() : "",
      from: body.from || "",
      to: body.to || "",
      vehicleType: body.vehicleType || "",
      materialType: body.materialType || "",
      weight: Number(body.weight) || 0,
      notes: body.notes || "",
      status: "open",
    });
    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (err) {
    console.error("create enquiry error:", err?.message);
    return NextResponse.json({ error: "Failed to create enquiry." }, { status: 500 });
  }
});