"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function VendorsPage() {
  return (
    <ResourceManager
      endpoint="/api/vendors"
      title="Vendor Management"
      description="Owners, vendors and partner transporters."
      newLabel="Add vendor"
      searchPlaceholder="Search vendors…"
      emptyTitle="No vendors yet"
      emptyDescription="Add owners/public transporters you work with."
      filters={[
        { key: "type", label: "Type", options: [{ value: "", label: "All types" }, { value: "owner", label: "Owner" }, { value: "vendor", label: "Vendor" }, { value: "transporter", label: "Transporter" }] },
        { key: "status", label: "Status", options: [{ value: "", label: "All statuses" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
      ]}
      columns={[
        { key: "name", header: "Vendor" },
        { key: "type", header: "Type" },
        { key: "phone", header: "Phone" },
        { key: "email", header: "Email" },
        { key: "gstin", header: "GSTIN" },
        { key: "address", header: "Address" },
      ]}
      formFields={[
        { name: "name", label: "Vendor name", required: true },
        { name: "type", label: "Type", type: "select", defaultValue: "vendor", options: [{ value: "owner", label: "Owner" }, { value: "vendor", label: "Vendor" }, { value: "transporter", label: "Transporter" }] },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email" },
        { name: "gstin", label: "GSTIN" },
        { name: "address", label: "Address", type: "textarea", colSpan: 2 },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}