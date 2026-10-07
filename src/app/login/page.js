"use client";

import Link from "next/link";
import { ShieldCheck, Building2, UserCog, PackageSearch, Truck } from "lucide-react";

const roles = [
  { href: "/superadmin/login", label: "Super Admin", desc: "Manage all businesses & tenants", icon: ShieldCheck },
  { href: "/admin/login", label: "Admin", desc: "Your business, clients, fleet & shipments", icon: Building2, badge: "have an account" },
  { href: "/driver/login", label: "Driver", desc: "View assigned trips & deliveries", icon: UserCog, badge: "have an account" },
  { href: "/customer/login", label: "Customer", desc: "Track your shipments live", icon: PackageSearch, badge: "have an account" },
];

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-10 flex flex-col items-center text-center text-white">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">Transport Management</h1>
          <p className="mt-2 text-white/70">Choose the panel you want to sign in to.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:bg-white/10"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{r.label}</h2>
                {r.badge && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">{r.badge}</span>}
              </div>
              <p className="mt-1 text-sm text-white/60">{r.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}