"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { Button, Card, CardContent, Input, Label, Select, Textarea, Modal, StatusBadge } from "@/components/ui";

/**
 * Generic CRUD screen: DataTable + auto form modal. Real API backed.
 *
 * props:
 *  role, endpoint, title, description, columns ({(row,helpers)=>...} may use rowActions helper),
 *  formFields: [{ name, label, type, options?, required?, defaultValue?, colSpan? }]
 *  filters: [{ key, label, options:[{value,label}] }]  (sent to API as query params)
 *  newLabel, emptyTitle, emptyDescription, searchPlaceholder
 *  rowActionsExtra: (row) => ReactNode  (rendered alongside edit/delete)
 *  defaults: {} extra defaults for new records
 */
export function ResourceManager({
  role = "admin",
  endpoint,
  title,
  description,
  columns,
  formFields = [],
  filters = [],
  newLabel = "Add new",
  emptyTitle = "No records yet",
  emptyDescription = "Create the first record.",
  searchPlaceholder = "Search…",
  rowActionsExtra,
  defaults = {},
  badgeKeys = ["status"],
  readonlyOnEdit = [],
  fixedQuery = {},
  pickItems = (d) => d.items,
  allowDelete = true,
  allowCreate = true,
  onCreated,
}) {
  const qc = useQueryClient();
  const [filterState, setFilterState] = useState(Object.fromEntries(filters.map((f) => [f.key, ""])));
  const [modal, setModal] = useState(null); // "new" | row
  const [form, setForm] = useState({});

  const qs = new URLSearchParams({ ...fixedQuery, ...Object.fromEntries(Object.entries(filterState).filter(([, v]) => v)) }).toString();
  const { data, isLoading } = useQuery({
    queryKey: [endpoint, fixedQuery, filterState],
    queryFn: async () => (await fetch(`${endpoint}${qs ? `?${qs}` : ""}`)).json(),
  });
  const rows = (data ? pickItems(data) : []) || [];

  const invalidate = () => qc.invalidateQueries({ queryKey: [endpoint] });

  const save = useMutation({
    mutationFn: async () => {
      const isEdit = modal && modal !== "new";
      const res = await fetch(isEdit ? `${endpoint}/${modal._id}` : endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Save failed");
      return { data: d, created: !(modal && modal !== "new") };
    },
    onSuccess: (res) => { invalidate(); setModal(null); if (res.created && onCreated) onCreated(res.data); },
    onError: (e) => alert(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id) => fetch(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const openNew = () => {
    const init = {};
    formFields.forEach((f) => { init[f.name] = f.defaultValue ?? ""; });
    setForm({ ...init, ...defaults });
    setModal("new");
  };

  const openEdit = (row) => {
    const init = {};
    formFields.forEach((f) => {
      let v = row[f.name];
      if (v && typeof v === "object" && v._id) v = String(v._id); // populated ref -> id
      if (f.type === "date" && v) v = new Date(v).toISOString().slice(0, 10);
      init[f.name] = v ?? "";
    });
    setForm(init);
    setModal(row);
  };

  // keep all real columns; only append a badge column when it isn't already present
  const badgeColumns = badgeKeys
    .filter((k) => !columns.some((col) => col.key === k))
    .map((k) => ({
      key: `_badge_${k}`,
      header: k,
      render: (row) => (row[k] != null ? <StatusBadge status={row[k]} /> : "—"),
    }));
  const displayColumns = [...columns, ...badgeColumns];

  return (
    <MainShell role={role}>
      <div className="mb-6">
        <DataTable
          title={title}
          description={description}
          columns={displayColumns}
          data={rows}
          loading={isLoading}
          searchPlaceholder={searchPlaceholder}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          filters={filters.map((f) => ({ ...f, value: filterState[f.key], onChange: (v) => setFilterState((s) => ({ ...s, [f.key]: v })) }))}
          toolbar={allowCreate ? <Button onClick={openNew}><Plus className="h-4 w-4" /> {newLabel}</Button> : null}
          rowActions={(row) => (
            <>
              {rowActionsExtra && rowActionsExtra(row)}
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
              {allowDelete && <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this record?")) remove.mutate(row._id); }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
            </>
          )}
        />
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "new" ? `New — ${title}` : `Edit — ${title}`} footer={
        <>
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>{modal === "new" ? "Create" : "Save"}</Button>
        </>
      }>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formFields.map((f) => {
            const disabled = typeof modal === "object" && readonlyOnEdit.includes(f.name);
            return (
              <div key={f.name} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
                <Label>{f.label}{f.required ? " *" : ""}</Label>
                {f.type === "select" ? (
                  <Select value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} disabled={disabled}>
                    {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} disabled={disabled} />
                ) : (
                  <Input type={f.type || "text"} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} disabled={disabled} />
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </MainShell>
  );
}