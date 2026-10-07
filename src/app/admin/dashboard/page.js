"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  PackageSearch, CheckCircle2, Truck, Clock, IndianRupee, Users, UserCog, FileCheck2,
  XCircle, Wallet, TrendingUp, Inbox, LifeBuoy, Boxes, AlertCircle, ArrowUpRight,
} from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, CardHeader, CardTitle, FullLoader, StatusBadge, Th, Td } from "@/components/ui";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: async () => (await fetch("/api/admin/dashboard")).json(),
  });

  if (isLoading || !data) return <MainShell role="admin"><FullLoader label="Loading dashboard…" /></MainShell>;
  const s = data.stats;
  const trend = data.trend || [];
  const maxTrend = Math.max(1, ...trend.map((t) => Math.max(t.revenue, t.expense)));

  const primary = [
    { label: "Total Shipments", value: s.totalShip, icon: PackageSearch, href: "/admin/shipments", tone: "bg-blue-50 text-blue-600" },
    { label: "In Transit", value: s.inTransit, icon: Truck, href: "/admin/active-trips", tone: "bg-indigo-50 text-indigo-600" },
    { label: "Delivered", value: s.delivered, icon: CheckCircle2, href: "/admin/shipments?status=delivered", tone: "bg-emerald-50 text-emerald-600" },
    { label: "Pending", value: s.pending, icon: Clock, href: "/admin/shipments?status=pending", tone: "bg-amber-50 text-amber-600" },
    { label: "Cancelled", value: s.cancelled, icon: XCircle, href: "/admin/shipments?status=cancelled", tone: "bg-red-50 text-red-600" },
    { label: "Unassigned", value: s.unassigned, icon: AlertCircle, href: "/admin/shipments?assign=unassigned", tone: "bg-orange-50 text-orange-600" },
  ];

  const money = [
    { label: "Revenue (paid)", value: `₹${Number(s.revenue).toLocaleString()}`, icon: IndianRupee, tone: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Receivables (unpaid)", value: `₹${Number(s.receivables).toLocaleString()}`, icon: Wallet, tone: "text-amber-600", bg: "bg-amber-50" },
    { label: "Trip expenses", value: `₹${Number(s.expenses).toLocaleString()}`, icon: TrendingUp, tone: "text-red-600", bg: "bg-red-50" },
    { label: "Net profit", value: `₹${Number(s.profit).toLocaleString()}`, icon: TrendingUp, tone: s.profit >= 0 ? "text-emerald-600" : "text-red-600", bg: "bg-primary/5" },
  ];

  const ops = [
    { label: "Drivers", value: `${s.drivers}`, sub: `${s.driversBusy} on trip`, icon: UserCog, href: "/admin/drivers" },
    { label: "Customers", value: `${s.customers}`, icon: Users, href: "/admin/customers" },
    { label: "Vehicles", value: `${s.vehicles}`, icon: Truck, href: "/admin/fleet" },
    { label: "Vendors", value: `${s.vendors}`, icon: Boxes, href: "/admin/vendors" },
    { label: "PODs today", value: `${s.podsToday}`, icon: FileCheck2, href: "/admin/pod" },
    { label: "Open enquiries", value: `${s.openEnquiries}`, icon: Inbox, href: "/admin/enquiries" },
    { label: "Open tickets", value: `${s.openTickets}`, icon: LifeBuoy, href: "/admin/support" },
    { label: "Unpaid invoices", value: `${s.unpaidCount}`, icon: Wallet, href: "/admin/billing?pay=unpaid" },
  ];

  return (
    <MainShell role="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Complete business overview — shipments, fleet, finance & operations.</p>
        </div>
        <Link href="/admin/shipments/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          + New shipment
        </Link>
      </div>

      {/* Primary shipment KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {primary.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Financial KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {money.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className={`text-xl font-bold ${c.tone}`}>{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Operations grid */}
        <Card>
          <CardHeader><CardTitle>Operations</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {ops.map((o) => (
              <Link key={o.label} href={o.href} className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/60">
                <div className="flex items-center gap-2 text-muted-foreground"><o.icon className="h-4 w-4" /><span className="text-xs">{o.label}</span></div>
                <p className="mt-1 text-lg font-bold">{o.value}</p>
                {o.sub && <p className="text-[11px] text-muted-foreground">{o.sub}</p>}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Revenue vs expense trend */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue vs Expenses (6 months)</CardTitle></CardHeader>
          <CardContent>
            {trend.length ? (
              <div className="flex h-48 items-end gap-3">
                {trend.map((t) => (
                  <div key={t.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end justify-center gap-1">
                      <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${Math.max(3, (t.revenue / maxTrend) * 150)}px` }} title={`Revenue ₹${t.revenue}`} />
                      <div className="w-1/2 rounded-t bg-red-400" style={{ height: `${Math.max(3, (t.expense / maxTrend) * 150)}px` }} title={`Expense ₹${t.expense}`} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t.month.slice(2)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No data yet.</p>}
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-400" /> Expenses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent shipments */}
      <Card className="mt-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent shipments</CardTitle>
          <Link href="/admin/shipments" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </CardHeader>
        <CardContent>
          {data.recent?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr><Th>Tracking</Th><Th>Customer</Th><Th>Route</Th><Th>Driver</Th><Th>Status</Th><Th>Payment</Th><Th className="text-right">Charge</Th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recent.map((r) => (
                    <tr key={r.trackingNumber}>
                      <Td><Link href={`/admin/shipments/${r.trackingNumber}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.trackingNumber}</Link></Td>
                      <Td>{r.customerId?.companyName || "—"}</Td>
                      <Td className="max-w-[180px] truncate text-xs">{r.origin.address} → {r.destination.address}</Td>
                      <Td>{r.driverId?.name || "—"}</Td>
                      <Td><StatusBadge status={r.status} /></Td>
                      <Td><StatusBadge status={r.paymentStatus} /></Td>
                      <Td className="text-right">₹{r.freightCharge}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No shipments yet. <Link href="/admin/shipments/new" className="text-primary hover:underline">Create one →</Link></p>
          )}
        </CardContent>
      </Card>
    </MainShell>
  );
}