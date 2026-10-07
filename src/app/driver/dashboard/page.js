"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Truck, CheckCircle2 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, CardHeader, CardTitle, FullLoader, StatusBadge, Th, Td } from "@/components/ui";

export default function DriverDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-trips"],
    queryFn: async () => (await fetch("/api/tracking")).json(),
  });

  const trips = data?.shipments || [];
  const active = trips.filter((s) => !["delivered", "cancelled"].includes(s.status));

  return (
    <MainShell role="driver">
      <div className="mb-6"><h1 className="text-2xl font-bold">My Dashboard</h1><p className="text-muted-foreground">Your assigned trips and delivery tasks.</p></div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><PackageSearch className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{trips.length}</p><p className="text-xs text-muted-foreground">Total trips</p></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><Truck className="h-5 w-5 text-blue-600" /><div><p className="text-2xl font-bold">{active.length}</p><p className="text-xs text-muted-foreground">Active trips</p></div></div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-2xl font-bold">{trips.length - active.length}</p><p className="text-xs text-muted-foreground">Completed</p></div></div></CardContent></Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Current trips</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <FullLoader /> : !active.length ? (
            <p className="text-sm text-muted-foreground">No active trips right now. You'll see new assignments here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border"><tr><Th>Tracking</Th><Th>Destination</Th><Th>Client</Th><Th>Status</Th><Th className="text-right">Action</Th></tr></thead>
                <tbody className="divide-y divide-border">
                  {active.map((s) => (
                    <tr key={s.trackingNumber}>
                      <Td><span className="font-mono text-xs font-medium">{s.trackingNumber}</span></Td>
                      <Td className="max-w-[200px] truncate text-xs">{s.destination.address}</Td>
                      <Td>{s.customer}</Td>
                      <Td><StatusBadge status={s.status} /></Td>
                      <Td><Link href={`/driver/shipments/${s.trackingNumber}`} className="text-sm font-medium text-primary hover:underline">Open →</Link></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainShell>
  );
}