"use client";

import { LayoutDashboard, Building2, Users, UserCog, Truck, PackageSearch, MapPin, FileCheck2, BarChart3, ReceiptText, Settings, Boxes, PlusCircle, CheckCircle2, XCircle, Inbox, ClipboardCheck, Bell, Banknote, Briefcase, ClipboardList, Wrench, Radar, Route, FileText, LifeBuoy } from "lucide-react";
import { AppShell } from "./AppShell";
import { FullLoader } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";

const NAVS = {
  superadmin: [
    { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/superadmin/admins", label: "Businesses / Admins", icon: Building2 },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/customers", label: "Customers", icon: Users },
    {
      group: "Fleet Management",
      icon: Truck,
      children: [
        { href: "/admin/fleet", label: "Vehicles Directory", icon: Truck },
        { href: "/admin/vendors", label: "Vendor Management", icon: Boxes },
        { href: "/admin/maintenance", label: "Vehicle Maintenance", icon: Wrench },
        { href: "/admin/gps", label: "GPS Integration", icon: MapPin },
      ],
    },
    {
      group: "Staff & Payroll",
      icon: Users,
      children: [
        { href: "/admin/drivers", label: "Drivers Master", icon: UserCog },
        { href: "/admin/driver-attendance", label: "Driver Attendance", icon: ClipboardCheck },
        { href: "/admin/salaries", label: "Driver Salaries", icon: Banknote },
        { href: "/admin/loading-staff", label: "Loading Staff", icon: Briefcase },
      ],
    },
    {
      group: "Shipment & Booking",
      icon: PackageSearch,
      children: [
        { href: "/admin/shipments?status=", label: "All Shipments", icon: ClipboardList },
        { href: "/admin/shipments?status=pending", label: "Pending", icon: PlusCircle },
        { href: "/admin/shipments?assign=unassigned", label: "Unassigned", icon: XCircle },
        { href: "/admin/shipments?status=assigned", label: "Assigned", icon: MapPin },
        { href: "/admin/shipments?status=in-transit", label: "In Transit", icon: Truck },
        { href: "/admin/shipments?status=out-for-delivery", label: "Out for Delivery", icon: Route },
        { href: "/admin/shipments?status=delivered", label: "Delivered", icon: CheckCircle2 },
        { href: "/admin/shipments?status=delivered&pay=paid", label: "Completed", icon: CheckCircle2 },
      ],
    },
    {
      group: "Operations",
      icon: Radar,
      children: [
        { href: "/admin/assignments", label: "Assignments", icon: UserCog },
        { href: "/admin/active-trips", label: "Active Trips", icon: Route },
        { href: "/admin/tracking", label: "Live Tracking", icon: MapPin },
      ],
    },
    {
      group: "Trip Management",
      icon: Route,
      children: [
        { href: "/admin/trips", label: "All Trips", icon: Route },
        { href: "/admin/trip-expenses", label: "Trip Expenses", icon: Banknote },
        { href: "/admin/trip-settlement", label: "Trip Settlement", icon: ReceiptText },
        { href: "/admin/profit-loss", label: "Profit & Loss", icon: BarChart3 },
      ],
    },
    { href: "/admin/pod", label: "POD / Deliveries", icon: FileCheck2 },
    {
      group: "Transport Receipts",
      icon: FileText,
      children: [
        { href: "/admin/receipts?type=lr", label: "Lorry Receipts (LR)", icon: FileText },
        { href: "/admin/receipts?type=pickup_challan", label: "Pickup Challans", icon: FileText },
        { href: "/admin/receipts?type=delivery_challan", label: "Delivery Challans", icon: FileText },
        { href: "/admin/receipts?type=freight_bill", label: "Freight Billing", icon: ReceiptText },
        { href: "/admin/receipts?type=lr_invoice", label: "LR Invoices", icon: ReceiptText },
        { href: "/admin/billing", label: "Customer Billing", icon: ReceiptText },
        { href: "/admin/vendor-payments", label: "Vendor Payments", icon: Banknote },
      ],
    },
    { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { href: "/admin/support", label: "Help & Support", icon: LifeBuoy },
    { href: "/admin/notices", label: "Notifications", icon: Bell },
    {
      group: "Organization Settings",
      icon: Settings,
      children: [
        { href: "/admin/settings", label: "Admin Settings", icon: Settings },
        { href: "/admin/roles", label: "Role & Permissions", icon: Users },
      ],
    },
  ],
  driver: [
    { href: "/driver/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/driver/shipments", label: "My Trips", icon: PackageSearch },
    { href: "/driver/tracking", label: "Live Tracking", icon: MapPin },
  ],
  customer: [
    { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customer/shipments", label: "My Shipments", icon: PackageSearch },
    { href: "/customer/pod", label: "Proof of Delivery", icon: FileCheck2 },
    { href: "/customer/invoices", label: "Invoices", icon: ReceiptText },
  ],
};

const LABELS = { superadmin: "Super Admin", admin: "Admin", driver: "Driver", customer: "Customer" };

export function MainShell({ role, children }) {
  const { session, tenant, token, loading } = useSession();

  return (
    <AppShell
      nav={NAVS[role] || []}
      brand={tenant}
      user={session}
      roleLabel={LABELS[role]}
      role={role}
    >
      {loading ? <FullLoader label="Loading…" /> : children}
    </AppShell>
  );
}