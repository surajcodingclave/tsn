import { makeListCreate, toNumber } from "@/lib/crud";
import { Maintenance } from "@/lib/models";

export const { GET, POST } = makeListCreate({
  model: Maintenance,
  searchFields: ["description", "notes", "type"],
  filterFields: ["status", "type"],
  populate: [{ path: "vehicleId", select: "vehicleNumber type" }],
  allowedFields: ["vehicleId", "type", "description", "cost", "odometer", "date", "status", "notes"],
  coerce: { cost: toNumber, odometer: toNumber, date: (v) => (v ? new Date(v) : new Date()) },
});