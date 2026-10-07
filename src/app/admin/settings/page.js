"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, KeyRound } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, FullLoader } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { useSession } from "@/components/SessionProvider";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { refresh } = useSession();
  const [form, setForm] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await fetch("/api/settings")).json(),
  });

  useEffect(() => {
    if (data?.admin && form === null) {
      const { businessName, logoUrl, email, phone, contactPerson, address, city, state, country, gstin } = data.admin;
      setForm({ businessName, logoUrl, email, phone, contactPerson, address, city, state, country, gstin });
    }
  }, [data, form]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); refresh(); alert("Saved"); },
    onError: (e) => alert(e.message),
  });

  const changePw = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings?action=change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pw) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: () => { setPw({ current: "", next: "" }); setPwMsg("Password changed successfully."); },
    onError: (e) => setPwMsg(e.message),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading || !form) return <MainShell role="admin"><FullLoader /></MainShell>;

  return (
    <MainShell role="admin">
      <div className="mb-6"><h1 className="flex items-center gap-2 text-2xl font-bold"><Settings className="h-6 w-6" /> Settings</h1><p className="text-muted-foreground">Your business branding & account. This logo appears on every sign-in for your team.</p></div>

      <form className="max-w-3xl space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <Card>
          <CardHeader><CardTitle>Business & branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              <ImageUpload value={form.logoUrl} onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))} aspect="aspect-square" label="Upload logo" />
              <div className="flex-1 space-y-4">
                <div><Label>Business name</Label><Input value={form.businessName} onChange={set("businessName")} /></div>
                <div><Label>Contact person</Label><Input value={form.contactPerson} onChange={set("contactPerson")} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email} onChange={set("email")} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
            </div>
            <div><Label>Address</Label><Textarea value={form.address} onChange={set("address")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={set("city")} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={set("state")} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={set("country")} /></div>
            </div>
            <div><Label>GSTIN</Label><Input value={form.gstin} onChange={set("gstin")} /></div>
          </CardContent>
        </Card>
        <Button type="submit" loading={save.isPending}>Save changes</Button>
      </form>

      <Card className="mt-6 max-w-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change admin password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Current password</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <Button loading={changePw.isPending} onClick={() => changePw.mutate()}>Update password</Button>
          {pwMsg && <p className="text-sm text-emerald-600">{pwMsg}</p>}
        </CardContent>
      </Card>
    </MainShell>
  );
}