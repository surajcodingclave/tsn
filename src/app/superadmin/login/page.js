"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function SuperAdminLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
      <LoginForm
        endpoint="/api/auth/login/superadmin"
        idLabel="Email"
        idField="email"
        idPlaceholder="superadmin@company.com"
        title="Super Admin Sign in"
        subtitle="Authorized personnel only"
        kind="Super Admin"
      />
    </div>
  );
}