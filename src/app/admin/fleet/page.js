"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";

export default function FleetPage() {
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetch("/api/drivers").then((r) => r.json()).then((d) => setDrivers((d.drivers || []).map((x) => ({ value: x.id, label: x.name }))));
    fetch("/api/vendors").then((r) => r.json()).then((d) => setVendors((d.items || []).map((x) => ({ value: x._id, label: x.name }))));
  }, []);

  return (
    <ResourceManager
      endpoint="/api/vehicles"
      pickItems={(d) => d.vehicles}
      title="Vehicles Directory"
      description="All vehicles in your fleet."
      newLabel="Add vehicle"
      searchPlaceholder="Search vehicles…"
      emptyTitle="No vehicles"
      emptyDescription="Add your vehicles and assign drivers."
      filters={[{ key: "status", label: "Status", options: [{ value: "", label: "All statuses" }, { value: "available", label: "Available" }, { value: "allocated", label: "Allocated" }, { value: "maintenance", label: "Maintenance" }] }]}
      columns={[
        { key: "vehicleNumber", header: "Vehicle" },
        { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.type}</span> },
        { key: "model", header: "Model" },
        { key: "capacity", header: "Capacity" },
        { key: "driverId", header: "Driver", render: (r) => r.driverId?.name || "—" },
        { key: "vendorId", header: "Vendor", render: (r) => r.vendorId?.name || "—" },
        { key: "gpsStatus", header: "GPS", render: (r) => <span className={r.gpsStatus === "online" ? "text-emerald-600" : r.gpsStatus === "offline" ? "text-red-600" : "text-muted-foreground"}>{r.gpsStatus}</span> },
      ]}
      formFields={[
        { name: "vehicleNumber", label: "Vehicle number", required: true },
        { name: "type", label: "Type", type: "select", defaultValue: "truck", options: [{ value: "truck", label: "Truck" }, { value: "van", label: "Van" }, { value: "tempo", label: "Tempo" }, { value: "container", label: "Container" }, { value: "other", label: "Other" }] },
        { name: "model", label: "Model" },
        { name: "capacity", label: "Capacity" },
        { name: "rcNumber", label: "RC number" },
        { name: "driverId", label: "Assign driver", type: "select", options: [{ value: "", label: "None" }, ...drivers] },
        { name: "vendorId", label: "Owner / vendor", type: "select", options: [{ value: "", label: "None" }, ...vendors] },
        { name: "status", label: "Status", type: "select", defaultValue: "available", options: [{ value: "available", label: "Available" }, { value: "allocated", label: "Allocated" }, { value: "maintenance", label: "Maintenance" }] },
        { name: "gpsDevice", label: "GPS device / IMEI" },
        { name: "gpsStatus", label: "GPS signal", type: "select", defaultValue: "none", options: [{ value: "none", label: "Not installed" }, { value: "online", label: "Online" }, { value: "offline", label: "Offline" }] },
      ]}
    />
  );
}