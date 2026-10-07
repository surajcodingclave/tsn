import { makeItem, toNumber } from "@/lib/crud";
import { Maintenance } from "@/lib/models";

export const { PATCH, DELETE } = makeItem({
  model: Maintenance,
  allowedFields: ["vehicleId", "type", "description", "cost", "odometer", "date", "status", "notes"],
  coerce: { cost: toNumber, odometer: toNumber, date: (v) => (v ? new Date(v) : new Date()) },
});