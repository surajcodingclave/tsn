import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Employee } from "@/lib/models";
import { withAuth } from "@/lib/auth";

const scope = (req, id) => ({ _id: id, tenantId: req.session.tenantId });

export const PATCH = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "role", "email", "phone", "salary", "joinedAt", "status"];
  const update = {};
  for (const k of allowed) if (k in body) update[k] = k === "email" ? String(body[k]).toLowerCase() : body[k];
  if ("salary" in update) update.salary = Number(update.salary) || 0;

  const employee = await Employee.findOneAndUpdate(scope(req, id), update, { new: true, runValidators: true }).lean();
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json({ employee });
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const employee = await Employee.findOneAndDelete(scope(req, id));
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});