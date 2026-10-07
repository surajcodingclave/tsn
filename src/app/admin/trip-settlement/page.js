"use client";

import { useQuery } from "@tanstack/react-query";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui";

export default function TripSettlementPage() {
  const { data: ships, isLoading: l1 } = useQuery({ queryKey: ["settle-ships"], queryFn: async () => (await fetch("/api/shipments")).json() });
  const { data: exps, isLoading: l2 } = useQuery({ queryKey: ["settle-exps"], queryFn: async () => (await fetch("/api/trip-expenses")).json() });

  const expenseByTrip = {};
  (exps?.items || []).forEach((e) => { const k = e.trackingNumber || "—"; expenseByTrip[k] = (expenseByTrip[k] || 0) + Number(e.amount || 0); });

  const rows = (ships?.shipments || []).map((s) => {
    const expenses = expenseByTrip[s.trackingNumber] || 0;
    return { ...s, expenses, net: Number(s.freightCharge || 0) - expenses };
  });

  return (
    <MainShell role="admin">
      <DataTable
        title="Trip Settlement"
        description="Freight earned vs. expenses for each trip."
        columns={[
          { key: "trackingNumber", header: "Trip / LR" },
          { key: "customerId", header: "Client", render: (r) => r.customerId?.companyName || "—" },
          { key: "freightCharge", header: "Freight (₹)", render: (r) => `₹${r.freightCharge}`, align: "right", accessor: (r) => Number(r.freightCharge) },
          { key: "expenses", header: "Expenses (₹)", render: (r) => `₹${r.expenses}`, align: "right", accessor: (r) => r.expenses },
          { key: "net", header: "Net (₹)", render: (r) => <span className={r.net >= 0 ? "text-emerald-600" : "text-red-600"}>₹{r.net}</span>, align: "right", accessor: (r) => r.net },
          { key: "status", header: "Payment", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
        data={rows}
        loading={l1 || l2}
        searchPlaceholder="Search trips…"
        emptyTitle="No trips to settle"
        emptyDescription="Trip settlements appear once shipments exist."
      />
    </MainShell>
  );
}