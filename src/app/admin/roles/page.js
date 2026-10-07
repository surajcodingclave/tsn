"use client";

import { ShieldCheck, Check, Minus } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

const ROLES = ["Super Admin", "Admin", "Driver", "Customer"];
const PERMISSIONS = [
  { area: "Manage businesses / tenants", superadmin: true, admin: false, driver: false, customer: false },
  { area: "Business branding & settings", superadmin: true, admin: true, driver: false, customer: false },
  { area: "Create clients / customers", superadmin: false, admin: true, driver: false, customer: false },
  { area: "Manage drivers & fleet", superadmin: false, admin: true, driver: false, customer: false },
  { area: "Create shipments / bookings", superadmin: false, admin: true, driver: false, customer: false },
  { area: "Assign driver & vehicle", superadmin: false, admin: true, driver: false, customer: false },
  { area: "Update trip status", superadmin: false, admin: true, driver: true, customer: false },
  { area: "Share live location", superadmin: false, admin: false, driver: true, customer: false },
  { area: "Record Proof of Delivery", superadmin: false, admin: true, driver: true, customer: false },
  { area: "View own shipments", superadmin: false, admin: false, driver: true, customer: true },
  { area: "Live-track shipments", superadmin: false, admin: true, driver: true, customer: true },
  { area: "View invoices / POD", superadmin: false, admin: true, driver: true, customer: true },
  { area: "Billing & payments", superadmin: false, admin: true, driver: false, customer: false },
  { area: "Reports & analytics", superadmin: true, admin: true, driver: false, customer: false },
];

export default function RolesPage() {
  return (
    <MainShell role="admin">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6" /> Roles & Permissions</h1>
        <p className="text-muted-foreground">Access rights for each role on this platform.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Permission matrix</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permission</th>
                  {ROLES.map((r) => <th key={r} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PERMISSIONS.map((p) => (
                  <tr key={p.area}>
                    <td className="px-4 py-3 text-sm">{p.area}</td>
                    {["superadmin", "admin", "driver", "customer"].map((key) => (
                      <td key={key} className="px-4 py-3 text-center">
                        {p[key] ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {ROLES.map((r) => <Badge key={r} tone="blue">{r}</Badge>)}
      </div>
    </MainShell>
  );
}