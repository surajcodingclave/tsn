"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Drives the `navigator.geolocation` watch and pushes positions to the server.
 * - postUrl: /api/tracking/update
 * - payloadFactory: t => ({ trackingNumber, lat, lng })
 */
export function ShareLocation({ postUrl, payloadFactory, label = "Share live location", onStatus }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const watchId = useRef(null);
  const lastSent = useRef(0);

  const stop = () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing(false);
    onStatus?.("stopped");
  };

  const send = async (lat, lng) => {
    try {
      await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFactory({ lat, lng })),
      });
    } catch {
      /* transient network error — keep watching */
    }
  };

  const start = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await send(pos.coords.latitude, pos.coords.longitude);
        onStatus?.("started");
      },
      (err) => setError(err.message || "Unable to get location."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 8000) return; // throttle
        lastSent.current = now;
        send(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => setError(err.message || "Location tracking error."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    setSharing(true);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="space-y-2">
      {!sharing ? (
        <Button variant="success" onClick={start}>
          <Navigation className="h-4 w-4" /> {label}
        </Button>
      ) : (
        <Button variant="danger" onClick={stop}>
          <MapPin className="h-4 w-4" /> Stop sharing
        </Button>
      )}
      {sharing && <p className="text-xs text-emerald-600">Live location sharing is on</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}