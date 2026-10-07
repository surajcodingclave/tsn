"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, FullLoader, StatusBadge, Th, Td } from "@/components/ui";

const VIEWS = [
  { key: "", label: "Overview" },
  { key: "daily", label: "Daily" },
  { key: "driver", label: "By Driver" },
  { key: "vehicle", label: "By Vehicle" },
];

export default function ReportsPage() {
  return (
    <Suspense fallback={<MainShell role="admin"><FullLoader /></MainShell>}>
      <ReportsInner />
    </Suspense>
  );
}

function ReportsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") || "";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({});

  const setView = (key) => {
    const next = new URLSearchParams(params.toString());
    if (key) next.set("view", key); else next.delete("view");
    router.push(`/admin/reports?${next.toString()}`);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports", applied, view],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (applied.from) q.set("from", applied.from);
      if (applied.to) q.set("to", applied.to);
      return (await fetch(`/api/reports?${q}`)).json();
    },
  });

  const maxTrend = Math.max(1, ...(data?.trend || []).map((t) => t.count));

  return (
    <MainShell role="admin">
      <div className="mb-6"><h1 className="flex items-center gap-2 text-2xl font-bold"><BarChart3 className="h-6 w-6" /> Reports</h1><p className="text-muted-foreground">Business performance & revenue (offline billing).</p></div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {v.label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
          <Button size="sm" onClick={() => setApplied({ from, to })}>Apply</Button>
        </div>
      </div>

      {isLoading || !data ? (
        <FullLoader />
      ) : (
        <>
          {(view === "" || view === "daily") && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { l: "Total shipments", v: data.stats.total },
                { l: "Delivered", v: data.stats.delivered },
                { l: "In transit", v: data.stats.inTransit },
                { l: "Pending", v: data.stats.pending },
                { l: "Revenue (paid)", v: `₹${data.stats.revenue.toLocaleString()}`, accent: true },
                { l: "Unpaid amount", v: `₹${data.stats.unpaidAmount.toLocaleString()}` },
                { l: "Drivers", v: data.stats.drivers },
                { l: "Vehicles", v: data.stats.vehicles },
              ].map((c) => (
                <Card key={c.l}><CardContent className={`p-5 ${c.accent ? "bg-primary/5" : ""}`}>
                  <p className={`text-xl font-bold ${c.accent ? "text-primary" : ""}`}>{c.v}</p><p className="text-xs text-muted-foreground">{c.l}</p>
                </CardContent></Card>
              ))}
            </div>
          )}

          {view !== "driver" && view !== "vehicle" && (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Shipments by status</CardTitle></CardHeader>
                <CardContent>
                  {Object.keys(data.statusMap).length ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.statusMap).map(([s, n]) => <span key={s} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><StatusBadge status={s} /> {n}</span>)}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No data.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Daily trend</CardTitle></CardHeader>
                <CardContent>
                  {data.trend?.length ? (
                    <div className="flex h-40 items-end gap-1">
                      {data.trend.map((t, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-primary/70" style={{ height: `${Math.max(4, (t.count / maxTrend) * 120)}px` }} title={`${t.count} shipments`} />
                          <span className="text-[9px] text-muted-foreground">{t._id.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No data in range.</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {view === "driver" && (
            <Card>
              <CardHeader><CardTitle>By Driver</CardTitle></CardHeader>
              <CardContent>
                {data.byDriver?.length ? (
                  <table className="w-full">
                    <thead className="border-b border-border"><tr><Th>Driver</Th><Th className="text-right">Shipments</Th><Th className="text-right">Revenue</Th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {data.byDriver.map((r) => (
                        <tr key={String(r.id)}><Td className="capitalize">{r.name}</Td><Td className="text-right">{r.count}</Td><Td className="text-right">₹{r.revenue}</Td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-sm text-muted-foreground">No driver data.</p>}
              </CardContent>
            </Card>
          )}

          {view === "vehicle" && (
            <Card>
              <CardHeader><CardTitle>By Vehicle</CardTitle></CardHeader>
              <CardContent>
                {data.byVehicle?.length ? (
                  <table className="w-full">
                    <thead className="border-b border-border"><tr><Th>Vehicle</Th><Th className="text-right">Shipments</Th><Th className="text-right">Revenue</Th></tr></thead>
                    <tbody className="divide-y divide-border">
                      {data.byVehicle.map((r) => (
                        <tr key={String(r.id)}><Td className="font-mono">{r.number}</Td><Td className="text-right">{r.count}</Td><Td className="text-right">₹{r.revenue}</Td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-sm text-muted-foreground">No vehicle data.</p>}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </MainShell>
  );
}