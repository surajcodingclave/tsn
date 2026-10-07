"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, UserCog, Truck, PackageSearch, ShieldCheck } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, CardHeader, CardTitle, FullLoader, StatusBadge } from "@/components/ui";

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["sa-stats"],
    queryFn: async () => (await fetch("/api/superadmin/stats")).json(),
  });

  const cards = data
    ? [
        { label: "Businesses", value: data.stats.tenants, sub: `${data.stats.activeTenants} active`, icon: Building2 },
        { label: "Drivers", value: data.stats.drivers, icon: UserCog },
        { label: "Customers", value: data.stats.customers, icon: Users },
        { label: "Vehicles", value: data.stats.vehicles, icon: Truck },
        { label: "Shipments", value: data.stats.shipments, icon: PackageSearch },
      ]
    : [];

  return (
    <MainShell role="superadmin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground">Global statistics across every business on the platform.</p>
        </div>
        <Link href="/superadmin/admins/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add business
        </Link>
      </div>

      {isLoading || !data ? (
        <FullLoader label="Loading platform stats…" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {c.sub && <p className="text-[11px] text-muted-foreground">{c.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Shipments by status</CardTitle>
            </CardHeader>
            <CardContent>
              {data.statusBreakdown && Object.keys(data.statusBreakdown).length ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.statusBreakdown).map(([status, n]) => (
                    <span key={status} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                      <StatusBadge status={status} /> {n}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No shipments yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </MainShell>
  );
}