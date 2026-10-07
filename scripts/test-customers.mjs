// End-to-end test for the full customer data flow + dashboard KPIs.
const BASE = "http://localhost:3000";
const PASS = "✓", FAIL = "✗";
let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`${PASS} ${name}`); }
  else { fail++; console.log(`${FAIL} ${name}${extra}`); }
}

const login = await fetch(BASE + "/api/auth/login/admin", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: ADMIN_UID, password: ADMIN_PW }),
});
const token = (await login.json()).token;
const H = { Authorization: "Bearer " + token };
check("admin login", login.status === 200, ` -> ${login.status}`);

// dashboard new KPIs
const dash = await fetch(BASE + "/api/admin/dashboard", { headers: H });
const d = await dash.json();
check("dashboard 200", dash.status === 200);
const need = ["totalShip","delivered","inTransit","pending","cancelled","revenue","receivables","expenses","profit","customers","drivers","driversBusy","vehicles","vendors","podsToday","openEnquiries","openTickets","unpaidCount","unassigned","assignedCount"];
check("dashboard has all KPIs", need.every((k) => typeof d.stats[k] !== "undefined"), JSON.stringify(d.stats));
check("dashboard trend 6 months", (d.trend || []).length === 6);

// require companyName
const bad = await fetch(BASE + "/api/customers", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ name: "No Company" }) });
check("reject customer without company", bad.status === 400, ` -> ${bad.status} ${JSON.stringify(await bad.text())}`);

// create full customer
const customer = {
  name: "Ramesh Kumar", companyName: "Acme Traders", contactPerson: "Ramesh",
  email: "ramesh@acme.com", phone: "9876543210", customerType: "corporate",
  gstin: "27AABCCDDEEFFG", status: "active",
  street: "12 Main Road", city: "Delhi", state: "Delhi", pincode: "110001", country: "India",
  billingAddress: "Billing addr 1", shippingAddress: "Ship addr 1", notes: "VIP client",
};
const cres = await fetch(BASE + "/api/customers", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(customer) });
let c = await cres.json();
check("create customer 201", cres.status === 201, ` -> ${cres.status} ${JSON.stringify(c)}`);
check("credentials returned", c.credentials && c.credentials.userId && c.credentials.password, JSON.stringify(c.credentials));
check("customerUserId generated", c.credentials.userId.startsWith("CUS-"));

// list has the customer with all fields
const list = await fetch(BASE + "/api/customers?pageSize=500", { headers: H });
let lst = await list.json();
check("list 200", list.status === 200);
const found = lst.customers.find((x) => x.customerUserId === c.credentials.userId);
check("customer in list", !!found, JSON.stringify(found));
check("stored name", found?.name === "Ramesh Kumar");
check("stored companyName", found?.companyName === "Acme Traders");
check("stored customerType", found?.customerType === "corporate");
check("stored gstin", found?.gstin === "27AABCCDDEEFFG");
check("stored city/state", found?.city === "Delhi" && found?.state === "Delhi");
check("stored billingAddress", found?.billingAddress === "Billing addr 1");
check("stored status active", found?.status === "active");
check("passwordHash stripped", found?.passwordHash === undefined);

// single get
const single = await fetch(BASE + "/api/customers/" + found.id, { headers: H });
const sin = await single.json();
check("get single 200", single.status === 200);
check("single has shipments count (number)", typeof sin.customer.shipments === "number");

// toggle status
const before = found.status;
const tRes = await fetch(BASE + "/api/customers/" + found.id, { method: "PATCH", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggleStatus" }) });
check("toggle status 200", tRes.status === 200, ` -> ${tRes.status}`);
check("status toggled", (await tRes.json()).customer.status !== before);

// update
const uRes = await fetch(BASE + `/api/customers/${found.id}`, {
  method: "PATCH", headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ customerType: "premium", city: "Mumbai", notes: "updated" }),
});
check("update customer 200", uRes.status === 200);
check("update applied", ((await uRes.json()).customer.customerType) === "premium");

// customer can log in with generated credentials
const clk = await fetch(BASE + "/api/auth/login/customer", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: c.credentials.userId, password: c.credentials.password }),
});
const cj = await clk.json();
check("customer login with generated creds", clk.status === 200 && cj.role === "customer", ` -> ${clk.status} ${JSON.stringify(cj)}`);

// delete (fresh customer with no shipments)
const toDelete = { companyName: "Temp Co DeleteMe", name: "Temp" };
const dCreate = await fetch(BASE + "/api/customers", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(toDelete) });
const d = await dCreate.json();
const del = await fetch(BASE + "/api/customers/" + d.customer ? d.customer.id : "", { method: "DELETE", headers: H });
check("delete customer with no shipments 200", del.status === 200, ` -> ${del.status}`);

// cannot delete customer that has shipments (the seeded customer)
const seedCust = lst.customers[0];
const badDel = await fetch(BASE + "/api/customers/" + (seedCust?.id || "000000000000000000000000"), { method: "DELETE", headers: H });
check("delete blocked when shipments exist (409/404)", [409, 404].includes(badDel.status), ` -> ${badDel.status}`);

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
