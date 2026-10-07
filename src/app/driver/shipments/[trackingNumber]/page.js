"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileCheck2, MapPin, Camera } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, FullLoader, StatusBadge, Modal } from "@/components/ui";
import { TrackMap } from "@/components/tracking/TrackMap";
import { ShareLocation } from "@/components/tracking/ShareLocation";
import { SigCanvas } from "@/components/tracking/SigCanvas";
import { ImageUpload } from "@/components/ImageUpload";
import { useSession } from "@/components/SessionProvider";

const STEPS = ["assigned", "picked", "in-transit", "out-for-delivery", "delivered"];

export default function DriverTrip() {
  const { trackingNumber } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { token } = useSession();
  const [podOpen, setPodOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trip", trackingNumber],
    queryFn: async () => (await fetch(`/api/shipments/${trackingNumber}`)).json(),
  });

  const update = useMutation({
    mutationFn: async (status) => {
      const res = await fetch(`/api/shipments/${trackingNumber}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trip", trackingNumber] }),
    onError: (e) => alert(e.message),
  });

  if (isLoading || !data?.shipment) return <MainShell role="driver"><FullLoader /></MainShell>;
  const s = data.shipment;
  const stepIdx = STEPS.indexOf(s.status);
  const live = s.driverId?.currentLocation?.lat ? { lat: s.driverId.currentLocation.lat, lng: s.driverId.currentLocation.lng, updatedAt: s.driverId.currentLocation.updatedAt } : null;

  const nextTransitions = {
    assigned: ["picked"],
    picked: ["in-transit"],
    "in-transit": ["out-for-delivery"],
    "out-for-delivery": ["delivered"],
  };

  return (
    <MainShell role="driver">
      <button onClick={() => router.push("/driver/shipments")} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold">{s.trackingNumber}</h1>
          <div className="mt-1"><StatusBadge status={s.status} /></div>
        </div>
        {["assigned", "picked", "in-transit", "out-for-delivery"].includes(s.status) && (
          <ShareLocation
            postUrl="/api/tracking/update"
            payloadFactory={(p) => ({ trackingNumber, lat: p.lat, lng: p.lng })}
            onStatus={() => {}}
          />
        )}
      </div>

      {/* Progress steps */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {STEPS.map((st, i) => (
              <div key={st} className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${i <= stepIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} capitalize`}>{st}</span>
                {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Route</CardTitle></CardHeader>
            <CardContent>
              <TrackMap
                origin={s.origin?.lat ? { lat: s.origin.lat, lng: s.origin.lng } : null}
                destination={s.destination?.lat ? { lat: s.destination.lat, lng: s.destination.lng } : null}
                live={live}
                showRoute
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Update delivery status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {nextTransitions[s.status]?.map((next) => (
                <div key={next} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium capitalize">{next}</p>
                    <p className="text-xs text-muted-foreground">
                      {next === "picked" ? "Mark the goods as picked up" : next === "in-transit" ? "Start the journey" : next === "out-for-delivery" ? "You're at the delivery area" : "Complete the delivery"}
                    </p>
                  </div>
                  <Button disabled={update.isPending} onClick={() => {
                    if (next === "delivered") setPodOpen(true); else update.mutate(next);
                  }}>
                    {update.isPending ? "Updating…" : `Mark ${next}`}
                  </Button>
                </div>
              ))}
              {!nextTransitions[s.status] && <p className="text-sm text-muted-foreground">No further driver updates available for this shipment.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Delivery info</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Client</span><span>{s.customerId?.companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{s.customerId?.contactPerson || s.customerId?.phone || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{s.vehicleId?.vehicleNumber || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span>{s.weight} kg</span></div>
            <div className="flex justify-between font-medium"><span>Freight</span><span>₹{s.freightCharge}</span></div>
          </CardContent></Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> Proof of Delivery</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">When you deliver, capture the receiver's signature and a photo.</p>
              <Button variant="outline" onClick={() => setPodOpen(true)} disabled={s.status !== "out-for-delivery"}>
                <Camera className="h-4 w-4" /> Record delivery proof
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PodModal
        open={podOpen}
        onClose={() => setPodOpen(false)}
        trackingNumber={trackingNumber}
        onDone={() => {
          setPodOpen(false);
          update.mutate("delivered");
        }}
      />
    </MainShell>
  );
}

function PodModal({ open, onClose, trackingNumber, onDone }) {
  const [form, setForm] = useState({ receiverName: "", signatureDataUrl: "", photoUrl: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.receiverName) { setError("Enter the receiver name."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/pod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackingNumber, ...form }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save");
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Proof of Delivery" footer={<>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="success" loading={saving} onClick={save}>Confirm delivery</Button>
    </>}>
      <div className="space-y-4">
        <div><Label>Receiver name *</Label><Input value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} /></div>
        <div>
          <Label>Signature</Label>
          {form.signatureDataUrl ? (
            <div className="relative rounded-lg border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.signatureDataUrl} alt="signature" className="w-full" />
              <Button size="sm" variant="outline" className="absolute right-2 top-2" onClick={() => setForm((f) => ({ ...f, signatureDataUrl: "" }))}>Redo</Button>
            </div>
          ) : (
            <SigCanvas onChange={(url) => setForm((f) => ({ ...f, signatureDataUrl: url }))} height={140} />
          )}
        </div>
        <div>
          <Label>Delivery photo</Label>
          <ImageUpload value={form.photoUrl} onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))} label="Upload photo" />
        </div>
        <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}