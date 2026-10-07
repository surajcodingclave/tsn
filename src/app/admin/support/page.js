"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function SupportPage() {
  return (
    <ResourceManager
      endpoint="/api/tickets"
      title="Help & Support"
      description="Raise and track support tickets."
      newLabel="New ticket"
      searchPlaceholder="Search tickets…"
      emptyTitle="No tickets"
      emptyDescription="Create a ticket for any issue or request."
      badgeKeys={[]}
      filters={[
        { key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "open", label: "Open" }, { value: "in-progress", label: "In progress" }, { value: "resolved", label: "Resolved" }, { value: "closed", label: "Closed" }] },
        { key: "priority", label: "Priority", options: [{ value: "", label: "All" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
      ]}
      columns={[
        { key: "subject", header: "Subject" },
        { key: "category", header: "Category" },
        { key: "priority", header: "Priority", render: (r) => <span className={r.priority === "high" ? "text-red-600" : r.priority === "low" ? "text-muted-foreground" : "text-amber-600"}>{r.priority}</span> },
        { key: "status", header: "Status" },
        { key: "createdAt", header: "Created", render: (r) => new Date(r.createdAt).toLocaleDateString() },
      ]}
      formFields={[
        { name: "subject", label: "Subject", required: true, colSpan: 2 },
        { name: "category", label: "Category", defaultValue: "general" },
        { name: "priority", label: "Priority", type: "select", defaultValue: "medium", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }] },
        { name: "status", label: "Status", type: "select", defaultValue: "open", options: [{ value: "open", label: "Open" }, { value: "in-progress", label: "In progress" }, { value: "resolved", label: "Resolved" }, { value: "closed", label: "Closed" }] },
        { name: "message", label: "Message", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}