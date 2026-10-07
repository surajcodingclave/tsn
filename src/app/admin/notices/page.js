"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function NoticesPage() {
  return (
    <ResourceManager
      endpoint="/api/notices"
      pickItems={(d) => d.notices}
      title="Notifications"
      description="Broadcast announcements to drivers & customers."
      newLabel="New notice"
      searchPlaceholder="Search notices…"
      emptyTitle="No notices yet"
      emptyDescription="Create announcements for drivers and customers."
      badgeKeys={[]}
      filters={[
        { key: "audience", label: "Audience", options: [{ value: "", label: "All audiences" }, { value: "all", label: "Everyone" }, { value: "admin", label: "Admins" }, { value: "driver", label: "Drivers" }, { value: "customer", label: "Customers" }] },
        { key: "active", label: "Status", options: [{ value: "", label: "All" }, { value: "true", label: "Active" }, { value: "false", label: "Draft" }] },
      ]}
      columns={[
        { key: "title", header: "Title" },
        { key: "body", header: "Message", render: (r) => <span className="line-clamp-1 text-xs text-muted-foreground">{r.body}</span> },
        { key: "audience", header: "Audience" },
        { key: "active", header: "Status", render: (r) => <span className={r.active ? "text-emerald-600" : "text-muted-foreground"}>{r.active ? "Active" : "Draft"}</span> },
        { key: "createdAt", header: "Created", render: (r) => new Date(r.createdAt).toLocaleDateString() },
      ]}
      formFields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        { name: "body", label: "Message", type: "textarea", colSpan: 2 },
        { name: "audience", label: "Audience", type: "select", defaultValue: "all", options: [{ value: "all", label: "Everyone" }, { value: "admin", label: "Admins" }, { value: "driver", label: "Drivers" }, { value: "customer", label: "Customers" }] },
        { name: "active", label: "Published", type: "select", defaultValue: "true", options: [{ value: "true", label: "Active" }, { value: "false", label: "Draft" }] },
      ]}
    />
  );
}