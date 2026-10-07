"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";

export default function SalariesPage() {
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    fetch("/api/drivers").then((r) => r.json()).then((d) => setDrivers((d.drivers || []).map((x) => ({ value: x.id, label: x.name }))));
  }, []);

  return (
    <ResourceManager
      endpoint="/api/salaries"
      title="Driver Salaries"
      description="Monthly payroll for your drivers."
      newLabel="Add salary"
      searchPlaceholder="Search salaries…"
      emptyTitle="No salary records"
      emptyDescription="Record driver salaries month by month."
      badgeKeys={[]}
      filters={[{ key: "paid", label: "Payment", options: [{ value: "", label: "All" }, { value: "true", label: "Paid" }, { value: "false", label: "Unpaid" }] }]}
      columns={[
        { key: "driverId", header: "Driver", render: (r) => r.driverId?.name || "—" },
        { key: "month", header: "Month", render: (r) => new Date(r.month).toLocaleDateString(undefined, { month: "short", year: "numeric" }) },
        { key: "base", header: "Base", render: (r) => `₹${r.base}`, align: "right" },
        { key: "bonus", header: "Bonus", render: (r) => `₹${r.bonus}`, align: "right" },
        { key: "deduction", header: "Deduction", render: (r) => `₹${r.deduction}`, align: "right" },
        { key: "net", header: "Net", render: (r) => `₹${r.net}`, align: "right" },
        { key: "paid", header: "Status", render: (r) => <span className={r.paid ? "text-emerald-600" : "text-amber-600"}>{r.paid ? "Paid" : "Unpaid"}</span> },
      ]}
      formFields={[
        { name: "driverId", label: "Driver", type: "select", required: true, options: [{ value: "", label: "Select driver" }, ...drivers] },
        { name: "month", label: "Month", type: "date", required: true },
        { name: "base", label: "Base (₹)", type: "number" },
        { name: "bonus", label: "Bonus (₹)", type: "number" },
        { name: "deduction", label: "Deduction (₹)", type: "number" },
        { name: "net", label: "Net (₹)", type: "number" },
        { name: "paid", label: "Paid?", type: "select", defaultValue: "false", options: [{ value: "false", label: "Unpaid" }, { value: "true", label: "Paid" }] },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}