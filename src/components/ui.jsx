"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2, X } from "lucide-react";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ---------------- Button ---------------- */
export function Button({ children, className, variant = "primary", size = "md", loading, disabled, ...props }) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-transparent hover:bg-muted",
    ghost: "bg-transparent hover:bg-muted",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", lg: "h-11 px-6 text-base" };
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Form primitives ---------------- */
export function Label({ children, className, ...props }) {
  return (
    <label className={cn("block text-sm font-medium text-foreground mb-1.5", className)} {...props}>
      {children}
    </label>
  );
}

const fieldBase =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function Input({ className, ...props }) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(fieldBase, "min-h-[80px]", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(fieldBase, className)} {...props}>
      {children}
    </select>
  );
}

/* ---------------- Card ---------------- */
export function Card({ className, ...props }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)} {...props} />
  );
}
export function CardHeader({ className, ...props }) {
  return <div className={cn("p-5 pb-2", className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-base font-semibold", className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

/* ---------------- Badge ---------------- */
const badgeStyles = {
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
  indigo: "bg-indigo-100 text-indigo-700",
};
export function Badge({ children, tone = "gray", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        badgeStyles[tone] || badgeStyles.gray,
        className
      )}
    >
      {children}
    </span>
  );
}

export const statusTone = {
  pending: "amber",
  assigned: "blue",
  picked: "indigo",
  "in-transit": "blue",
  "out-for-delivery": "indigo",
  delivered: "green",
  cancelled: "red",
  active: "green",
  blocked: "red",
  available: "green",
  allocated: "blue",
  maintenance: "red",
  idle: "green",
  "on-trip": "blue",
  offline: "gray",
  paid: "green",
  unpaid: "amber",
  inactive: "gray",
};

export function StatusBadge({ status }) {
  return <Badge tone={statusTone[status] || "gray"}>{status}</Badge>;
}

/* ---------------- Spinner / Loader ---------------- */
export function Spinner({ className }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-muted-foreground", className)} />;
}
export function FullLoader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
      <Spinner className="h-7 w-7" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative my-3 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-2xl sm:my-0 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
      {Icon && <Icon className="h-9 w-9 text-muted-foreground" />}
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/* ---------------- Table helpers ---------------- */
export function Th({ children, className }) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className }) {
  return <td className={cn("px-4 py-3 text-sm", className)}>{children}</td>;
}