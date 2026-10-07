// Creates a demo tenant + client + driver + vehicle + shipment with FIXED-looking
// generated credentials and prints them so every panel can be tested from the browser.
const BASE = process.env.BASE || "http://localhost:3000";

const api = async (method, path, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

const out = {};

const login = await api("POST", "/api/auth/login/superadmin", { email: "superadmin@transport.com", password: "SuperAdmin@123" });
const saToken = login.data.token;

const t = await api("POST", "/api/superadmin/admins", {
  businessName: "Delight Cargo Logistics", email: "admin@delightcargo.com", phone: "+91 98100 12345",
  contactPerson: "Amit Verma", address: "45, Industrial Area", city: "Gurugram", state: "Haryana", country: "India", gstin: "06ABCDE1234F1Z5",
}, saToken);
out.superAdmin = { login: "superadmin@transport.com", password: "SuperAdmin@123" };
out.admin = { userId: t.data.credentials.userId, password: t.data.credentials.password };

const adminTok = t.data ? await (async () => {
  const l = await api("POST", "/api/auth/login/admin", { userId: t.data.credentials.userId, password: t.data.credentials.password });
  return l.data.token;
})() : null;

const c = await api("POST", "/api/clients", { companyName: "Acme Traders Pvt Ltd", contactPerson: "Priya Sharma", phone: "+91 98200 67890", address: "12, Marine Drive, Mumbai" }, adminTok);
out.customer = { userId: c.data.credentials.userId, password: c.data.credentials.password };
const clientId = c.data.client.id;

const v = await api("POST", "/api/vehicles", { vehicleNumber: "HR-26-AK-8842", type: "truck", model: "Tata 407", capacity: "4 tons", rcNumber: "HR-26-5678" }, adminTok);
const vehicleId = v.data.vehicle._id;

const d = await api("POST", "/api/drivers", { name: "Rahul Sharma", phone: "+91 98300 11223", licenseNumber: "DL-RS-2024-44556", vehicleId }, adminTok);
out.driver = { userId: d.data.credentials.userId, password: d.data.credentials.password };
const driverId = d.data.driver.id;

const s = await api("POST", "/api/shipments", {
  customerId: clientId, driverId, vehicleId,
  origin: { address: "45, Industrial Area, Gurugram, Haryana 122001" },
  destination: { address: "12, Marine Drive, Mumbai 400002" },
  items: [{ name: "Electronics consignment", qty: 25, weight: 120 }],
  weight: 120, freightCharge: 8500, paymentMode: "offline", notes: "Handle with care",
}, adminTok);
out.shipment = { trackingNumber: s.data.shipment.trackingNumber, status: s.data.shipment.status };
const tn = s.data.shipment.trackingNumber;

// sample records across the new modules (via real APIs)
await api("POST", "/api/vendors", { name: "Sharma Transport Co.", type: "vendor", phone: "+91 98111 22334", gstin: "07AAACS1111A1Z1" }, adminTok);
await api("POST", "/api/maintenance", { vehicleId, type: "service", description: "Full service & oil change", cost: 6500, odometer: 48210, status: "completed" }, adminTok);
await api("POST", "/api/salaries", { driverId, month: new Date().toISOString().slice(0, 7) + "-01", base: 25000, bonus: 2000, deduction: 0, net: 27000, paid: "true" }, adminTok);
await api("POST", "/api/trip-expenses", { trackingNumber: tn, driverId, type: "fuel", amount: 3200, note: "Diesel top-up" }, adminTok);
await api("POST", "/api/trip-expenses", { trackingNumber: tn, driverId, type: "toll", amount: 850, note: "Highway toll" }, adminTok);
await api("POST", "/api/documents", { type: "lr", number: "LR-1001", trackingNumber: tn, partyName: "Acme Traders Pvt Ltd", amount: 8500, status: "issued" }, adminTok);
await api("POST", "/api/documents", { type: "lr_invoice", number: "INV-2001", trackingNumber: tn, partyName: "Acme Traders Pvt Ltd", amount: 8500, status: "paid" }, adminTok);
await api("POST", "/api/notices", { title: "New safety guidelines", body: "All drivers must wear seat belts at all times.", audience: "driver" }, adminTok);
await api("POST", "/api/enquiries", { name: "Ravi Freight Needs", phone: "+91 90000 11111", from: "Delhi", to: "Jaipur", materialType: "Textiles", weight: 500 }, adminTok);
await api("POST", "/api/tickets", { subject: "Driver app login issue", message: "Driver reported OTP delay on login.", priority: "medium", status: "open" }, adminTok);

console.log("\n================ DEMO LOGIN CREDENTIALS ================\n");
const row = (label, a, b) => console.log(`  ${label.padEnd(11)} |  ${String(a).padEnd(12)} |  ${b}`);
console.log("  ROLE       |  USER ID     |  PASSWORD");
console.log("  -----------|--------------|-------------");
row("Super Admin", out.superAdmin.login, out.superAdmin.password);
row("Admin", out.admin.userId, out.admin.password);
row("Driver", out.driver.userId, out.driver.password);
row("Customer", out.customer.userId, out.customer.password);
console.log("\n  Shipment tracking number:", out.shipment.trackingNumber, `(${out.shipment.status})`);
console.log("\n  Open http://localhost:3000 and sign in.");
console.log("==========================================================\n");