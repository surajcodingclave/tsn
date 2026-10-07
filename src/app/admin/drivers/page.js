"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";
import { CredentialsModal } from "@/components/CredentialsModal";

export default function DriversPage() {
  const [vehicles, setVehicles] = useState([]);
  const [creds, setCreds] = useState(null);

  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles((d.vehicles || []).map((v) => ({ value: v.id, label: `${v.vehicleNumber} — ${v.type}` }))));
  }, []);

  return (
    <>
      <ResourceManager
        endpoint="/api/drivers"
        pickItems={(d) => d.drivers}
        title="Drivers Master"
        description="Drivers get a User ID to log in and manage trips."
        newLabel="Add driver"
        searchPlaceholder="Search drivers…"
        emptyTitle="No drivers yet"
        emptyDescription="Add drivers and assign them to vehicles."
        filters={[{ key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "idle", label: "Idle" }, { value: "on-trip", label: "On trip" }, { value: "offline", label: "Offline" }] }]}
        onCreated={(d) => d.credentials && setCreds({ ...d.credentials, name: d.driver?.name, role: "Driver" })}
        columns={[
          { key: "name", header: "Driver" },
          { key: "driverUserId", header: "User ID", render: (r) => <span className="font-mono text-xs">{r.driverUserId}</span> },
          { key: "phone", header: "Phone" },
          { key: "vehicleId", header: "Vehicle", render: (r) => (r.vehicleId ? `${r.vehicleId.vehicleNumber} (${r.vehicleId.type})` : "—") },
          { key: "activeTrips", header: "Active trips", align: "right", render: (r) => r.activeTrips ?? 0 },
        ]}
        formFields={[
          { name: "name", label: "Full name", required: true },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email" },
          { name: "licenseNumber", label: "License number" },
          { name: "vehicleId", label: "Assign vehicle", type: "select", options: [{ value: "", label: "None" }, ...vehicles] },
            { name: "status", label: "Status", type: "select", defaultValue: "idle", options: [{ value: "idle", label: "Idle" }, { value: "on-trip", label: "On trip" }, { value: "offline", label: "Offline" }] },
        ]}
      />
      <CredentialsModal open={!!creds} onClose={() => setCreds(null)} {...(creds || {})} />
    </>
  );
}