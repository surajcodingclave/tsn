"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, MapPin } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, FullLoader, EmptyState, StatusBadge, Th, Td } from "@/components/ui";

export default function CustomerShipments() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-shipments-list"],
    queryFn: async () => (await fetch("/api/customer/shipments")).json(),
  });
  const trips = data?.shipments || [];

  return (
    <MainShell role="customer">
      <div className="mb-6"><h1 className="text-2xl font-bold">My shipments</h1><p className="text-muted-foreground">All consignments booked for you.</p></div>

      <Card>
        {isLoading ? <FullLoader /> : !trips.length ? (
          <CardContent><EmptyState icon={PackageSearch} title="No shipments" description="Once your transporter books a shipment for you, it shows up here." /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border"><tr><Th>Tracking</Th><Th>Route</Th><Th>Items</Th><Th>Status</Th><Th>Payment</Th><Th className="text-right">Track</Th></tr></thead>
              <tbody className="divide-y divide-border">
                {trips.map((s) => (
                  <tr key={s.trackingNumber}>
                    <Td><span className="font-mono text-xs font-medium">{s.trackingNumber}</span></Td>
                    <Td className="max-w-[240px]"><p className="truncate text-xs">{s.origin.address}</p><p className="truncate text-xs text-muted-foreground">→ {s.destination.address}</p></Td>
                    <Td className="text-xs">{s.items?.length || 0} items</Td>
                    <Td><StatusBadge status={s.status} /></Td>
                    <Td><StatusBadge status={s.paymentStatus} /></Td>
                    <Td><Link href={`/customer/track/${s.trackingNumber}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><MapPin className="h-3.5 w-3.5" /> Track</Link></Td>
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