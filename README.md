# Transport Management System

A production-style, **multi-tenant** transport, fleet and shipment management platform built with **Next.js (App Router)** + **MongoDB**, using an **API-first** architecture so the Customer panel can later be turned into a mobile app without rewriting the backend.

Four role panels:

| Panel | What it does |
|-------|--------------|
| **Super Admin** | Creates/manages businesses (tenants), uploads their logo, generates each admin's login credentials, blocks/unblocks, platform-wide stats |
| **Admin** (tenant) | Own branded dashboard — manages clients, drivers, fleet, employees, shipments; assigns drivers/vehicles; live tracking, Proof of Delivery, offline billing, reports, settings |
| **Driver** | Sees assigned trips, updates delivery status, shares live GPS location, captures POD (signature + photo) |
| **Customer** | Sees own shipments, live-tracks them on a map over **Socket.io**, views POD and printable invoices |

---

## Key features

- **Multi-tenant isolation** — every document is scoped by `tenantId`; the Admin business name + logo become the branding shown on every sign-in and panel.
- **Generated credentials** — Super Admin adds a business → system generates `ADM-XXXXXX` + password (shown once). Admin adds drivers/clients → generates `DRV-XXX` / `CUS-XXX` + password (shown once). They log in with **User ID + password**.
- **Live tracking** — driver pushes `geolocation` via `POST /api/tracking/update`; a Node.Socket.io server broadcasts to a per-tracking-number room; Customer/Driver/Admin see it live on **Google Maps**.
- **RBAC + JWT** — JWT claims `{ role, tenantId }`, httpOnly cookie for web + `Authorization: Bearer` for the future mobile app. Every API route verifies role and tenant scope.
- **Offline billing** — payments tracked as paid/unpaid (no payment gateway); printable invoices.

## Tech stack

Next.js 15 (App Router) · JavaScript (JSX) · Tailwind CSS v4 · shadcn-style UI · MongoDB (Mongoose) · JWT (jose) · Socket.io · TanStack Query · @react-google-maps/api · bcryptjs.

---

## Prerequisites

- **Node.js 18+**
- A **MongoDB** database — **MongoDB Atlas** recommended (free tier works). Optional: a **Google Maps API key** for the live map + geocoding.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Configure environment — copy `.env.local.example` to `.env.local` and fill in:
   ```dotenv
   MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/transport
   JWT_SECRET=<a long random string>
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<browser maps key>   # optional
   GOOGLE_GEOCODE_API_KEY=<server geocoding key>        # optional
   SUPER_ADMIN_EMAIL=superadmin@transport.com
   SUPER_ADMIN_PASSWORD=SuperAdmin@123
   PORT=3000
   ```
   The Stats/Geocoding keys are optional — the app falls back gracefully without them.

3. Start
   ```bash
   npm run dev
   ```
   > `npm run dev` and `npm start` use the **custom server** (`server.js`) that also hosts Socket.io.
   > A default **Super Admin is seeded automatically** on first boot from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.

4. Production build
   ```bash
   npm run build
   npm start
   ```

### Zero-setup demo (no Mongo needed)

For a quick local test without provisioning a database, run the app backed by an **in-memory MongoDB**:

```bash
npm install --no-save mongodb-memory-server
node scripts/dev-memory.mjs     # starts app on :3000 with a throwaway DB
node scripts/seed-demo.mjs      # creates sample tenant + client + driver + shipment, prints login creds
node scripts/smoke-test.mjs     # 29 end-to-end API tests
```

---

## How to test every panel (demo credentials)

Sign in at `http://localhost:3000`, choosing the panel from the role-selector at `/login`.

- **Super Admin** → `/superadmin/login` — email + password (env-configured).
- **Admin / Driver / Customer** → their dedicated login pages — use the **User ID + password** generated when each was created.

Run `node scripts/seed-demo.mjs` after starting the app to print a ready-made set of credentials and a shipment to track.

---

## Project structure

```
server.js                 Custom server: Next.js + Socket.io
src/
  middleware.js           Page-level auth/role gating
  lib/
    db.js                 Mongoose connection singleton
    models.js             All Mongoose schemas (Admin, Driver, Customer, Vehicle, Shipment, POD, …)
    auth.js               JWT sign/verify, withAuth/requireRole helpers
    generate.js           User ID + password generators
    socket.js             Socket.io server + live tracking rooms & emits
    geocode.js            Google Geocoding (address -> lat/lng)
  app/
    api/                  All REST endpoints (API-first — reusable by a future mobile app)
      auth/               login (4 roles), me, logout, brand
      superadmin/         tenants CRUD + stats
      clients, drivers, vehicles, employees, shipments, pod,
      reports, settings, tracking, upload, admin/dashboard, driver/trips, customer/shipments
    superadmin/           Super Admin panel (dashboard, businesses)
    admin/                Admin panel (clients, drivers, fleet, employees, shipments,
                          tracking, pod, billing, reports, settings)
    driver/               Driver panel (trips, live tracking, POD, location share)
    customer/             Customer panel (shipments, live track, POD, invoices)
  components/             UI primitives, app shell, tracking map/signature/location components
public/uploads/           Uploaded logos & POD photos
scripts/                  dev-memory (in-memory Mongo), seed-demo, smoke-test
```

## Deployment notes

- Runs on any Node hosting (VPS, Railway, Render, a container, or Vercel with custom server/Node).
- **Realtime**: Socket.io rooms are in-memory — works on a single instance. For horizontal scaling add the Redis adapter (note in `src/lib/socket.js`).
- Set `JWT_SECRET` to a strong random value and Mongo Atlas with network access in production.
```