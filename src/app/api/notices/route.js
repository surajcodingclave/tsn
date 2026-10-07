import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notice } from "@/lib/models";
import { withAuth } from "@/lib/auth";

/** List tenant notices. Admins see all; drivers/customers see active notices for them. */
export const GET = withAuth(async (req) => {
  const filter = { tenantId: req.session.tenantId };
  if (req.session.role !== "admin") {
    filter.active = true;
    const audience = req.session.role === "customer" ? { $in: ["all", "customer"] } : { $in: ["all", "driver"] };
    filter.audience = audience;
  } else {
    const sp = req.nextUrl.searchParams;
    const audience = sp.get("audience");
    const active = sp.get("active");
    if (audience) filter.audience = audience;
    if (active === "true" || active === "false") filter.active = active === "true";
  }
  const notices = await Notice.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ notices });
});

export const POST = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    await connectDB();
    const notice = await Notice.create({
      tenantId: req.session.tenantId,
      title: body.title,
      body: body.body || "",
      audience: body.audience || "all",
      active: body.active !== false,
    });
    return NextResponse.json({ notice }, { status: 201 });
  } catch (err) {
    console.error("create notice error:", err?.message);
    return NextResponse.json({ error: "Failed to create notice." }, { status: 500 });
  }
});