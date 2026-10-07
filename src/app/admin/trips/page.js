"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui";

export default function TripsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trips-all"],
    queryFn: async () => (await fetch("/api/shipments")).json(),
  });
  const rows = data?.shipments || [];

  return (
    <MainShell role="admin">
      <DataTable
        title="All Trips"
        description="Every trip/shipment across your fleet."
        columns={[
          { key: "trackingNumber", header: "Trip / LR", render: (r) => <Link href={`/admin/shipments/${r.trackingNumber}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.trackingNumber}</Link> },
          { key: "customerId", header: "Client", render: (r) => r.customerId?.companyName || "—" },
          { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin.address} → {r.destination.address}</span> },
          { key: "driverId", header: "Driver", render: (r) => r.driverId?.name || "—" },
          { key: "vehicleId", header: "Vehicle", render: (r) => r.vehicleId?.vehicleNumber || "—" },
          { key: "freightCharge", header: "Freight", render: (r) => `₹${r.freightCharge}`, align: "right" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "paymentStatus", header: "Payment", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Search trips…"
        emptyTitle="No trips yet"
        emptyDescription="Create a shipment to start a trip."
      />
    </MainShell>
  );
}