const BASE = "http://localhost:3000";
const creds = {
  superadmin: { path: "/api/auth/login/superadmin", body: { email: "superadmin@transport.com", password: "SuperAdmin@123" }, dash: "/superadmin/dashboard" },
  admin: { path: "/api/auth/login/admin", body: { userId: "ADM-KQY443", password: "bmTkR@!Jb9F" }, dash: "/admin/dashboard" },
  driver: { path: "/api/auth/login/driver", body: { userId: "DRV-E5FC7V", password: "mX!2RzhTHm" }, dash: "/driver/dashboard" },
  customer: { path: "/api/auth/login/customer", body: { userId: "CUS-3J5E4A", password: "x7&dH9Qucq" }, dash: "/customer/dashboard" },
};

for (const [role, c] of Object.entries(creds)) {
  try {
    const lr = await fetch(BASE + c.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c.body) });
    const cookie = (lr.headers.get("set-cookie") || "").split(";")[0];
    const ld = await lr.json().catch(() => null);
    const dash = await fetch(BASE + c.dash, { headers: { cookie } });
    const redirect = dash.redirected ? dash.url : "200";
    console.log(`${role.padEnd(11)} login=${lr.status} token=${!!(ld?.token)} cookie=${!!cookie} dashboard=${dash.status}${dash.redirected ? " ->redirecting:" + dash.url : ""}`);
  } catch (e) {
    console.log(role, "ERR", e.message);
  }
}