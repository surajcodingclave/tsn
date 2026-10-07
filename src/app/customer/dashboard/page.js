"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Truck, CheckCircle2, MapPin } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, CardHeader, CardTitle, FullLoader, StatusBadge, Th, Td } from "@/components/ui";

export default function CustomerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-shipments"],
    queryFn: async () => (await fetch("/api/customer/shipments")).json(),
  });

  const trips = data?.shipments || [];
  const active = trips.filter((s) => !["delivered", "cancelled", "pending"].includes(s.status));

  return (
    <MainShell role="customer">
      <div className="mb-6"><h1 className="text-2xl font-bold">My shipments</h1><p className="text-muted-foreground">Track all consignments from {data?.tenantName || "your transporter"}.</p></div>

      {isLoading ? <FullLoader /> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><PackageSearch className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{trips.length}</p><p className="text-xs text-muted-foreground">Total shipments</p></div></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><Truck className="h-5 w-5 text-blue-600" /><div><p className="text-2xl font-bold">{active.length}</p><p className="text-xs text-muted-foreground">In transit</p></div></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-2xl font-bold">{trips.filter((s) => s.status === "delivered").length}</p><p className="text-xs text-muted-foreground">Delivered</p></div></div></CardContent></Card>
          </div>

          <Card className="mt-6">
            <CardHeader><CardTitle>Recent shipments</CardTitle></CardHeader>
            <CardContent>
              {!trips.length ? (
                <p className="text-sm text-muted-foreground">No shipments yet. Your transporter will add consignments for you here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border"><tr><Th>Tracking</Th><Th>Route</Th><Th>Status</Th><Th className="text-right">Track</Th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {trips.slice(0, 6).map((s) => (
                        <tr key={s.trackingNumber}>
                          <Td><span className="font-mono text-xs font-medium">{s.trackingNumber}</span></Td>
                          <Td className="max-w-[220px] truncate text-xs">{s.origin.address} → {s.destination.address}</Td>
                          <Td><StatusBadge status={s.status} /></Td>
                          <Td><Link href={`/customer/track/${s.trackingNumber}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><MapPin className="h-3.5 w-3.5" /> Track live</Link></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </MainShell>
  );
}