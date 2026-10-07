"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function EnquiriesPage() {
  return (
    <ResourceManager
      endpoint="/api/enquiries"
      pickItems={(d) => d.enquiries}
      title="Enquiries & Quotes"
      description="Leads, quotes and conversions."
      newLabel="New enquiry"
      searchPlaceholder="Search enquiries…"
      emptyTitle="No enquiries yet"
      emptyDescription="Add enquiries or quotes for potential shipments."
      badgeKeys={[]}
      filters={[{ key: "status", label: "Status", options: [{ value: "", label: "All statuses" }, { value: "open", label: "Open" }, { value: "contacted", label: "Contacted" }, { value: "quoted", label: "Quoted" }, { value: "won", label: "Won" }, { value: "lost", label: "Lost" }] }]}
      columns={[
        { key: "name", header: "Customer" },
        { key: "phone", header: "Phone" },
        { key: "route", header: "Route", render: (r) => `${r.from || "—"} → ${r.to || "—"}` },
        { key: "materialType", header: "Material" },
        { key: "weight", header: "Weight", align: "right", render: (r) => (r.weight ? `${r.weight} kg` : "—") },
        { key: "quoteAmount", header: "Quote", align: "right", render: (r) => (r.quoteAmount ? `₹${r.quoteAmount}` : "—") },
        { key: "status", header: "Status", render: (r) => <span className="capitalize">{r.status}</span> },
      ]}
      formFields={[
        { name: "name", label: "Contact name", required: true },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email" },
        { name: "from", label: "From" },
        { name: "to", label: "To" },
        { name: "vehicleType", label: "Vehicle type" },
        { name: "materialType", label: "Material" },
        { name: "weight", label: "Weight (kg)", type: "number" },
        { name: "quoteAmount", label: "Quote amount (₹)", type: "number" },
        { name: "status", label: "Status", type: "select", defaultValue: "open", options: [{ value: "open", label: "Open" }, { value: "contacted", label: "Contacted" }, { value: "quoted", label: "Quoted" }, { value: "won", label: "Won" }, { value: "lost", label: "Lost" }] },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}