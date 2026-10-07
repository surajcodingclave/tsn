"use client";

import { useState } from "react";
import { ResourceManager } from "@/components/ResourceManager";
import { CredentialsModal } from "@/components/CredentialsModal";

export default function CustomersPage() {
  const [creds, setCreds] = useState(null);

  return (
    <>
      <ResourceManager
        endpoint="/api/clients"
        pickItems={(d) => d.clients}
        title="Customers"
        description="All customers you ship for. Each gets a User ID to track shipments."
        newLabel="Add customer"
        searchPlaceholder="Search customers…"
        emptyTitle="No customers yet"
        emptyDescription="Add a customer and they'll get credentials to live-track shipments."
        filters={[{ key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }] }]}
        onCreated={(d) => d.credentials && setCreds({ ...d.credentials, name: d.client?.companyName, role: "Customer / client" })}
        columns={[
          { key: "companyName", header: "Customer" },
          { key: "customerUserId", header: "User ID", render: (r) => <span className="font-mono text-xs">{r.customerUserId}</span> },
          { key: "contactPerson", header: "Contact person" },
          { key: "phone", header: "Phone" },
          { key: "email", header: "Email" },
          { key: "address", header: "Address" },
          { key: "shipments", header: "Shipments", align: "right", render: (r) => r.shipments ?? 0 },
        ]}
        formFields={[
          { name: "companyName", label: "Customer / company name", required: true },
          { name: "contactPerson", label: "Contact person" },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email" },
          { name: "address", label: "Address", type: "textarea", colSpan: 2 },
        ]}
      />
      <CredentialsModal open={!!creds} onClose={() => setCreds(null)} {...(creds || {})} />
    </>
  );
}