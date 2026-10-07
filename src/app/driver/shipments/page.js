"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, FullLoader, EmptyState, StatusBadge, Th, Td } from "@/components/ui";

export default function DriverTrips() {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-trips-all"],
    queryFn: async () => (await fetch("/api/driver/trips")).json(),
  });

  const trips = data?.shipments || [];

  return (
    <MainShell role="driver">
      <div className="mb-6"><h1 className="text-2xl font-bold">My trips</h1><p className="text-muted-foreground">Shipments assigned to you.</p></div>

      <Card>
        {isLoading ? <FullLoader /> : !trips.length ? (
          <CardContent><EmptyState icon={PackageSearch} title="No trips assigned" description="When your admin assigns a shipment to you, it appears here." /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border"><tr><Th>Tracking</Th><Th>Client</Th><Th>Destination</Th><Th>Vehicle</Th><Th>Status</Th><Th className="text-right">Action</Th></tr></thead>
              <tbody className="divide-y divide-border">
                {trips.map((s) => (
                  <tr key={s.trackingNumber}>
                    <Td><span className="font-mono text-xs font-medium">{s.trackingNumber}</span></Td>
                    <Td>{s.customerId?.companyName}</Td>
                    <Td className="max-w-[200px] truncate text-xs">{s.destination.address}</Td>
                    <Td>{s.vehicleId?.vehicleNumber || "—"}</Td>
                    <Td><StatusBadge status={s.status} /></Td>
                    <Td><Link href={`/driver/shipments/${s.trackingNumber}`} className="text-sm font-medium text-primary hover:underline">Open →</Link></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </MainShell>
  );
}