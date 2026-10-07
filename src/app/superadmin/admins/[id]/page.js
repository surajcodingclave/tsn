"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, FullLoader, StatusBadge, Badge, Textarea } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { CredentialsModal } from "@/components/CredentialsModal";
import { KeyRound } from "lucide-react";

export default function AdminDetail() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [creds, setCreds] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", id],
    queryFn: async () => (await fetch(`/api/superadmin/admins/${id}`)).json(),
  });

  const update = useMutation({
    mutationFn: async (body) =>
      fetch(`/api/superadmin/admins/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", id] }),
  });

  const reset = useMutation({
    mutationFn: async () =>
      fetch(`/api/superadmin/admins/${id}?action=reset-password`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (data) => setCreds({ userId: data.credentials?.userId, password: data.credentials?.password, name: "Password reset", role: "Admin / business owner" }),
  });

  const [form, setForm] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading || !data?.admin) return <MainShell role="superadmin"><FullLoader /></MainShell>;
  const a = data.admin;
  // hydrate form once
  const safe = form ?? (() => { const init = { businessName: a.businessName, email: a.email, phone: a.phone, contactPerson: a.contactPerson, address: a.address, city: a.city, state: a.state, country: a.country, gstin: a.gstin, logoUrl: a.logoUrl, status: a.status }; return form === null ? init : form; })();

  return (
    <MainShell role="superadmin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{a.businessName}</h1>
          <p className="text-muted-foreground font-mono text-xs">{a.adminUserId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => update.mutate({ status: a.status === "active" ? "blocked" : "active" })}>
            {a.status === "active" ? "Block" : "Unblock"}
          </Button>
          <Button variant="outline" loading={reset.isPending} onClick={() => reset.mutate()}>
            <KeyRound className="h-4 w-4" /> Reset password
          </Button>
          <Button variant="danger" onClick={() => { if (confirm("Delete this business?")) fetch(`/api/superadmin/admins/${id}`, { method: "DELETE" }).then(() => router.push("/superadmin/admins")); }}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-4"><StatusBadge status={a.status} /></div>

      <form className="max-w-3xl space-y-6" onSubmit={(e) => { e.preventDefault(); update.mutate(safe); }}>
        <Card>
          <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              <ImageUpload value={safe.logoUrl} onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))} label="Change logo" />
              <div className="flex-1 space-y-4">
                <div>
                  <Label>Business name</Label>
                  <Input value={safe.businessName} onChange={set("businessName")} />
                </div>
                <div>
                  <Label>Contact person</Label>
                  <Input value={safe.contactPerson} onChange={set("contactPerson")} />
                </div>
                <div>
                  <Label>User ID (login)</Label>
                  <Input value={a.adminUserId} disabled className="font-mono" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Email</Label><Input value={safe.email} onChange={set("email")} /></div>
            <div><Label>Phone</Label><Input value={safe.phone} onChange={set("phone")} /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Textarea value={safe.address} onChange={set("address")} /></div>
            <div><Label>City</Label><Input value={safe.city} onChange={set("city")} /></div>
            <div><Label>State</Label><Input value={safe.state} onChange={set("state")} /></div>
            <div><Label>Country</Label><Input value={safe.country} onChange={set("country")} /></div>
            <div><Label>GSTIN</Label><Input value={safe.gstin} onChange={set("gstin")} /></div>
          </CardContent>
        </Card>

        <Button type="submit" loading={update.isPending}>Save changes</Button>
      </form>

      <CredentialsModal open={!!creds} onClose={() => setCreds(null)} {...(creds || {})} />
    </MainShell>
  );
}