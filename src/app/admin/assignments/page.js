"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { DataTable } from "@/components/DataTable";
import { Button, Card, CardContent, Select, Label, Modal, StatusBadge } from "@/components/ui";

export default function AssignmentsPage() {
  const qc = useQueryClient();
  const [target, setTarget] = useState(null);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shipments-assign", "unassigned"],
    queryFn: async () => (await fetch("/api/shipments?assign=unassigned")).json(),
  });
  const { data: drivers } = useQuery({ queryKey: ["drivers-opt"], queryFn: async () => (await fetch("/api/drivers")).json() });
  const { data: vehicles } = useQuery({ queryKey: ["vehicles-opt"], queryFn: async () => (await fetch("/api/vehicles")).json() });

  const assign = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${target.trackingNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driverId || null, vehicleId: vehicleId || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shipments-assign"] }); setTarget(null); setDriverId(""); setVehicleId(""); },
    onError: (e) => alert(e.message),
  });

  const rows = data?.shipments || [];

  return (
    <MainShell role="admin">
      <DataTable
        title="Assignments"
        description="Unassigned shipments waiting for a driver and vehicle."
        columns={[
          { key: "trackingNumber", header: "Tracking" },
          { key: "customerId", header: "Client", render: (r) => r.customerId?.companyName || "—" },
          { key: "route", header: "Route", render: (r) => <span className="text-xs">{r.origin.address} → {r.destination.address}</span> },
          { key: "weight", header: "Weight", render: (r) => `${r.weight || 0} kg`, align: "right" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Search unassigned shipments…"
        emptyTitle="Everything is assigned"
        emptyDescription="No pending shipments need a driver right now."
        rowActions={(row) => (
          <Button size="sm" onClick={() => setTarget(row)}><UserPlus className="h-3.5 w-3.5" /> Assign</Button>
        )}
      />

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Assign — ${target?.trackingNumber || ""}`} footer={
        <>
          <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
          <Button loading={assign.isPending} onClick={() => assign.mutate()}>Assign</Button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <Label>Driver</Label>
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select driver</option>
              {drivers?.drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Vehicle</Label>
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Select vehicle</option>
              {vehicles?.vehicles?.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
            </Select>
          </div>
        </div>
      </Modal>
    </MainShell>
  );
}