"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";

export default function NewShipment() {
  const router = useRouter();
  const [form, setForm] = useState({ customerId: "", driverId: "", vehicleId: "", originAddress: "", destinationAddress: "", items: [{ name: "", qty: 1, weight: 0 }], dimensions: "", weight: 0, freightCharge: 0, paymentMode: "offline", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: clients } = useQuery({ queryKey: ["clients-opt"], queryFn: async () => (await fetch("/api/clients")).json() });
  const { data: drivers } = useQuery({ queryKey: ["drivers-opt"], queryFn: async () => (await fetch("/api/drivers")).json() });
  const { data: vehicles } = useQuery({ queryKey: ["vehicles-free"], queryFn: async () => (await fetch("/api/vehicles")).json() });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          driverId: form.driverId || null,
          vehicleId: form.vehicleId || null,
          origin: { address: form.originAddress },
          destination: { address: form.destinationAddress },
          items: form.items.filter((i) => i.name),
          dimensions: form.dimensions,
          weight: Number(form.weight) || 0,
          freightCharge: Number(form.freightCharge) || 0,
          paymentMode: form.paymentMode,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create.");
      router.push(`/admin/shipments/${data.shipment.trackingNumber}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainShell role="admin">
      <h1 className="mb-6 text-2xl font-bold">New shipment</h1>
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Parties & assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><Label>Client *</Label><Select value={form.customerId} onChange={set("customerId")} required><option value="">Select client…</option>{clients?.clients?.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</Select></div>
              <div><Label>Driver</Label><Select value={form.driverId} onChange={set("driverId")}><option value="">Assign later</option>{drivers?.drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
              <div><Label>Vehicle</Label><Select value={form.vehicleId} onChange={set("vehicleId")}><option value="">Assign later</option>{vehicles?.vehicles?.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}</Select></div>
            </div>
            <div>
              <Label>Origin address *</Label>
              <Input value={form.originAddress} onChange={set("originAddress")} required placeholder="Warehouse / pickup location" />
            </div>
            <div>
              <Label>Destination address *</Label>
              <Input value={form.destinationAddress} onChange={set("destinationAddress")} required placeholder="Delivery address" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between"><CardTitle>Items & cargo</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { name: "", qty: 1, weight: 0 }] }))}><Plus className="h-4 w-4" /> Add item</Button></CardHeader>
          <CardContent className="space-y-3">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_90px_32px] gap-3">
                <Input placeholder="Item name" value={item.name} onChange={(e) => setItem(i, "name", e.target.value)} />
                <Input type="number" min="0" placeholder="Qty" value={item.qty} onChange={(e) => setItem(i, "qty", e.target.value)} />
                <Input type="number" min="0" placeholder="Wt (kg)" value={item.weight} onChange={(e) => setItem(i, "weight", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div><Label>Dimensions</Label><Input value={form.dimensions} onChange={set("dimensions")} placeholder="e.g. 120x80x60 cm" /></div>
              <div><Label>Total weight (kg)</Label><Input type="number" min="0" value={form.weight} onChange={set("weight")} /></div>
              <div><Label>Freight charge (₹)</Label><Input type="number" min="0" value={form.freightCharge} onChange={set("freightCharge")} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={set("notes")} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
          <CardContent>
            <Label>Payment mode (offline)</Label>
            <Select value={form.paymentMode} onChange={set("paymentMode")}><option value="offline">Offline</option><option value="cash">Cash on delivery</option><option value="credit">Credit</option></Select>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={saving}>Create shipment</Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/admin/shipments")}>Cancel</Button>
        </div>
      </form>
    </MainShell>
  );
}