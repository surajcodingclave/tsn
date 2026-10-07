"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Radio, PackageSearch, Clock } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, CardHeader, CardTitle, FullLoader, StatusBadge } from "@/components/ui";
import { TrackMap } from "@/components/tracking/TrackMap";
import { useLiveTracking } from "@/components/tracking/useLiveTracking";
import { useSession } from "@/components/SessionProvider";

export default function CustomerTrack() {
  const { trackingNumber } = useParams();
  const { token } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["customer-track", trackingNumber],
    queryFn: async () => (await fetch(`/api/tracking/${trackingNumber}`)).json(),
  });

  const liveHook = useLiveTracking({ trackingNumber, token, enabled: !!data });

  if (isLoading || !data?.trackingNumber) return <MainShell role="customer"><FullLoader /></MainShell>;
  const t = data;

  const live = liveHook.location || t.live;
  const status = liveHook.shipmentStatus || t.status;

  return (
    <MainShell role="customer">
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold">{t.trackingNumber}</h1>
        <div className="mt-1 flex items-center gap-2"><StatusBadge status={status} /> {liveHook.connected ? <Radio className="h-4 w-4 text-emerald-500" /> : <Radio className="h-4 w-4 text-muted-foreground" />}</div>
        <p className="mt-1 text-sm text-muted-foreground">Live updates from the driver.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-xl">
              <TrackMap
                origin={t.origin?.lat ? { lat: t.origin.lat, lng: t.origin.lng } : null}
                destination={t.destination?.lat ? { lat: t.destination.lat, lng: t.destination.lng } : null}
                live={live?.lat ? { lat: +live.lat, lng: +live.lng, updatedAt: live.updatedAt } : null}
                showRoute
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Live position</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {live?.lat ? (
                <>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Driver</span><span>{live.driverName || t.live?.driverName || "—"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Updated</span><span>{live.updatedAt ? new Date(live.updatedAt).toLocaleTimeString() : "—"}</span></div>
                  <p className="pt-1 font-mono text-xs text-primary">{Number(live.lat).toFixed(5)}, {Number(live.lng).toFixed(5)}</p>
                  <a href={`https://www.google.com/maps?q=${live.lat},${live.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 pt-1 text-xs text-primary underline">
                    <MapPin className="h-3.5 w-3.5" /> Open in Maps
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for the driver to share a live position…</p>
              )}
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><PackageSearch className="h-4 w-4" /> Shipment</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Origin</span><span className="max-w-[150px] text-right">{t.origin.address}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span className="max-w-[150px] text-right">{t.destination.address}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{t.items?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><StatusBadge status={t.paymentStatus} /></div>
          </CardContent></Card>

          {t.history?.length > 0 && (
            <Card><CardHeader><CardTitle>Recent location updates</CardTitle></CardHeader><CardContent>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {[...t.history].reverse().slice(0, 8).map((h, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-1 text-xs last:border-0">
                    <span className="font-mono">{h.lat.toFixed(4)}, {h.lng.toFixed(4)}</span>
                    <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </div>
      </div>
    </MainShell>
  );
}