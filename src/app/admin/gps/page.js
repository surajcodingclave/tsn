"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function GpsPage() {
  return (
    <ResourceManager
      endpoint="/api/vehicles"
      pickItems={(d) => d.vehicles}
      allowDelete={false}
      allowCreate={false}
      title="GPS Integration"
      description="Assign GPS devices to vehicles and monitor their connection."
      searchPlaceholder="Search vehicles…"
      emptyTitle="No vehicles"
      emptyDescription="Add vehicles first, then attach GPS devices."
      badgeKeys={[]}
      columns={[
        { key: "vehicleNumber", header: "Vehicle" },
        { key: "type", header: "Type" },
        { key: "gpsDevice", header: "GPS device / IMEI", render: (r) => r.gpsDevice || "—" },
        { key: "gpsStatus", header: "Signal", render: (r) => <span className={r.gpsStatus === "online" ? "text-emerald-600" : r.gpsStatus === "offline" ? "text-red-600" : "text-muted-foreground"}>{r.gpsStatus}</span> },
        { key: "driverId", header: "Driver", render: (r) => r.driverId?.name || "—" },
      ]}
      formFields={[
        { name: "gpsDevice", label: "GPS device / IMEI" },
        { name: "gpsStatus", label: "Signal", type: "select", defaultValue: "none", options: [{ value: "online", label: "Online" }, { value: "offline", label: "Offline" }, { value: "none", label: "Not installed" }] },
      ]}
    />
  );
}