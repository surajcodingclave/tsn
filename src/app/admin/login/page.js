"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
      <LoginForm
        endpoint="/api/auth/login/admin"
        title="Admin Sign in"
        subtitle="Enter your generated User ID to continue"
        kind="Admin"
      />
    </div>
  );
}