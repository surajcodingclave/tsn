"use client";

import { useState } from "react";
import { Copy, Check, Save, User, KeyRound } from "lucide-react";
import { Modal, Button, Badge } from "@/components/ui";

export function CredentialsModal({ open, onClose, role, userId, password, name }) {
  const [copied, setCopied] = useState("");

  const copy = async (what, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${name || role} created — one-time credentials`}
      footer={
        <Button
          onClick={onClose}
          variant="success"
        >
          <Save className="h-4 w-4" /> I&apos;ve saved these
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Important:</span> these credentials are only shown once. Share the{" "}
          <span className="font-medium">User ID</span> and <span className="font-medium">Password</span> with the{" "}
          <Badge tone="blue">{role}</Badge> so they can sign in.
        </p>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" /> User ID
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 font-mono text-sm">
                <span className="truncate">{userId}</span>
                <Button variant="ghost" size="sm" onClick={() => copy("id", userId)}>
                  {copied === "id" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" /> Password
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 font-mono text-sm">
                <span className="truncate">{password}</span>
                <Button variant="ghost" size="sm" onClick={() => copy("pw", password)}>
                  {copied === "pw" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}