"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";

export default function TripExpensesPage() {
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {
    fetch("/api/drivers").then((r) => r.json()).then((d) => setDrivers((d.drivers || []).map((x) => ({ value: x.id, label: x.name }))));
  }, []);

  return (
    <ResourceManager
      endpoint="/api/trip-expenses"
      title="Trip Expenses"
      description="Fuel, tolls and other trip-level costs."
      newLabel="Add expense"
      searchPlaceholder="Search expenses…"
      emptyTitle="No expenses logged"
      emptyDescription="Log expenses against trips."
      badgeKeys={[]}
      filters={[{ key: "type", label: "Type", options: [{ value: "", label: "All types" }, { value: "fuel", label: "Fuel" }, { value: "toll", label: "Toll" }, { value: "food", label: "Food" }, { value: "repair", label: "Repair" }, { value: "parking", label: "Parking" }, { value: "other", label: "Other" }] }]}
      columns={[
        { key: "date", header: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
        { key: "trackingNumber", header: "Trip / LR", render: (r) => r.trackingNumber || "—" },
        { key: "driverId", header: "Driver", render: (r) => r.driverId?.name || "—" },
        { key: "type", header: "Type" },
        { key: "amount", header: "Amount", render: (r) => `₹${r.amount}`, align: "right" },
        { key: "note", header: "Note" },
      ]}
      formFields={[
        { name: "date", label: "Date", type: "date", required: true },
        { name: "type", label: "Type", type: "select", defaultValue: "fuel", options: [{ value: "fuel", label: "Fuel" }, { value: "toll", label: "Toll" }, { value: "food", label: "Food" }, { value: "repair", label: "Repair" }, { value: "parking", label: "Parking" }, { value: "other", label: "Other" }] },
        { name: "trackingNumber", label: "Trip / LR number" },
        { name: "driverId", label: "Driver", type: "select", options: [{ value: "", label: "Select driver" }, ...drivers] },
        { name: "amount", label: "Amount (₹)", type: "number", required: true },
        { name: "note", label: "Note", colSpan: 2 },
      ]}
    />
  );
}