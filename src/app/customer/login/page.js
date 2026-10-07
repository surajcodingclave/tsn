"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function CustomerLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
      <LoginForm
        endpoint="/api/auth/login/customer"
        title="Customer Sign in"
        subtitle="Enter your generated User ID to continue"
        kind="Customer"
      />
    </div>
  );
}