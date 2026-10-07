import mongoose from "mongoose";
import { connectDB } from "./db.js";

const { Schema, model, models } = mongoose;

async function init() {
  await connectDB();
}

/* ---------------- Super Admin ---------------- */
const SuperAdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Super Admin" },
  },
  { timestamps: true }
);

/* ---------------- Admin (Tenant) ---------------- */
const AdminSchema = new Schema(
  {
    adminUserId: { type: String, required: true, unique: true },
    businessName: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    gstin: { type: String, default: "" },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

/* ---------------- Driver ---------------- */
const DriverSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    driverUserId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: "", lowercase: true },
    phone: { type: String, default: "" },
    licenseNumber: { type: String, default: "" },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null },
    avatarUrl: { type: String, default: "" },
    status: { type: String, enum: ["idle", "on-trip", "offline"], default: "idle" },
    passwordHash: { type: String, required: true },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);
DriverSchema.index({ tenantId: 1, driverUserId: 1 }, { unique: true });

/* ---------------- Customer (also a login account + client) ---------------- */
const CustomerSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    customerUserId: { type: String, required: true },
    name: { type: String, default: "" }, // contact person / customer name
    companyName: { type: String, required: true },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    phone: { type: String, default: "" },
    customerType: {
      type: String,
      enum: ["regular", "corporate", "retail", "wholesale", "government", "premium"],
      default: "regular",
    },
    gstin: { type: String, default: "" },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    // addresses
    street: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "" },
    billingAddress: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },
    notes: { type: String, default: "" },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);
CustomerSchema.index({ tenantId: 1, customerUserId: 1 }, { unique: true });

/* ---------------- Vehicle (Fleet) ---------------- */
const VehicleSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    vehicleNumber: { type: String, required: true },
    type: { type: String, default: "truck" },
    model: { type: String, default: "" },
    capacity: { type: String, default: "" },
    rcNumber: { type: String, default: "" },
    status: { type: String, enum: ["available", "allocated", "maintenance"], default: "available" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    gpsDevice: { type: String, default: "" },
    gpsStatus: { type: String, enum: ["online", "offline", "none"], default: "none" },
  },
  { timestamps: true }
);

/* ---------------- Vendor ---------------- */
const VendorSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["owner", "vendor", "transporter"], default: "vendor" },
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    address: { type: String, default: "" },
    gstin: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

/* ---------------- Vehicle Maintenance ---------------- */
const MaintenanceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    type: { type: String, enum: ["service", "repair", "tyre", "oil", "insurance", "other"], default: "service" },
    description: { type: String, default: "" },
    cost: { type: Number, default: 0 },
    odometer: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

/* ---------------- Driver Salary ---------------- */
const SalarySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    month: { type: Date, required: true },
    base: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidOn: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
SalarySchema.index({ tenantId: 1, driverId: 1, month: 1 }, { unique: true });

/* ---------------- Trip Expense ---------------- */
const TripExpenseSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    trackingNumber: { type: String, default: "" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    type: { type: String, enum: ["fuel", "toll", "food", "repair", "parking", "other"], default: "fuel" },
    amount: { type: Number, default: 0 },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ---------------- Transport Receipt / Document ---------------- */
const DocumentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    type: { type: String, enum: ["lr", "pickup_challan", "delivery_challan", "freight_bill", "lr_invoice", "vendor_payment"], required: true },
    number: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    partyName: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["draft", "issued", "paid", "cancelled"], default: "issued" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
DocumentSchema.index({ tenantId: 1, type: 1 });

/* ---------------- Support Ticket ---------------- */
const TicketSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, default: "" },
    category: { type: String, default: "general" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in-progress", "resolved", "closed"], default: "open" },
    raisedBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

/* ---------------- Employee (admin's own staff) ---------------- */
const EmployeeSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["manager", "helper", "staff", "supervisor", "loading"], default: "staff" },
    email: { type: String, default: "", lowercase: true },
    phone: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

/* ---------------- Shipment ---------------- */
const ShipmentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    trackingNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null },
    origin: {
      address: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    destination: {
      address: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "picked", "in-transit", "out-for-delivery", "delivered", "cancelled"],
      default: "pending",
    },
    items: [
      {
        name: { type: String, default: "" },
        qty: { type: Number, default: 1 },
        weight: { type: Number, default: 0 },
      },
    ],
    dimensions: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    freightCharge: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paymentMode: { type: String, enum: ["cash", "offline", "credit"], default: "offline" },
    notes: { type: String, default: "" },
    assignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
ShipmentSchema.index({ tenantId: 1, trackingNumber: 1 }, { unique: true });
ShipmentSchema.index({ tenantId: 1, status: 1 });

/* ---------------- POD (Proof of Delivery) ---------------- */
const PodSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true },
    receiverName: { type: String, default: "" },
    signatureDataUrl: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    deliveredBy: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* ---------------- LocationUpdate ---------------- */
const LocationUpdateSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
LocationUpdateSchema.index({ shipmentId: 1, timestamp: 1 });

/* ---------------- Notice (tenant announcement) ---------------- */
const NoticeSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    audience: { type: String, enum: ["admin", "driver", "customer", "all"], default: "all" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ---------------- Enquiry (quote / lead) ---------------- */
const EnquirySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    materialType: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["open", "contacted", "quoted", "won", "lost"], default: "open" },
    quoteAmount: { type: Number, default: 0 },
    quotedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    convertedShipment: { type: String, default: "" }, // tracking number if converted
  },
  { timestamps: true }
);
EnquirySchema.index({ tenantId: 1, status: 1 });

/* ---------------- Driver Attendance ---------------- */
const AttendanceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "leave"], default: "present" },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
AttendanceSchema.index({ tenantId: 1, driverId: 1, date: 1 }, { unique: true });

const register = (name, schema) => models[name] || model(name, schema);

export const SuperAdmin = register("SuperAdmin", SuperAdminSchema);
export const Admin = register("Admin", AdminSchema);
export const Driver = register("Driver", DriverSchema);
export const Customer = register("Customer", CustomerSchema);
export const Vehicle = register("Vehicle", VehicleSchema);
export const Employee = register("Employee", EmployeeSchema);
export const Shipment = register("Shipment", ShipmentSchema);
export const POD = register("POD", PodSchema);
export const LocationUpdate = register("LocationUpdate", LocationUpdateSchema);
export const Notice = register("Notice", NoticeSchema);
export const Enquiry = register("Enquiry", EnquirySchema);
export const Attendance = register("Attendance", AttendanceSchema);
export const Vendor = register("Vendor", VendorSchema);
export const Maintenance = register("Maintenance", MaintenanceSchema);
export const Salary = register("Salary", SalarySchema);
export const TripExpense = register("TripExpense", TripExpenseSchema);
export const Document = register("Document", DocumentSchema);
export const Ticket = register("Ticket", TicketSchema);

export { init };