"use client";

import { ResourceManager } from "@/components/ResourceManager";

export default function EmployeesPage() {
  return (
    <ResourceManager
      endpoint="/api/employees"
      pickItems={(d) => d.employees}
      title="Employees"
      description="Your internal staff roster."
      newLabel="Add employee"
      searchPlaceholder="Search employees…"
      emptyTitle="No employees"
      emptyDescription="Add supervisors, helpers and managers."
      filters={[
        { key: "role", label: "Role", options: [{ value: "", label: "All roles" }, { value: "manager", label: "Manager" }, { value: "supervisor", label: "Supervisor" }, { value: "helper", label: "Helper" }, { value: "staff", label: "Staff" }, { value: "loading", label: "Loading" }] },
        { key: "status", label: "Status", options: [{ value: "", label: "All" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
      ]}
      columns={[
        { key: "name", header: "Name" },
        { key: "role", header: "Role", render: (r) => <span className="capitalize">{r.role}</span> },
        { key: "phone", header: "Phone" },
        { key: "email", header: "Email" },
        { key: "salary", header: "Salary", align: "right", render: (r) => `₹${Number(r.salary || 0).toLocaleString()}` },
      ]}
      formFields={[
        { name: "name", label: "Full name", required: true },
        { name: "role", label: "Role", type: "select", defaultValue: "staff", options: [{ value: "manager", label: "Manager" }, { value: "supervisor", label: "Supervisor" }, { value: "helper", label: "Helper" }, { value: "staff", label: "Staff" }, { value: "loading", label: "Loading" }] },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email" },
        { name: "salary", label: "Salary (₹)", type: "number" },
        { name: "status", label: "Status", type: "select", defaultValue: "active", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
      ]}
      badgeKeys={[]}
    />
  );
}