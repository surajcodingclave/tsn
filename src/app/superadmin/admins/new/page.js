"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { CredentialsModal } from "@/components/CredentialsModal";

const empty = { businessName: "", email: "", phone: "", contactPerson: "", address: "", city: "", state: "", country: "", gstin: "", logoUrl: "" };

export default function NewAdmin() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create.");
      setCreds({ ...data.credentials, name: data.admin.businessName, role: "Admin / business owner" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainShell role="superadmin">
      <h1 className="mb-6 text-2xl font-bold">Add a business (admin)</h1>

      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Business & logo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              <ImageUpload value={form.logoUrl} onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))} label="Add logo" />
              <div className="flex-1 space-y-4">
                <div>
                  <Label>Business name *</Label>
                  <Input value={form.businessName} onChange={set("businessName")} required placeholder="e.g. Delhi Cargo Movers" />
                </div>
                <div>
                  <Label>Contact person</Label>
                  <Input value={form.contactPerson} onChange={set("contactPerson")} placeholder="Owner name" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={set("email")} required placeholder="admin@company.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={set("address")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={set("city")} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={set("state")} />
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={set("country")} />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={set("gstin")} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={saving}>Create business</Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/superadmin/admins")}>Cancel</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          On creation, a unique <span className="font-medium">User ID</span> and <span className="font-medium">password</span> are generated so the admin can log in. The logo becomes their tenant branding.
        </p>
      </form>

      <CredentialsModal open={!!creds} onClose={() => { setCreds(null); router.push("/superadmin/admins"); }} {...(creds || {})} />
    </MainShell>
  );
}