import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Employee } from "@/lib/models";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const role = req.nextUrl.searchParams.get("role");
  const filter = { tenantId: req.session.tenantId };
  if (role) filter.role = role;
  const employees = await Employee.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ employees: employees.map((e) => ({ ...e, id: String(e._id) })) });
});

export const POST = withAuth(async (req) => {
  try {
    if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    const body = await req.json();
    const { name, role, email, phone, salary, joinedAt, status } = body;
    if (!name) return NextResponse.json({ error: "Employee name is required." }, { status: 400 });

    await connectDB();
    const employee = await Employee.create({
      tenantId: req.session.tenantId,
      name,
      role: role || "staff",
      email: email ? String(email).toLowerCase() : "",
      phone,
      salary: Number(salary) || 0,
      joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
      status: status || "active",
    });
    return NextResponse.json({ employee }, { status: 201 });
  } catch (err) {
    console.error("create employee error:", err?.message);
    return NextResponse.json({ error: "Failed to create employee." }, { status: 500 });
  }
});