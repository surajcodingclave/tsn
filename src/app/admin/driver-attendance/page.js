"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, CalendarDays } from "lucide-react";
import { MainShell } from "@/components/layout/MainShell";
import { Button, Card, CardContent, Input, Select, FullLoader, EmptyState, StatusBadge, Th, Td } from "@/components/ui";

const today = () => new Date().toISOString().slice(0, 10);

export default function DriverAttendance() {
  const qc = useQueryClient();
  const [date, setDate] = useState(today());

  const { data: drivers, isLoading: loadingDrivers } = useQuery({
    queryKey: ["drivers-att"],
    queryFn: async () => (await fetch("/api/drivers")).json(),
  });
  const { data: att, isLoading: loadingAtt } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => (await fetch(`/api/driver-attendance?date=${date}`)).json(),
  });

  const attMap = {};
  (att?.records || []).forEach((r) => { attMap[r.driverId?._id] = { status: r.status, checkIn: r.checkIn, checkOut: r.checkOut }; });

  const [form, setForm] = useState(() => ({}));

  const save = useMutation({
    mutationFn: async () => {
      const entries = (drivers?.drivers || []).map((d) => {
        const s = form[d.id]?.status || attMap[d.id]?.status || "present";
        const checkIn = form[d.id]?.checkIn ?? attMap[d.id]?.checkIn ?? "";
        const checkOut = form[d.id]?.checkOut ?? attMap[d.id]?.checkOut ?? "";
        return { driverId: d.id, status: s, checkIn, checkOut };
      });
      const res = await fetch("/api/driver-attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, entries }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      alert("Attendance saved");
    },
    onError: (e) => alert(e.message),
  });

  const setCell = (id, key, value) => setForm((f) => ({ ...f, [id]: { ...(f[id] || {}), [key]: value } }));

  if (loadingDrivers || loadingAtt) return <MainShell role="admin"><FullLoader /></MainShell>;

  return (
    <MainShell role="admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardCheck className="h-6 w-6" /> Driver Attendance</h1><p className="text-muted-foreground">Mark driver presence for a date.</p></div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Button onClick={() => save.mutate()} loading={save.isPending}>Save day</Button>
        </div>
      </div>

      {!drivers?.drivers?.length ? (
        <Card><CardContent><EmptyState icon={ClipboardCheck} title="No drivers to mark" description="Add drivers first." /></CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border"><tr><Th>Driver</Th><Th>Status</Th><Th>Check-in</Th><Th>Check-out</Th></tr></thead>
              <tbody className="divide-y divide-border">
                {drivers.drivers.map((d) => {
                  const st = form[d.id]?.status || attMap[d.id]?.status || "present";
                  const ci = form[d.id]?.checkIn ?? attMap[d.id]?.checkIn ?? "09:00";
                  const co = form[d.id]?.checkOut ?? attMap[d.id]?.checkOut ?? "18:00";
                  return (
                    <tr key={d.id}>
                      <Td><p className="font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.phone || "—"}</p></Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Select value={st} onChange={(e) => setCell(d.id, "status", e.target.value)} className="w-auto">
                            <option value="present">Present</option><option value="absent">Absent</option><option value="leave">On leave</option>
                          </Select>
                          <StatusBadge status={st} />
                        </div>
                      </Td>
                      <Td><Input type="time" value={ci} onChange={(e) => setCell(d.id, "checkIn", e.target.value)} className="w-auto" /></Td>
                      <Td><Input type="time" value={co} onChange={(e) => setCell(d.id, "checkOut", e.target.value)} className="w-auto" /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </MainShell>
  );
}