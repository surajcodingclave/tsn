import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Shipment, Driver, Vehicle } from "@/lib/models";
import { withAuth } from "@/lib/auth";
import { emitShipmentUpdate } from "@/lib/socket";

const find = async (tenantId, trackingNumber) =>
  Shipment.findOne({ tenantId, trackingNumber: String(trackingNumber).toUpperCase() })
    .populate("customerId", "companyName contactPerson phone address email")
    .populate("driverId", "name phone driverUserId status currentLocation")
    .populate("vehicleId", "vehicleNumber type model")
    .lean();

export const GET = withAuth(async (req, { params }) => {
  const { trackingNumber } = await params;
  const shipment = await find(req.session.tenantId, trackingNumber);
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  if (req.session.role === "customer" && String(shipment.customerId._id) !== String(req.session.sub))
    return NextResponse.json({ error: "Not your shipment." }, { status: 403 });
  if (req.session.role === "driver" && String(shipment.driverId?._id) !== String(req.session.sub))
    return NextResponse.json({ error: "Not assigned to you." }, { status: 403 });
  return NextResponse.json({ shipment });
});

const DRIVER_TRANSITIONS = {
  assigned: ["picked", "in-transit"],
  picked: ["in-transit", "out-for-delivery"],
  "in-transit": ["out-for-delivery", "picked"],
  "out-for-delivery": ["delivered", "in-transit"],
};

export const PATCH = withAuth(async (req, { params }) => {
  try {
    const { trackingNumber } = await params;
    const body = await req.json();
    const shipment = await Shipment.findOne({ tenantId: req.session.tenantId, trackingNumber: String(trackingNumber).toUpperCase() }).lean();
    if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

    const update = {};

    // assignment (admin)
    if ("driverId" in body) {
      if (req.session.role !== "admin") return NextResponse.json({ error: "Only admins can assign drivers." }, { status: 403 });
      let driverId = null;
      if (body.driverId && mongoose.isValidObjectId(body.driverId)) {
        const d = await Driver.findOne({ _id: body.driverId, tenantId: req.session.tenantId });
        if (!d) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
        driverId = d._id;
        await Driver.findByIdAndUpdate(driverId, { status: "on-trip" });
      }
      update.driverId = driverId;
      if (driverId) {
        update.status = "assigned";
        update.assignedAt = new Date();
        emitShipmentUpdate({ trackingNumber: shipment.trackingNumber, status: "assigned" });
      }
    }
    if ("vehicleId" in body) {
      update.vehicleId = body.vehicleId && mongoose.isValidObjectId(body.vehicleId) ? body.vehicleId : null;
    }
    if ("paymentStatus" in body) {
      if (!["unpaid", "paid"].includes(body.paymentStatus)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
      update.paymentStatus = body.paymentStatus;
    }
    if ("paymentMode" in body) {
      update.paymentMode = body.paymentMode;
    }

    // status (admin any; driver within their allowed transitions)
    if ("status" in body) {
      const next = body.status;
      const valid = ["pending", "assigned", "picked", "in-transit", "out-for-delivery", "delivered", "cancelled"];
      if (!valid.includes(next)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

      if (req.session.role === "driver") {
        if (String(shipment.driverId) !== String(req.session.sub))
          return NextResponse.json({ error: "Not assigned to you." }, { status: 403 });
        if (!(DRIVER_TRANSITIONS[shipment.status] || []).includes(next))
          return NextResponse.json({ error: `Cannot move from "${shipment.status}" to "${next}".` }, { status: 400 });
      }
      if (req.session.role === "customer")
        return NextResponse.json({ error: "Customers cannot change status." }, { status: 403 });

      update.status = next;
      emitShipmentUpdate({ trackingNumber: shipment.trackingNumber, status: next });

      if (next === "delivered" || next === "cancelled") {
        if (shipment.driverId) await Driver.findByIdAndUpdate(shipment.driverId, { status: "idle" });
        if (shipment.vehicleId) await Vehicle.findByIdAndUpdate(shipment.vehicleId, { status: "available" });
      } else if (next === "assigned" || next === "in-transit" || next === "out-for-delivery") {
        if (shipment.driverId) await Driver.findByIdAndUpdate(shipment.driverId, { status: "on-trip" });
      }
    }

    await Shipment.updateOne({ _id: shipment._id }, { $set: update });
    const updated = Shipment.findOne({ _id: shipment._id }).populate("driverId", "name phone").populate("customerId", "companyName").lean();
    return NextResponse.json({ shipment: await updated });
  } catch (err) {
    console.error("update shipment error:", err?.message);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  if (req.session.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { trackingNumber } = await params;
  const shipment = await Shipment.findOneAndDelete({ tenantId: req.session.tenantId, trackingNumber: String(trackingNumber).toUpperCase() });
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});