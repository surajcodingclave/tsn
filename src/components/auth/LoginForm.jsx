"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Truck, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm({ endpoint, idLabel = "User ID", idField = "userId", idPlaceholder = "e.g. ADM-XXXXXX", title, subtitle, kind }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState(null);
  const timer = useRef(null);

  // live brand preview as the user types their ID
  useEffect(() => {
    clearTimeout(timer.current);
    if (!id.trim()) {
      setBrand(null);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/brand?userId=${encodeURIComponent(id.trim())}`);
        const data = await res.json();
        setBrand(data.tenant);
      } catch {
        setBrand(null);
      }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idField]: id.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(`/${data.role}/dashboard`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      {/* Brand preview */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.name} className="h-14 w-14 rounded-xl object-contain bg-white" />
          ) : (
            <Truck className="h-7 w-7" />
          )}
        </div>
        <h1 className="text-lg font-semibold">{brand?.name || title}</h1>
        <p className="text-sm text-muted-foreground">{brand ? "Sign in to your account" : subtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="id">{idLabel}</Label>
          <Input id="id" value={id} onChange={(e) => setId(e.target.value)} placeholder={idPlaceholder} autoComplete="username" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" autoComplete="current-password" required />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 text-center">
        <button onClick={() => router.push("/login")} className="text-xs text-muted-foreground hover:text-foreground">
          ← Choose a different panel
        </button>
      </div>
      {kind && <p className="mt-3 text-center text-xs text-muted-foreground">You are signing in as a {kind}.</p>}
    </div>
  );
}