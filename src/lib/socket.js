import { Server as SocketServer } from "socket.io";
import { jwtVerify } from "jose";
import { connectDB } from "./db.js";
import { Shipment } from "./models.js";

const GLOBAL_KEY = "__transportIO";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

async function verifySocketToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

const cors =
  process.env.NODE_ENV === "development"
    ? { origin: "*", methods: ["GET", "POST"] }
    : { origin: true, methods: ["GET", "POST"] };

/**
 * Initialize Socket.io on a raw http server (from server.js).
 * Authentication is verified once at connect time via the JWT handshake token.
 */
export function initSocketServer(httpServer) {
  if (globalThis[GLOBAL_KEY]) return globalThis[GLOBAL_KEY];

  const io = new SocketServer(httpServer, {
    cors,
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    verifySocketToken(token)
      .then((payload) => {
        if (!payload) return next(new Error("Unauthorized"));
        socket.data.session = payload;
        next();
      })
      .catch(() => next(new Error("Unauthorized")));
  });

  io.on("connection", (socket) => {
    const s = socket.data.session;
    // tenant-wide room lets every member of a tenant broadcast / scope simply
    socket.join(`tenant:${String(s.tenantId || s.sub)}`);

    // Client subscribes to a tracking number from the live-track page.
    // Permission is verified against the DB so a customer can only follow
    // their own shipments and a driver only their assigned ones.
    socket.on("tracking:subscribe", async (trackingNumber, ack) => {
      try {
        if (!trackingNumber) return ack && ack({ ok: false, error: "missing" });
        await connectDB();
        const shipment = await Shipment.findOne({
          trackingNumber: String(trackingNumber),
          tenantId: s.tenantId,
        }).lean();
        if (!shipment) return ack && ack({ ok: false, error: "not-found" });

        if (s.role === "customer" && String(shipment.customerId) !== String(s.sub)) {
          return ack && ack({ ok: false, error: "forbidden" });
        }
        if (s.role === "driver" && String(shipment.driverId) !== String(s.sub)) {
          return ack && ack({ ok: false, error: "forbidden" });
        }

        socket.join(`tracking:${trackingNumber}`);
        return ack && ack({ ok: true, trackingNumber });
      } catch (err) {
        console.error("tracking:subscribe error", err?.message);
        return ack && ack({ ok: false, error: "server" });
      }
    });
  });

  globalThis[GLOBAL_KEY] = io;
  return io;
}

export function getIO() {
  return globalThis[GLOBAL_KEY] || null;
}

/** Broadcast a live location update to everyone watching that tracking number(s). */
export function emitTracking({ trackingNumber, status, lat, lng, updatedAt }) {
  const io = getIO();
  if (!io || !trackingNumber) return;
  io.to(`tracking:${trackingNumber}`).emit("tracking:update", {
    trackingNumber,
    status,
    location: { lat, lng, updatedAt },
  });
}

export function emitShipmentUpdate({ trackingNumber, status }) {
  const io = getIO();
  if (!io || !trackingNumber) return;
  io.to(`tracking:${trackingNumber}`).emit("shipment:update", {
    trackingNumber,
    status,
  });
}