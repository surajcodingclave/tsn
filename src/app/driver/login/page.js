"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function DriverLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
      <LoginForm
        endpoint="/api/auth/login/driver"
        title="Driver Sign in"
        subtitle="Enter your generated User ID to continue"
        kind="Driver"
      />
    </div>
  );
}