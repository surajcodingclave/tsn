"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReceiptText, CheckCircle2 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { Button, Card, CardContent, FullLoader, StatusBadge } from "@/components/ui";

export default function BillingPage() {
  return (
    <Suspense fallback={<MainShell role="admin"><FullLoader /></MainShell>}>
      <BillingInner />
    </Suspense>
  );
}

function BillingInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const pay = params.get("pay") || "";

  const setPay = (v) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set("pay", v); else next.delete("pay");
    router.push(`/admin/billing?${next.toString()}`);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["shipments-billing", pay],
    queryFn: async () => (await fetch(`/api/shipments?pay=${pay}`)).json(),
  });

  const mark = useMutation({
    mutationFn: async ({ tn, status }) => {
      const res = await fetch(`/api/shipments/${tn}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: status }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shipments-billing"] }); qc.invalidateQueries({ queryKey: ["admin-dash"] }); },
    onError: (e) => alert(e.message),
  });

  const total = data?.shipments?.reduce((sum, s) => sum + Number(s.freightCharge || 0), 0) || 0;

  return (
    <MainShell role="admin">
      {!isLoading && data && (
        <Card className="mb-4"><CardContent className="flex items-center gap-3 p-4">
          <ReceiptText className="h-5 w-5 text-primary" />
          <div><p className="text-lg font-bold">₹{total.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total in this view ({data.shipments.length} shipments)</p></div>
        </CardContent></Card>
      )}

      <DataTable
        title="Customer Billing"
        description="Track payments offline — no online gateway."
        filters={[{ key: "pay", value: pay, onChange: setPay, options: [{ value: "", label: "All payments" }, { value: "unpaid", label: "Unpaid only" }, { value: "paid", label: "Paid only" }] }]}
        columns={[
          { key: "trackingNumber", header: "Tracking" },
          { key: "customerId", header: "Client", render: (r) => r.customerId?.companyName || "—" },
          { key: "destination", header: "Destination", render: (r) => <span className="text-xs">{r.destination?.address}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "freightCharge", header: "Charge", align: "right", render: (r) => `₹${r.freightCharge}`, accessor: (r) => Number(r.freightCharge) },
          { key: "paymentStatus", header: "Payment", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
        data={data?.shipments || []}
        loading={isLoading}
        searchPlaceholder="Search billing…"
        emptyTitle="No shipments"
        emptyDescription="No shipments match this payment filter."
        rowActions={(row) => (
          row.paymentStatus === "unpaid"
            ? <Button size="sm" variant="success" loading={mark.isPending} onClick={() => mark.mutate({ tn: row.trackingNumber, status: "paid" })}><CheckCircle2 className="h-3.5 w-3.5" /> Mark paid</Button>
            : <Button size="sm" variant="outline" onClick={() => mark.mutate({ tn: row.trackingNumber, status: "unpaid" })}>Mark unpaid</Button>
        )}
      />
    </MainShell>
  );
}