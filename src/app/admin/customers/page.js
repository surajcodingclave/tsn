"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Save, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { CredentialsModal } from "@/components/CredentialsModal";
import { Modal, Button, Badge, StatusBadge, Input, Select, Textarea, Label } from "@/components/ui";

const CUSTOMER_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "corporate", label: "Corporate" },
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "government", label: "Government" },
  { value: "premium", label: "Premium" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function CustomerForm({ customer, onSubmit, submitLabel }) {
  const [form, setForm] = useState(customer || {});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleChange = (e) => set(e.target.name, e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name || "",
      companyName: (form.companyName || "").trim(),
      contactPerson: form.contactPerson || "",
      email: form.email || "",
      phone: form.phone || "",
      customerType: form.customerType || "regular",
      gstin: form.gstin || "",
      status: form.status || "active",
      street: form.street || "",
      city: form.city || "",
      state: form.state || "",
      pincode: form.pincode || "",
      country: form.country || "",
      billingAddress: form.billingAddress || "",
      shippingAddress: form.shippingAddress || "",
      notes: form.notes || "",
    });
  };

  return (
    <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      <div>
        <Label>Customer Name</Label>
        <Input name="name" value={form.name || ""} onChange={handleChange} placeholder="e.g. Ramesh Kumar" />
      </div>
      <div>
        <Label>Company Name *</Label>
        <Input name="companyName" value={form.companyName || ""} onChange={handleChange} placeholder="e.g. Acme Traders" required />
      </div>
      <div>
        <Label>Email Address</Label>
        <Input type="email" name="email" value={form.email || ""} onChange={handleChange} placeholder="name@company.com" />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input name="phone" value={form.phone || ""} onChange={handleChange} placeholder="+91-98765-43210" />
      </div>
      <div>
        <Label>Customer Type</Label>
        <Select name="customerType" value={form.customerType || "regular"} onChange={(v) => set("customerType", v)}>
          {CUSTOMER_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
      <div>
        <Label>GST Number</Label>
        <Input name="gstin" value={form.gstin || ""} onChange={handleChange} placeholder="27AABCCDDEEFFG" />
      </div>
      <div>
        <Label>Account Status</Label>
        <Select name="status" value={form.status || "active"} onChange={(v) => set("status", v)}>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </Select>
      </div>
      <div>
        <Label>Password / Login credentials</Label>
        <Input value="Auto-generated on save" disabled className="text-muted-foreground" />
      </div>
      <div className="sm:col-span-2">
        <Label>Street / Office Address</Label>
        <Textarea name="street" value={form.street || ""} onChange={handleChange} placeholder="Street / office address" />
      </div>
      <div>
        <Label>City</Label>
        <Input name="city" value={form.city || ""} onChange={handleChange} />
      </div>
      <div>
        <Label>State</Label>
        <Input name="state" value={form.state || ""} onChange={handleChange} />
      </div>
      <div>
        <Label>Pincode</Label>
        <Input name="pincode" value={form.pincode || ""} onChange={handleChange} />
      </div>
      <div>
        <Label>Country</Label>
        <Input name="country" value={form.country || ""} onChange={handleChange} placeholder="India" />
      </div>
      <div className="sm:col-span-2">
        <Label>Billing Address</Label>
        <Textarea name="billingAddress" value={form.billingAddress || ""} onChange={handleChange} placeholder="Billing address" />
      </div>
      <div className="sm:col-span-2">
        <Label>Shipping Address</Label>
        <Textarea name="shippingAddress" value={form.shippingAddress || ""} onChange={handleChange} placeholder="Shipping address" />
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" value={form.notes || ""} onChange={handleChange} placeholder="Any other relevant details" />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="submit" variant="primary" disabled={!(form.companyName || "").trim()} icon={<Save className="h-4 w-4" />}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, valueMono, children, value }) {
  const v = children ?? value;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={valueMono ? "font-mono text-xs break-all" : "text-sm"}>{v || "—"}</p>
    </div>
  );
}

