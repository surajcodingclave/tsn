"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Truck, ChevronDown } from "lucide-react";
import { cn } from "@/components/ui";

/** Matches a nav link (which may contain a query string) against the current path. */
function linkActive(href, pathname) {
  const clean = href.split("?")[0];
  return pathname === clean || pathname.startsWith(clean + "/");
}

export function AppShell({ nav, brand, user, roleLabel, role, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Accordion sidebar: only ONE group is open at a time (the one you opened / the active page). 
  const [openGroup, setOpenGroup] = useState(null);
  const toggleGroup = (g) => setOpenGroup((prev) => (prev === g ? null : g));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (href) => linkActive(href, pathname);

  // Open the group containing the current page (e.g. navigate to a shipment = Shipment & Booking submenu opens).
  useEffect(() => {
    const active = nav.find((i) => i.group && i.children.some((c) => linkActive(c.href, pathname)));
    if (active) setOpenGroup((prev) => prev || active.group);
  }, [pathname, nav]);

  // NavBody is defined as a renderable element so it can be reused in both desktop & mobile.
  const NavBody = nav.map((item) =>
    item.group ? (
      <NavGroup
        key={item.group}
        item={item}
        setOpen={setOpen}
        isActive={isActive}
        open={openGroup === item.group}
        onToggle={() => toggleGroup(item.group)}
      />
    ) : (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    )
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        {brand?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt={brand.name} className="h-10 w-10 rounded-lg object-contain bg-white" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{brand?.name || "Transport"}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">{NavBody}</nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card md:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card shadow-xl">
            {sidebar}
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 hover:bg-muted md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div />
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-muted-foreground">Welcome,</span>
            <span className="font-medium">{user?.name || roleLabel}</span>
          </div>
        </header>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ item, setOpen, isActive, open, onToggle }) {
  const groupIcon = item.icon;

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
          item.children.some((c) => isActive(c.href)) ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-3">
          {groupIcon && <groupIcon className="h-4 w-4" />}
          {item.group}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 space-y-1 border-l border-border pl-3 ml-4">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive(child.href)
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {child.icon ? <child.icon className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-border" />}
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}