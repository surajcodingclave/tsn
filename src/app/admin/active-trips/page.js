"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui";

export default function ActiveTripsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["active-trips"],
    queryFn: async () => (await fetch("/api/tracking")).json(),
  });
  const rows = data?.shipments || [];

  return (
    <MainShell role="admin">
      <DataTable
        title="Active Trips"
        description="Trips currently on the road."
        columns={[
          { key: "trackingNumber", header: "Tracking", render: (r) => <Link href={`/admin/shipments/${r.trackingNumber}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.trackingNumber}</Link> },
          { key: "driver", header: "Driver", render: (r) => r.driver || "—" },
          { key: "vehicle", header: "Vehicle", render: (r) => r.vehicle || "—" },
          { key: "destination", header: "Destination", render: (r) => <span className="text-xs">{r.destination?.address || "—"}</span> },
          { key: "live", header: "Last position", render: (r) => (r.live?.lat ? <span className="font-mono text-xs text-primary">{r.live.lat.toFixed(3)}, {r.live.lng.toFixed(3)}</span> : <span className="text-xs text-muted-foreground">—</span>) },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Search active trips…"
        emptyTitle="No active trips"
        emptyDescription="Assigned shipments in transit will appear here."
      />
    </MainShell>
  );
}