export default function CustomersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState(null); // { mode: "create"|"edit"|"view", customer? }
  const [creds, setCreds] = useState(null);
  const [rows, setRows] = useState([]);

  const { isLoading, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const r = await fetch("/api/customers?pageSize=500");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load customers");
      setRows(d.customers || []);
      return d.customers;
    },
    staleTime: 60000,
  });
  const refresh = () => refetch();

  const submit = async (payload) => {
    const isCreate = modal.mode === "create";
    const url = isCreate ? "/api/customers" : `/api/customers/${modal.customer.id}`;
    const method = isCreate ? "POST" : "PATCH";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) { alert(d.error || "Save failed"); return; }
    if (isCreate && d.credentials) setCreds({ ...d.credentials, name: d.customer?.companyName, role: "Customer" });
    refresh();
    setModal(null);
  };

  const remove = async (id) => {
    if (!confirm("Delete this customer? They must have no shipments attached.")) return;
    const r = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) alert(d.error || "Delete failed"); else refresh();
  };

  const toggleStatus = async (c) => {
    const r = await fetch(`/api/customers/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggleStatus" }),
    });
    if (r.ok) refresh();
  };

  const columns = [
    { key: "name", header: "Customer Name", sortable: true, render: (r) => <span className="font-medium">{r.name || r.companyName || "—"}</span> },
    { key: "companyName", header: "Company Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "customerType", header: "Customer Type", sortable: true, render: (r) => <Badge tone="blue">{r.customerType?.replace(/_/g, " ") || "—"}</Badge> },
    { key: "gstin", header: "GST Number" },
    { key: "city", header: "City" },
    { key: "state", header: "State" },
    { key: "status", header: "Account Status", sortable: true, render: (r) => (
        <button onClick={() => toggleStatus(r)} className="cursor-pointer" title="Toggle status"><StatusBadge status={r.status} /></button>
      ) },
    { key: "createdAt", header: "Created", sortable: true, render: (r) => <span className="text-xs">{fmtDate(r.createdAt)}</span> },
  ];

  const visible = rows.filter(
    (r) => (!statusFilter || r.status === statusFilter) && (!typeFilter || r.customerType === typeFilter)
  );

  return (
    <MainShell role="admin">
      <DataTable
        title="Customers"
        description="All customers you ship for. Each gets a login User ID to track their shipments."
        columns={columns}
        data={visible}
        loading={isLoading}
        searchPlaceholder="Search customers…"
        emptyTitle="No customers yet"
        emptyDescription="Add a customer and they get credentials to live-track shipments."
        filters={[
          { key: "status", value: statusFilter, onChange: setStatusFilter, options: [{ value: "", label: "All status" }, { value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }] },
          { key: "customerType", value: typeFilter, onChange: setTypeFilter, options: [{ value: "", label: "All types" }, ...CUSTOMER_TYPES] },
        ]}
        toolbar={<Button size="sm" onClick={() => setModal({ mode: "create" })} icon={<Plus className="h-4 w-4" />}>Add customer</Button>}
        rowActions={(r) => (
          <>
            <button onClick={() => setModal({ mode: "view", customer: r })} className="rounded p-1 text-muted-foreground hover:text-foreground" title="View"><Eye className="h-4 w-4" /></button>
            <button onClick={() => setModal({ mode: "edit", customer: r })} className="rounded p-1 text-muted-foreground hover:text-foreground" title="Edit"><Edit className="h-4 w-4" /></button>
            <button onClick={() => remove(r.id)} className="rounded p-1 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
        onRowClick={(r) => setModal({ mode: "view", customer: r })}
      />

      <Modal
        open={!!modal && (modal.mode === "create" || modal.mode === "edit")}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "Add customer" : "Edit customer"}
      >
        {modal && <CustomerForm customer={modal.mode === "edit" ? modal.customer : undefined} onSubmit={submit} submitLabel={modal.mode === "create" ? "Create & issue credentials" : "Save changes"} />}
      </Modal>

      {modal?.customer && (
        <Modal
          open={modal.mode === "view"}
          onClose={() => setModal(null)}
          title="Customer details"
          footer={<div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setModal({ mode: "edit", customer: modal.customer })} icon={<Edit className="h-4 w-4" />}>Edit</Button>
            <Button variant="outline" size="sm" onClick={() => toggleStatus(modal.customer)} icon={<RefreshCw className="h-4 w-4" />}>Toggle status</Button>
            <Button variant="outline" size="sm" onClick={() => setModal(null)}>Close</Button>
          </div>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Customer Name">{modal.customer.name}</Field>
            <Field label="Company Name">{modal.customer.companyName}</Field>
            <Field label="User ID" valueMono>{modal.customer.customerUserId}</Field>
            <Field label="Email">{modal.customer.email}</Field>
            <Field label="Phone">{modal.customer.phone}</Field>
            <Field label="Customer Type">{modal.customer.customerType}</Field>
            <Field label="GST Number">{modal.customer.gstin}</Field>
            <Field label="Account Status"><StatusBadge status={modal.customer.status} /></Field>
            <Field label="Shipments">{modal.customer.shipments}</Field>
            <Field label="Street / Office Address">{modal.customer.street}</Field>
            <Field label="City">{modal.customer.city}</Field>
            <Field label="State">{modal.customer.state}</Field>
            <Field label="Pincode">{modal.customer.pincode}</Field>
            <Field label="Country">{modal.customer.country}</Field>
            <Field label="Billing Address">{modal.customer.billingAddress}</Field>
            <Field label="Shipping Address">{modal.customer.shippingAddress}</Field>
            <Field label="Created">{fmtDate(modal.customer.createdAt)}</Field>
            <Field label="Notes">{modal.customer.notes}</Field>
          </div>
        </Modal>
      )}

      <CredentialsModal open={!!creds} onClose={() => setCreds(null)} role="Customer" userId={creds?.userId} password={creds?.password} name={creds?.name} />
    </MainShell>
  );
}