const BASE = "http://localhost:3000";
const login = await fetch(BASE + "/api/auth/login/superadmin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "superadmin@transport.com", password: "SuperAdmin@123" }) });
const ld = await login.json();
console.log("login status", login.status);
console.dir(ld, { depth: 2 });
const tok = typeof ld.token === "string" ? ld.token : "";
console.log("token type", typeof ld.token, "len", tok.length);

const me = await fetch(BASE + "/api/auth/me", { headers: { authorization: `Bearer ${ld.token}` } });
console.log("me status", me.status);
console.log("me body", await me.text());

const create = await fetch(BASE + "/api/superadmin/admins", { method: "POST", headers: { "Content-Type": "application/json", authorization: `Bearer ${ld.token}` }, body: JSON.stringify({ businessName: "Probe Co", email: "probe@test.com" }) });
console.log("create status", create.status);
console.log("create body", await create.text());