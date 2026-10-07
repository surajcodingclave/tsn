"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function LoadingStaffPage() {
  return (
    <ResourceManager
      endpoint="/api/employees"
      fixedQuery={{ role: "loading" }}
      pickItems={(d) => d.employees}
      title="Loading Staff"
      description="Loaders and helpers who handle cargo."
      newLabel="Add loading staff"
      searchPlaceholder="Search loading staff…"
      emptyTitle="No loading staff"
      emptyDescription="Add your loading and unloading staff."
      defaults={{ role: "loading" }}
      columns={[
        { key: "name", header: "Name" },
        { key: "phone", header: "Phone" },
        { key: "email", header: "Email" },
        { key: "salary", header: "Salary", render: (r) => `₹${r.salary || 0}`, align: "right" },
        { key: "status", header: "Status" },
      ]}
      formFields={[
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email" },
        { name: "salary", label: "Salary (₹)", type: "number" },
        { name: "status", label: "Status", type: "select", defaultValue: "active", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
        { name: "joinedAt", label: "Joined on", type: "date" },
      ]}
    />
  );
}