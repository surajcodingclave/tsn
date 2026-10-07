"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, KeyRound, Trash2 } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, Input, EmptyState, FullLoader, StatusBadge, Badge, Modal, Th, Td } from "@/components/ui";

export default function AdminsList() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admins", q],
    queryFn: async () => (await fetch(`/api/superadmin/admins?q=${encodeURIComponent(q)}`)).json(),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }) =>
      fetch(`/api/superadmin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "active" ? "blocked" : "active" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
  });

  const remove = useMutation({
    mutationFn: async (id) => fetch(`/api/superadmin/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      setDeleting(null);
    },
  });

  return (
    <MainShell role="superadmin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Businesses / Admins</h1>
          <p className="text-muted-foreground">Create and manage tenant accounts.</p>
        </div>
        <Link href="/superadmin/admins/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add business
        </Link>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, User ID or email…" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        {isLoading ? (
          <FullLoader />
        ) : !data?.admins?.length ? (
          <CardContent>
            <EmptyState
              icon={Building2}
              title="No businesses yet"
              description="Add your first business to generate its admin login credentials."
              action={
                <Link href="/superadmin/admins/new" className="text-sm font-medium text-primary hover:underline">
                  Add a business →
                </Link>
              }
            />
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <Th>Business</Th>
                  <Th>User ID</Th>
                  <Th>Email</Th>
                  <Th>Location</Th>
                  <Th>Stats</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.admins.map((a) => (
                  <tr key={a.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {a.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain bg-white border border-border" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <Link href={`/superadmin/admins/${a.id}`} className="font-medium hover:underline">
                            {a.businessName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{a.contactPerson || "—"}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><span className="font-mono text-xs">{a.adminUserId}</span></Td>
                    <Td>{a.email}</Td>
                    <Td>{[a.city, a.state].filter(Boolean).join(", ") || "—"}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Badge tone="gray">{a.stats?.drivers} drv</Badge>
                        <Badge tone="gray">{a.stats?.customers} cus</Badge>
                        <Badge tone="gray">{a.stats?.shipments} shp</Badge>
                      </div>
                    </Td>
                    <Td><StatusBadge status={a.status} /></Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={toggleStatus.isPending}
                          onClick={() => toggleStatus.mutate({ id: a.id, status: a.status })}
                        >
                          {a.status === "active" ? "Block" : "Unblock"}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleting(a)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete business?"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(deleting.id)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This permanently removes <span className="font-medium text-foreground">{deleting?.businessName}</span> and its
          admins from the platform. Associated data is kept for audit but the account can no longer log in.
        </p>
      </Modal>
    </MainShell>
  );
}