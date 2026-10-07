"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, FileCheck2, ArrowLeft } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Select, FullLoader, StatusBadge, Modal } from "@/components/ui";
import { TrackMap } from "@/components/tracking/TrackMap";
import { useSession } from "@/components/SessionProvider";

const ALL_STATUS = ["pending", "assigned", "picked", "in-transit", "out-for-delivery", "delivered", "cancelled"];

export default function ShipmentDetail() {
  const { trackingNumber } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { token } = useSession();
  const [pod, setPod] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shipment", trackingNumber],
    queryFn: async () => (await fetch(`/api/shipments/${trackingNumber}`)).json(),
  });
  const { data: drivers } = useQuery({ queryKey: ["drivers-opt"], queryFn: async () => (await fetch("/api/drivers")).json(), enabled: !!data });

  const inv = () => qc.invalidateQueries({ queryKey: ["shipment", trackingNumber] });

  const updateShipment = useMutation({
    mutationFn: async (body) => {
      const res = await fetch(`/api/shipments/${trackingNumber}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      return d;
    },
    onSuccess: function (d) { inv(); if (d.shipment) { setPod((p) => (p ? { ...p, status: d.shipment.status } : p)); } },
    onError: (e) => alert(e.message),
  });

  if (isLoading || !data?.shipment) return <MainShell role="admin"><FullLoader /></MainShell>;
  const s = data.shipment;

  return (
    <MainShell role="admin">
      <button onClick={() => router.push("/admin/shipments")} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold">{s.trackingNumber}</h1>
          <div className="mt-1"><StatusBadge status={s.status} /></div>
        </div>
        <div className="flex gap-2">
          <a href={`/admin/tracking?trackingNumber=${s.trackingNumber}`} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"><MapPin className="h-4 w-4" /> Live track</a>
          <Button variant="danger" onClick={() => { if (confirm("Cancel this shipment?")) updateShipment.mutate({ status: "cancelled" }); }}>Cancel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Route & live position</CardTitle></CardHeader>
            <CardContent>
              <TrackMap
                origin={s.origin?.lat ? { lat: s.origin.lat, lng: s.origin.lng } : null}
                destination={s.destination?.lat ? { lat: s.destination.lat, lng: s.destination.lng } : null}
                live={s.driverId?.currentLocation?.lat ? { lat: s.driverId.currentLocation.lat, lng: s.driverId.currentLocation.lng, updatedAt: s.driverId.currentLocation.updatedAt } : null}
                showRoute
              />
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Origin</p><p>{s.origin.address}</p></div>
                <div><p className="text-xs text-muted-foreground">Destination</p><p>{s.destination.address}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status control</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ALL_STATUS.map((st) => (
                  <Button key={st} size="sm" variant={s.status === st ? "primary" : "outline"} onClick={() => updateShipment.mutate({ status: st })} className="capitalize">{st}</Button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Assign driver</label>
                  <Select value={s.driverId?._id || ""} onChange={(e) => updateShipment.mutate({ driverId: e.target.value || null })}>
                    <option value="">Unassign</option>
                    {drivers?.drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment status</label>
                  <Select value={s.paymentStatus} onChange={(e) => updateShipment.mutate({ paymentStatus: e.target.value })}>
                    <option value="unpaid">Unpaid</option><option value="paid">Paid</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Client</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{s.customerId?.companyName}</p>
              <p className="text-muted-foreground">{s.customerId?.contactPerson}</p>
              <p className="text-muted-foreground">{s.customerId?.phone}</p>
              <p className="text-muted-foreground">Address: {s.customerId?.address || "—"}</p>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Cargo</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            {s.items?.length ? s.items.map((it, i) => <div key={i} className="flex justify-between border-b border-border pb-1 last:border-0"><span>{it.name}</span><span className="text-muted-foreground">{it.qty} × {it.weight}kg</span></div>) : <p className="text-muted-foreground">No items.</p>}
            <div className="flex justify-between pt-1"><span>Dimensions</span><span className="text-muted-foreground">{s.dimensions || "—"}</span></div>
            <div className="flex justify-between"><span>Weight</span><span className="text-muted-foreground">{s.weight} kg</span></div>
            <div className="flex justify-between font-medium"><span>Freight</span><span>₹{s.freightCharge}</span></div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Assignments</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Driver</span><span>{s.driverId?.name || "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Vehicle</span><span>{s.vehicleId?.vehicleNumber || "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Assigned at</span><span>{s.assignedAt ? new Date(s.assignedAt).toLocaleString() : "—"}</span></div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Proof of Delivery</CardTitle></CardHeader><CardContent>
            <Button variant="outline" onClick={() => setPod(true)}><FileCheck2 className="h-4 w-4" /> View POD</Button>
          </CardContent></Card>
        </div>
      </div>

      <Modal open={!!pod} onClose={() => setPod(false)} title="Proof of Delivery">
        <PodView trackingNumber={trackingNumber} token={token} />
      </Modal>
    </MainShell>
  );
}

function PodView({ trackingNumber, token }) {
  const { data } = useQuery({
    queryKey: ["pod", trackingNumber],
    queryFn: async () => {
      const res = await fetch(`/api/pod/shipment/${trackingNumber}`);
      if (res.status === 404) return null;
      return res.json();
    },
  });
  return (
    <div className="space-y-3">
      {data?.pod ? (
        <>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Receiver</span><span className="font-medium">{data.pod.receiverName}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Delivered at</span><span>{new Date(data.pod.deliveredAt).toLocaleString()}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Delivered by</span><span>{data.pod.deliveredBy?.name || "—"}</span></div>
          {data.pod.signatureDataUrl && <div><p className="mb-1 text-xs text-muted-foreground">Signature</p>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={data.pod.signatureDataUrl} alt="signature" className="w-full rounded-lg border border-border bg-white" /></div>}
          {data.pod.photoUrl && <div><p className="mb-1 text-xs text-muted-foreground">Delivery photo</p>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={data.pod.photoUrl} alt="delivery" className="w-full rounded-lg border border-border" /></div>}
          {data.pod.notes && <p className="text-sm text-muted-foreground">{data.pod.notes}</p>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No POD recorded for this shipment yet.</p>
      )}
    </div>
  );
}