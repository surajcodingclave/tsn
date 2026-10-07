"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResourceManager } from "@/components/ResourceManager";
import { MainShell } from "@/components/layout/MainShell";
import { FullLoader } from "@/components/ui";

const TYPE_LABELS = {
  lr: "Lorry Receipts (LR)",
  pickup_challan: "Pickup Challans",
  delivery_challan: "Delivery Challans",
  freight_bill: "Freight Billing",
  lr_invoice: "LR Invoices",
  "": "Transport Receipts",
};

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<MainShell role="admin"><FullLoader /></MainShell>}>
      <ReceiptsInner />
    </Suspense>
  );
}

function ReceiptsInner() {
  const type = useSearchParams().get("type") || "";
  const label = TYPE_LABELS[type] || "Transport Receipts";

  return (
    <ResourceManager
      key={type}
      endpoint="/api/documents"
      fixedQuery={type ? { type } : {}}
      title={label}
      description="Issue and track transport documents."
      newLabel="New document"
      searchPlaceholder="Search by number, party…"
      emptyTitle="No documents"
      emptyDescription="Create receipts, challans and invoices."
      filters={[
        { key: "type", label: "Type", options: [{ value: "", label: "All types" }, { value: "lr", label: "LR" }, { value: "pickup_challan", label: "Pickup Challan" }, { value: "delivery_challan", label: "Delivery Challan" }, { value: "freight_bill", label: "Freight Bill" }, { value: "lr_invoice", label: "LR Invoice" }] },
        { key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "draft", label: "Draft" }, { value: "issued", label: "Issued" }, { value: "paid", label: "Paid" }, { value: "cancelled", label: "Cancelled" }] },
      ]}
      defaults={{ type: type || "lr" }}
      columns={[
        { key: "number", header: "Number" },
        { key: "type", header: "Type", render: (r) => TYPE_LABELS[r.type]?.replace(/ \(LR\)|s$/, "") || r.type },
        { key: "trackingNumber", header: "Trip / LR" },
        { key: "partyName", header: "Party" },
        { key: "amount", header: "Amount", render: (r) => `₹${r.amount}`, align: "right" },
        { key: "date", header: "Date", render: (r) => new Date(r.date).toLocaleDateString() },
      ]}
      formFields={[
        { name: "type", label: "Type", type: "select", required: true, options: [{ value: "lr", label: "Lorry Receipt" }, { value: "pickup_challan", label: "Pickup Challan" }, { value: "delivery_challan", label: "Delivery Challan" }, { value: "freight_bill", label: "Freight Bill" }, { value: "lr_invoice", label: "LR Invoice" }] },
        { name: "number", label: "Document number" },
        { name: "trackingNumber", label: "Trip / LR number" },
        { name: "partyName", label: "Party name" },
        { name: "amount", label: "Amount (₹)", type: "number" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", defaultValue: "issued", options: [{ value: "draft", label: "Draft" }, { value: "issued", label: "Issued" }, { value: "paid", label: "Paid" }, { value: "cancelled", label: "Cancelled" }] },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}