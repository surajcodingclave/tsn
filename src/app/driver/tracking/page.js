"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Radar, Radio } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, FullLoader, EmptyState, StatusBadge } from "@/components/ui";
import { TrackMap } from "@/components/tracking/TrackMap";

export default function DriverTracking() {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-track-map"],
    queryFn: async () => (await fetch("/api/tracking")).json(),
  });

  const trips = data?.shipments || [];

  return (
    <MainShell role="driver">
      <div className="mb-6"><h1 className="flex items-center gap-2 text-2xl font-bold"><Radar className="h-6 w-6" /> Live Tracking</h1><p className="text-muted-foreground">Your active trips on the map.</p></div>

      {isLoading ? <FullLoader /> : !trips.length ? (
        <Card><CardContent><EmptyState icon={Radio} title="No active trips" description="Your assigned active shipments will show here." /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-xl">
                <TrackMap
                  markers={trips.filter((s) => s.live?.lat).map((s) => ({ id: s.trackingNumber, lat: s.live.lat, lng: s.live.lng }))}
                />
              </div>
            </CardContent>
          </Card>
          <Card><CardContent className="p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold">Active trips</div>
            <div className="divide-y divide-border">
              {trips.map((s) => (
                <Link key={s.trackingNumber} href={`/driver/shipments/${s.trackingNumber}`} className="block px-5 py-3 hover:bg-muted/60">
                  <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold">{s.trackingNumber}</span><StatusBadge status={s.status} /></div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.destination.address}</p>
                  {s.live?.lat && <p className="mt-1 font-mono text-xs text-primary">{s.live.lat.toFixed(4)}, {s.live.lng.toFixed(4)}</p>}
                </Link>
              ))}
            </div>
          </CardContent></Card>
        </div>
      )}
    </MainShell>
  );
}