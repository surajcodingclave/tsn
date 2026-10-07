"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { Button, Modal } from "@/components/ui";

export default function PodPage() {
  const [pod, setPod] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["pod-list"],
    queryFn: async () => (await fetch("/api/pod")).json(),
  });

  return (
    <MainShell role="admin">
      <DataTable
        title="POD / Deliveries"
        description="Signatures and photos captured at delivery."
        columns={[
          { key: "shipmentId", header: "Shipment", render: (r) => <span className="font-mono text-xs font-medium">{r.shipmentId?.trackingNumber || "—"}</span> },
          { key: "receiverName", header: "Receiver" },
          { key: "deliveredBy", header: "Delivered by", render: (r) => r.deliveredBy?.name || "—" },
          { key: "deliveredAt", header: "Delivered at", render: (r) => (r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : "—") },
          { key: "hasSignature", header: "Signature", render: (r) => (r.signatureDataUrl ? "Yes" : "—") },
        ]}
        data={data?.pods || []}
        loading={isLoading}
        searchPlaceholder="Search deliveries…"
        emptyTitle="No deliveries yet"
        emptyDescription="PODs appear here once drivers record them."
        rowActions={(row) => <Button variant="outline" size="sm" onClick={() => setPod(row)}><Eye className="h-3.5 w-3.5" /> View</Button>}
      />

      <Modal open={!!pod} onClose={() => setPod(null)} title="Proof of Delivery">
        {pod && (
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Tracking</span><span className="font-mono text-sm">{pod.shipmentId?.trackingNumber}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Receiver</span><span className="font-medium">{pod.receiverName}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Delivered at</span><span>{new Date(pod.deliveredAt).toLocaleString()}</span></div>
            {pod.signatureDataUrl && <div><p className="mb-1 text-xs text-muted-foreground">Signature</p>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={pod.signatureDataUrl} alt="signature" className="w-full rounded-lg border border-border bg-white" /></div>}
            {pod.photoUrl && <div><p className="mb-1 text-xs text-muted-foreground">Delivery photo</p>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={pod.photoUrl} alt="delivery" className="w-full rounded-lg border border-border" /></div>}
            {pod.notes && <p className="text-sm text-muted-foreground">{pod.notes}</p>}
          </div>
        )}
      </Modal>
    </MainShell>
  );
}