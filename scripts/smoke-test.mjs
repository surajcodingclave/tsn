// End-to-end smoke test against a running dev server (http://localhost:3000).
// Exercises: superadmin seed/login -> create tenant -> admin login -> client/driver/vehicle
// -> shipment -> driver login -> status flow -> live location -> POD -> customer isolation.
const BASE = process.env.BASE || "http://localhost:3000";

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};

// per-actor auth holder: uses the Bearer token returned by login (also exercises the mobile-app path)
function actor() {
  let token = null;
  return {
    setToken: (t) => { token = t; },
    header: () => (token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function api(method, path, body, auth) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(auth ? auth.header() : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const main = async () => {
  console.log("\n== Auth & seed ==");
  const sa = actor();
  let r = await api("POST", "/api/auth/login/superadmin", { email: "superadmin@transport.com", password: "SuperAdmin@123" }, sa);
  ok("superadmin login", r.status === 200 && r.data.role === "superadmin", JSON.stringify(r.data));
  sa.setToken(r.data?.token);

  let bad = await api("POST", "/api/auth/login/superadmin", { email: "superadmin@transport.com", password: "wrong" });
  ok("wrong password rejected", bad.status === 401);

  console.log("\n== Tenant creation ==");
  r = await api("POST", "/api/superadmin/admins", { businessName: "Acme Logistics", email: "acme@test.com", city: "Delhi", phone: "9999999999" }, sa);
  ok("create tenant", r.status === 201 && r.data.credentials?.userId, JSON.stringify(r.data));
  const adminCreds = r.data.credentials;

  const stats = await api("GET", "/api/superadmin/stats", null, sa);
  ok("stats tenants>=1", stats.data?.stats?.tenants >= 1);

  console.log("\n== Admin login & tenant data ==");
  const admin = actor();
  r = await api("POST", "/api/auth/login/admin", { userId: adminCreds.userId, password: adminCreds.password }, admin);
  ok("admin login with generated creds", r.status === 200 && r.data.role === "admin", JSON.stringify(r.data));
  admin.setToken(r.data?.token);

  r = await api("GET", "/api/auth/me", null, admin);
  ok("admin /me returns branding", r.status === 200 && r.data.tenant?.name === "Acme Logistics", JSON.stringify(r.data));

  // brand lookup by userId (public)
  const brand = await api("GET", `/api/auth/brand?userId=${adminCreds.userId}`);
  ok("public brand lookup", brand.data?.tenant?.name === "Acme Logistics");

  // create client
  r = await api("POST", "/api/clients", { companyName: "Buyer Co", contactPerson: "Ravi", phone: "8888888888", address: "Mumbai" }, admin);
  ok("create client", r.status === 201 && r.data.credentials?.userId, JSON.stringify(r.data));
  const clientCreds = r.data.credentials;
  const clientId = r.data.client.id;

  // create vehicle
  r = await api("POST", "/api/vehicles", { vehicleNumber: "DL-01-AB-1234", type: "truck", capacity: "8 tons" }, admin);
  ok("create vehicle", r.status === 201 && r.data.vehicle?._id, JSON.stringify(r.data));
  const vehicleId = r.data.vehicle._id;

  // create driver (assign vehicle)
  r = await api("POST", "/api/drivers", { name: "Suresh", phone: "7777777777", licenseNumber: "DL-1234", vehicleId }, admin);
  ok("create driver", r.status === 201 && r.data.credentials?.userId, JSON.stringify(r.data));
  const driverCreds = r.data.credentials;
  const driverId = r.data.driver.id;

  // create shipment assigned to driver + vehicle
  r = await api("POST", "/api/shipments", {
    customerId: clientId, driverId, vehicleId,
    origin: { address: "Delhi Warehouse" }, destination: { address: "Mumbai Port" },
    items: [{ name: "Boxes", qty: 10, weight: 100 }], weight: 100, freightCharge: 5000,
  }, admin);
  ok("create shipment", r.status === 201 && r.data.shipment?.trackingNumber, JSON.stringify(r.data));
  const tn = r.data.shipment.trackingNumber;
  ok("shipment auto-assigned status", r.data.shipment?.status === "assigned", r.data.shipment?.status);

  console.log("\n== Role isolation ==");
  // driver/customer cannot list all clients
  const driver = actor();
  r = await api("POST", "/api/auth/login/driver", { userId: driverCreds.userId, password: driverCreds.password }, driver);
  ok("driver login", r.status === 200 && r.data.role === "driver", JSON.stringify(r.data));
  driver.setToken(r.data?.token);

  r = await api("GET", "/api/clients", null, driver);
  ok("driver blocked from client list (403)", r.status === 403, String(r.status));

  r = await api("GET", "/api/superadmin/stats", null, driver);
  ok("driver blocked from superadmin stats (403)", r.status === 403, String(r.status));

  console.log("\n== Driver trip flow + live tracking ==");
  r = await api("GET", "/api/driver/trips", null, driver);
  ok("driver sees assigned trip", r.data?.shipments?.some((s) => s.trackingNumber === tn));

  for (const st of ["picked", "in-transit", "out-for-delivery"]) {
    r = await api("PATCH", `/api/shipments/${tn}`, { status: st }, driver);
    ok(`driver -> ${st}`, r.status === 200 && r.data.shipment?.status === st, JSON.stringify(r.data));
  }

  r = await api("POST", "/api/tracking/update", { trackingNumber: tn, lat: 28.61, lng: 77.20 }, driver);
  ok("driver posts location", r.status === 200);

  r = await api("GET", `/api/tracking/${tn}`, null, driver);
  ok("tracking returns history", r.status === 200 && r.data.history?.length >= 1, JSON.stringify(r.data?.history));

  console.log("\n== Customer panel ==");
  const cust = actor();
  r = await api("POST", "/api/auth/login/customer", { userId: clientCreds.userId, password: clientCreds.password }, cust);
  ok("customer login", r.status === 200 && r.data.role === "customer", JSON.stringify(r.data));
  cust.setToken(r.data?.token);

  r = await api("GET", "/api/customer/shipments", null, cust);
  ok("customer sees own shipment", r.data?.shipments?.some((s) => s.trackingNumber === tn));

  r = await api("GET", `/api/tracking/${tn}`, null, cust);
  ok("customer can track own shipment", r.status === 200 && r.data.live?.lat === 28.61, JSON.stringify(r.data?.live));

  r = await api("PATCH", `/api/shipments/${tn}`, { status: "delivered" }, cust);
  ok("customer cannot change status (403)", r.status === 403 || r.status === 400, String(r.status));

  console.log("\n== POD + delivery ==");
  r = await api("POST", "/api/pod", { trackingNumber: tn, receiverName: "Ravi", signatureDataUrl: "data:image/png;base64,AAA", notes: "handed over" }, driver);
  ok("driver records POD", r.status === 201, JSON.stringify(r.data));

  r = await api("GET", `/api/shipments/${tn}`, null, admin);
  ok("shipment now delivered", r.data?.shipment?.status === "delivered", r.data?.shipment?.status);

  r = await api("GET", "/api/pod", null, admin);
  ok("admin sees POD", r.data?.pods?.length >= 1);

  console.log("\n== Cross-tenant isolation ==");
  r = await api("POST", "/api/superadmin/admins", { businessName: "Other Trans", email: "other@test.com" }, sa);
  const otherCreds = r.data.credentials;
  const otherAdmin = actor();
  const r2 = await api("POST", "/api/auth/login/admin", { userId: otherCreds.userId, password: otherCreds.password }, otherAdmin);
  otherAdmin.setToken(r2?.data?.token);
  r = await api("GET", "/api/shipments", null, otherAdmin);
  ok("tenant B sees zero tenant A shipments", (r.data?.shipments?.length || 0) === 0, JSON.stringify(r.data?.total));

  console.log(`\n==== ${pass} passed, ${fail} failed ====\n`);
  process.exit(fail ? 1 : 0);
};

main().catch((e) => { console.error("smoke test crashed:", e); process.exit(2); });