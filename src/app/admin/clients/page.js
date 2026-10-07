"use client";

import { useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";
import { CredentialsModal } from "@/components/CredentialsModal";

export default function ClientsPage() {
  const [creds, setCreds] = useState(null);
  return (
    <>
      <ResourceManager
        endpoint="/api/clients"
        pickItems={(d) => d.clients}
        title="Clients & Users"
        description="Every client gets a User ID to track their shipments."
        newLabel="Add client"
        searchPlaceholder="Search clients…"
        emptyTitle="No clients yet"
        emptyDescription="Add clients and they'll get credentials to live-track shipments."
        filters={[{ key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }] }]}
        onCreated={(d) => d.credentials && setCreds({ ...d.credentials, name: d.client?.companyName, role: "Customer / client" })}
        columns={[
          { key: "companyName", header: "Client" },
          { key: "customerUserId", header: "User ID", render: (r) => <span className="font-mono text-xs">{r.customerUserId}</span> },
          { key: "contactPerson", header: "Contact" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
          { key: "shipments", header: "Shipments", align: "right", render: (r) => r.shipments ?? 0 },
        ]}
        formFields={[
          { name: "companyName", label: "Company name", required: true },
          { name: "contactPerson", label: "Contact person" },
          { name: "email", label: "Email" },
          { name: "phone", label: "Phone" },
          { name: "address", label: "Address", type: "textarea", colSpan: 2 },
        ]}
      />
      <CredentialsModal open={!!creds} onClose={() => setCreds(null)} {...(creds || {})} />
    </>
  );
}