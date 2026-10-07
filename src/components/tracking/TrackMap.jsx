"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { Truck } from "lucide-react";
import { AlertTriangle } from "lucide-react";

const containerStyle = { width: "100%", height: "100%", minHeight: 420 };
const defaultCenter = { lat: 28.6139, lng: 77.209 }; // New Delhi fallback

/** A clickable map pin for a shipment. */
export function ShipmentPin({ color = "#2563eb" }) {
  return (
    <div style={{ transform: "translate(-50%, -100%)" }} className="flex flex-col items-center">
      <div className="rounded-full p-1.5 text-white shadow-lg" style={{ background: color }}>
        <Truck className="h-5 w-5" />
      </div>
      <div className="h-2 w-2 rounded-full" style={{ background: color }} />
    </div>
  );
}

/**
 * Live tracking map. Props:
 * - center: optional [lat,lng]
 * - origin: {lat,lng}
 * - destination: {lat,lng}
 * - live: {lat,lng,updatedAt}
 * - markers: [{id, lat, lng, title, color, label}]  (for the fleet overview)
 */
export function TrackMap({ center, origin, destination, live, markers = [], showRoute = false }) {
  const [ref, setRef] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const mapCenter = useMemo(() => {
    if (center) return { lat: center[0], lng: center[1] };
    if (live?.lat) return { lat: live.lat, lng: live.lng };
    if (origin?.lat) return { lat: origin.lat, lng: origin.lng };
    return defaultCenter;
  }, [center, live, origin]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium">Google Maps API key missing</p>
        <p className="max-w-md text-xs text-muted-foreground">
          Add <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{" "}
          <code className="rounded bg-muted px-1">.env.local</code> to enable the live map.
        </p>
        {live?.lat && (
          <p className="font-mono text-xs">Driver position: {live.lat.toFixed(5)}, {live.lng.toFixed(5)}</p>
        )}
      </div>
    );
  }

  const routePath = showRoute && origin?.lat && destination?.lat ? [origin, destination] : [];
  const livePoint = live?.lat ? [{ lat: +live.lat, lng: +live.lng }] : [];

  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={7}
        center={mapCenter}
        onLoad={(map) => setRef(map)}
        onError={() => setError("Map failed to load — check your API key.")}
      >
        {origin?.lat && (
          <Marker
            position={{ lat: origin.lat, lng: origin.lng }}
            label={{ text: "O", color: "white", fontWeight: "bold" }}
            onClick={() => setSelected("origin")}
          />
        )}
        {destination?.lat && (
          <Marker
            position={{ lat: destination.lat, lng: destination.lng }}
            label={{ text: "D", color: "white", fontWeight: "bold" }}
            onClick={() => setSelected("destination")}
          />
        )}
        {livePoint.map((p, i) => (
          <Marker key={i} position={p} onClick={() => setSelected("live")}>
            <ShipmentPin color="#dc2626" />
          </Marker>
        ))}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            onClick={() => setSelected(m.id)}
          />
        ))}
        {routePath.length > 1 && (
          <Polyline path={routePath} options={{ strokeColor: "#2563eb", strokeWeight: 4 }} />
        )}
      </GoogleMap>

      {selected && origin?.lat && (
        <InfoWindow
          position={selected === "origin" ? { lat: origin.lat, lng: origin.lng } : selected === "destination" ? { lat: destination.lat, lng: destination.lng } : live}
          onCloseClick={() => setSelected(null)}
        >
          <div className="text-sm">
            {selected === "origin" && <b>Origin</b>}
            {selected === "destination" && <b>Destination</b>}
            {selected === "live" && live?.updatedAt && (
              <>
                <b>Driver live position</b>
                <div className="text-xs text-muted-foreground">Updated {new Date(live.updatedAt).toLocaleTimeString()}</div>
              </>
            )}
          </div>
        </InfoWindow>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}