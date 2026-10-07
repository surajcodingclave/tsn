"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function VendorPaymentsPage() {
  return (
    <ResourceManager
      endpoint="/api/documents"
      fixedQuery={{ type: "vendor_payment" }}
      title="Vendor Payments"
      description="Payments made to vendors and transporters."
      newLabel="Add payment"
      searchPlaceholder="Search payments…"
      emptyTitle="No vendor payments"
      emptyDescription="Record payments made to vendors."
      defaults={{ type: "vendor_payment" }}
      filters={[{ key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "draft", label: "Draft" }, { value: "issued", label: "Issued" }, { value: "paid", label: "Paid" }] }]}
      columns={[
        { key: "date", header: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
        { key: "number", header: "Ref no." },
        { key: "partyName", header: "Vendor" },
        { key: "amount", header: "Amount", render: (r) => `₹${r.amount}`, align: "right" },
      ]}
      formFields={[
        { name: "partyName", label: "Vendor name", required: true },
        { name: "number", label: "Reference no." },
        { name: "amount", label: "Amount (₹)", type: "number", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", defaultValue: "paid", options: [{ value: "draft", label: "Draft" }, { value: "issued", label: "Issued" }, { value: "paid", label: "Paid" }] },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}