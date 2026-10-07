"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles((d.vehicles || []).map((v) => ({ value: v.id, label: v.vehicleNumber }))));
  }, []);

  return (
    <ResourceManager
      endpoint="/api/maintenance"
      title="Vehicle Maintenance"
      description="Service, repairs and maintenance history."
      newLabel="Add record"
      searchPlaceholder="Search maintenance…"
      emptyTitle="No maintenance records"
      emptyDescription="Log servicing and repairs for your vehicles."
      filters={[
        { key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "pending", label: "Pending" }, { value: "in-progress", label: "In progress" }, { value: "completed", label: "Completed" }] },
        { key: "type", label: "Type", options: [{ value: "", label: "All types" }, { value: "service", label: "Service" }, { value: "repair", label: "Repair" }, { value: "tyre", label: "Tyre" }, { value: "oil", label: "Oil" }, { value: "insurance", label: "Insurance" }, { value: "other", label: "Other" }] },
      ]}
      columns={[
        { key: "vehicleId", header: "Vehicle", render: (r) => r.vehicleId?.vehicleNumber || "—" },
        { key: "type", header: "Type" },
        { key: "description", header: "Description" },
        { key: "cost", header: "Cost", render: (r) => `₹${r.cost}`, align: "right" },
        { key: "odometer", header: "Odometer", render: (r) => (r.odometer ? `${r.odometer} km` : "—"), align: "right" },
        { key: "date", header: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
      ]}
      formFields={[
        { name: "vehicleId", label: "Vehicle", type: "select", required: true, options: [{ value: "", label: "Select vehicle" }, ...vehicles] },
        { name: "type", label: "Type", type: "select", defaultValue: "service", options: [{ value: "service", label: "Service" }, { value: "repair", label: "Repair" }, { value: "tyre", label: "Tyre" }, { value: "oil", label: "Oil" }, { value: "insurance", label: "Insurance" }, { value: "other", label: "Other" }] },
        { name: "description", label: "Description", colSpan: 2 },
        { name: "cost", label: "Cost (₹)", type: "number" },
        { name: "odometer", label: "Odometer (km)", type: "number" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", defaultValue: "pending", options: [{ value: "pending", label: "Pending" }, { value: "in-progress", label: "In progress" }, { value: "completed", label: "Completed" }] },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}