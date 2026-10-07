const BASE = "http://localhost:3000";

const login = await fetch(BASE + "/api/auth/login/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "ADM-VELRMF", password: "VY$ZQe#GD6n" }) });
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
console.log("admin login:", login.status, "cookie:", !!cookie);
if (!cookie) process.exit(1);

const pages = [
  "/admin/dashboard",
  "/admin/customers",
  // Fleet Management
  "/admin/fleet", "/admin/vendors", "/admin/maintenance", "/admin/gps",
  // Staff & Payroll
  "/admin/drivers", "/admin/driver-attendance", "/admin/salaries", "/admin/loading-staff",
  // Shipment & Booking
  "/admin/shipments?status=", "/admin/shipments?status=pending", "/admin/shipments?assign=unassigned",
  "/admin/shipments?status=assigned", "/admin/shipments?status=in-transit", "/admin/shipments?status=out-for-delivery",
  "/admin/shipments?status=delivered", "/admin/shipments?status=delivered&pay=paid",
  // Operations
  "/admin/assignments", "/admin/active-trips", "/admin/tracking",
  // Trip Management
  "/admin/trips", "/admin/trip-expenses", "/admin/trip-settlement", "/admin/profit-loss",
  // POD
  "/admin/pod",
  // Transport Receipts
  "/admin/receipts?type=lr", "/admin/receipts?type=pickup_challan", "/admin/receipts?type=delivery_challan",
  "/admin/receipts?type=freight_bill", "/admin/receipts?type=lr_invoice", "/admin/billing", "/admin/vendor-payments",
  // others
  "/admin/reports", "/admin/support", "/admin/notices", "/admin/settings", "/admin/roles",
  // legacy
  "/admin/clients", "/admin/employees", "/admin/enquiries",
];

let pass = 0, fail = 0;
for (const p of pages) {
  const r = await fetch(BASE + p, { headers: { cookie }, redirect: "manual" });
  const ok = r.status === 200;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${r.status}  ${p}`);
}
console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);