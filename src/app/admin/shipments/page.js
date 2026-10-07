"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { Button, FullLoader, StatusBadge } from "@/components/ui";

const STATUS = ["pending", "assigned", "picked", "in-transit", "out-for-delivery", "delivered", "cancelled"];

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<MainShell role="admin"><FullLoader /></MainShell>}>
      <ShipmentsInner />
    </Suspense>
  );
}

function ShipmentsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") || "";
  const assign = params.get("assign") || "";
  const pay = params.get("pay") || "";

  const setParam = (key, value) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push(`/admin/shipments?${next.toString()}`);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["shipments", status, assign, pay],
    queryFn: async () => (await fetch(`/api/shipments?status=${status}&assign=${assign}&pay=${pay}`)).json(),
  });

  return (
    <MainShell role="admin">
      <DataTable
        title={`Shipments${status ? ` — ${status}` : ""}`}
        description="All bookings across your business."
        toolbar={<Link href="/admin/shipments/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /> New shipment</Link>}
        filters={[
          { key: "status", value: status, onChange: (v) => setParam("status", v), options: [{ value: "", label: "All statuses" }, ...STATUS.map((s) => ({ value: s, label: s }))] },
          { key: "assign", value: assign, onChange: (v) => setParam("assign", v), options: [{ value: "", label: "Any assignment" }, { value: "unassigned", label: "Unassigned" }, { value: "assigned", label: "Assigned" }] },
          { key: "pay", value: pay, onChange: (v) => setParam("pay", v), options: [{ value: "", label: "Any payment" }, { value: "unpaid", label: "Unpaid" }, { value: "paid", label: "Paid" }] },
        ]}
        columns={[
          { key: "trackingNumber", header: "Tracking", render: (r) => <Link href={`/admin/shipments/${r.trackingNumber}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.trackingNumber}</Link> },
          { key: "customerId", header: "Client", render: (r) => r.customerId?.companyName || "—" },
          { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin.address} → {r.destination.address}</span> },
          { key: "driverId", header: "Driver", render: (r) => r.driverId?.name || "—" },
          { key: "vehicleId", header: "Vehicle", render: (r) => r.vehicleId?.vehicleNumber || "—" },
          { key: "freightCharge", header: "Freight", align: "right", render: (r) => `₹${r.freightCharge}`, accessor: (r) => Number(r.freightCharge) },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "paymentStatus", header: "Payment", render: (r) => <StatusBadge status={r.paymentStatus} /> },
        ]}
        data={data?.shipments || []}
        loading={isLoading}
        searchPlaceholder="Search shipments…"
        emptyTitle="No shipments"
        emptyDescription="Create a shipment to get started."
        onRowClick={(r) => router.push(`/admin/shipments/${r.trackingNumber}`)}
      />
    </MainShell>
  );
}