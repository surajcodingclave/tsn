"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileCheck2 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardContent, FullLoader, EmptyState, Modal, Th, Td } from "@/components/ui";

export default function CustomerPod() {
  const [pod, setPod] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["my-pod"],
    queryFn: async () => (await fetch("/api/pod")).json(),
  });

  return (
    <MainShell role="customer">
      <div className="mb-6"><h1 className="text-2xl font-bold">Proof of Delivery</h1><p className="text-muted-foreground">Signatures & photos from your delivered shipments.</p></div>

      <Card>
        {isLoading ? <FullLoader /> : !data?.pods?.length ? (
          <CardContent><EmptyState icon={FileCheck2} title="No deliveries yet" description="Proof of delivery appears once your shipments are delivered." /></CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border"><tr><Th>Tracking</Th><Th>Receiver</Th><Th>Delivered at</Th><Th className="text-right">View</Th></tr></thead>
              <tbody className="divide-y divide-border">
                {data.pods.map((p) => (
                  <tr key={p._id}>
                    <Td><span className="font-mono text-xs font-medium">{p.shipmentId?.trackingNumber}</span></Td>
                    <Td>{p.receiverName}</Td>
                    <Td>{new Date(p.deliveredAt).toLocaleString()}</Td>
                    <Td><button onClick={() => setPod(p)} className="text-sm font-medium text-primary hover:underline">View →</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!pod} onClose={() => setPod(null)} title="Proof of Delivery">
        {pod && (
          <div className="space-y-3">
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