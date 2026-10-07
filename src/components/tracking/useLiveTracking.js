"use client";

import { useEffect, useState, useRef } from "react";
import { getSocket } from "@/lib/client/socket-client";

/**
 * Subscribe to live updates for a tracking number over the shared socket.
 * Returns { location, shipmentStatus, connected, refresh }.
 */
export function useLiveTracking({ trackingNumber, token, enabled = true }) {
  const [location, setLocation] = useState(null);
  const [shipmentStatus, setShipmentStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (!trackingNumber || !token || !enabled || done.current) return;
    done.current = true;

    const socket = getSocket(token);

    const onConnect = () => {
      setConnected(true);
      socket.emit("tracking:subscribe", trackingNumber, (ack) => {
        if (!ack?.ok) console.warn("subscribe failed:", ack?.error);
      });
    };
    const onTracking = (data) => {
      if (data.trackingNumber !== trackingNumber) return;
      setLocation(data.location);
      if (data.status) setShipmentStatus(data.status);
    };
    const onShipment = (data) => {
      if (data.trackingNumber === trackingNumber) setShipmentStatus(data.status);
    };
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("tracking:update", onTracking);
    socket.on("shipment:update", onShipment);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("tracking:update", onTracking);
      socket.off("shipment:update", onShipment);
      socket.off("disconnect", onDisconnect);
    };
  }, [trackingNumber, token, enabled]);

  return { location, shipmentStatus, connected };
}