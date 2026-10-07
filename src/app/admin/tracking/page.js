"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Radar, Radio } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, FullLoader, EmptyState, StatusBadge } from "@/components/ui";
import { TrackMap } from "@/components/tracking/TrackMap";
import { useLiveTracking } from "@/components/tracking/useLiveTracking";
import { useSession } from "@/components/SessionProvider";

export default function AdminTrackingPage() {
  return (
    <Suspense fallback={<MainShell role="admin"><FullLoader /></MainShell>}>
      <AdminTracking />
    </Suspense>
  );
}

function AdminTracking() {
  const params = useSearchParams();
  const selectedTn = params.get("trackingNumber");
  const { token } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["tracking-list", selectedTn],
    queryFn: async () => (await fetch(`/api/tracking`)).json(),
  });

  const selected = data?.shipments?.find((s) => s.trackingNumber === selectedTn);

  return (
    <MainShell role="admin">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Radar className="h-6 w-6" /> Live Tracking</h1>
        <p className="text-muted-foreground">All active shipments and their driver positions.</p>
      </div>

      {isLoading ? (
        <FullLoader />
      ) : !data?.shipments?.length ? (
        <Card><CardContent><EmptyState icon={Radio} title="No active shipments" description="Assign a driver to a shipment and their live position will appear here." /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="rounded-xl overflow-hidden">
                <TrackMap
                  markers={data.shipments.filter((s) => s.live?.lat).map((s) => ({ id: s.trackingNumber, lat: s.live.lat, lng: s.live.lng, title: s.trackingNumber }))}
                  origin={selected?.origin?.lat ? { lat: selected.origin.lat, lng: selected.origin.lng } : null}
                  destination={selected?.destination?.lat ? { lat: selected.destination.lat, lng: selected.destination.lng } : null}
                  showRoute={!!selected}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border px-5 py-3 text-sm font-semibold">Active shipments</div>
              <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {data.shipments.map((s) => <ShipmentRow key={s.trackingNumber} s={s} token={token} active={s.trackingNumber === selectedTn} />)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainShell>
  );
}

function ShipmentRow({ s, token, active }) {
  const { location } = useLiveTracking({ trackingNumber: s.trackingNumber, token, enabled: active });
  const live = location || s.live;
  return (
    <Link href={`/admin/tracking?trackingNumber=${s.trackingNumber}`} className={`block px-5 py-3 hover:bg-muted/60 ${active ? "bg-muted/60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold">{s.trackingNumber}</span>
        <StatusBadge status={s.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{s.driver || "No driver"} · {s.vehicle || "no vehicle"}</p>
      <p className="mt-1 line-clamp-1 text-xs">{s.destination.address}</p>
      <p className="mt-1 text-xs">
        {live?.lat ? <span className="font-mono text-primary">{live.lat.toFixed(4)}, {live.lng.toFixed(4)}</span> : <span className="text-muted-foreground">No live position yet</span>}
      </p>
    </Link>
  );
}