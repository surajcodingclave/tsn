"use client";

import { useQuery } from "@tanstack/react-query";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent } from "@/components/ui";

export default function ProfitLossPage() {
  const { data: ships, isLoading: l1 } = useQuery({ queryKey: ["pl-ships"], queryFn: async () => (await fetch("/api/shipments")).json() });
  const { data: exps, isLoading: l2 } = useQuery({ queryKey: ["pl-exps"], queryFn: async () => (await fetch("/api/trip-expenses")).json() });

  const shipments = ships?.shipments || [];
  const expenses = exps?.items || [];

  const revenue = shipments.reduce((s, x) => s + (x.paymentStatus === "paid" ? Number(x.freightCharge || 0) : 0), 0);
  const receivables = shipments.reduce((s, x) => s + (x.paymentStatus !== "paid" ? Number(x.freightCharge || 0) : 0), 0);
  const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const profit = revenue - totalExpenses;

  // monthly grouping
  const byMonth = {};
  shipments.forEach((s) => {
    const m = new Date(s.createdAt).toISOString().slice(0, 7);
    byMonth[m] = byMonth[m] || { month: m, revenue: 0, expense: 0 };
    if (s.paymentStatus === "paid") byMonth[m].revenue += Number(s.freightCharge || 0);
  });
  expenses.forEach((e) => {
    const m = new Date(e.date).toISOString().slice(0, 7);
    byMonth[m] = byMonth[m] || { month: m, revenue: 0, expense: 0 };
    byMonth[m].expense += Number(e.amount || 0);
  });
  const monthly = Object.values(byMonth).map((r) => ({ ...r, profit: r.revenue - r.expense })).sort((a, b) => a.month.localeCompare(b.month));

  const cards = [
    { l: "Revenue (paid)", v: `₹${revenue.toLocaleString()}`, tone: "text-emerald-600" },
    { l: "Receivables (unpaid)", v: `₹${receivables.toLocaleString()}`, tone: "text-amber-600" },
    { l: "Total expenses", v: `₹${totalExpenses.toLocaleString()}`, tone: "text-red-600" },
    { l: "Net profit", v: `₹${profit.toLocaleString()}`, tone: profit >= 0 ? "text-emerald-600" : "text-red-600" },
  ];

  return (
    <MainShell role="admin">
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.l}><CardContent className="p-5"><p className={`text-xl font-bold ${c.tone}`}>{c.v}</p><p className="text-xs text-muted-foreground">{c.l}</p></CardContent></Card>
        ))}
      </div>

      <DataTable
        title="Monthly Profit & Loss"
        description="Revenue collected minus trip expenses per month."
        columns={[
          { key: "month", header: "Month" },
          { key: "revenue", header: "Revenue (₹)", render: (r) => `₹${r.revenue}`, align: "right", accessor: (r) => r.revenue },
          { key: "expense", header: "Expenses (₹)", render: (r) => `₹${r.expense}`, align: "right", accessor: (r) => r.expense },
          { key: "profit", header: "Profit (₹)", render: (r) => <span className={r.profit >= 0 ? "text-emerald-600" : "text-red-600"}>₹{r.profit}</span>, align: "right", accessor: (r) => r.profit },
        ]}
        data={monthly}
        loading={l1 || l2}
        searchPlaceholder="Search month…"
        emptyTitle="No financial data"
        emptyDescription="Payments and expenses will roll up here."
        getRowId={(r) => r.month}
      />
    </MainShell>
  );
}