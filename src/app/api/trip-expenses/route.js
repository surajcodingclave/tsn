import { makeListCreate, toNumber } from "@/lib/crud";
import { TripExpense } from "@/lib/models";

export const { GET, POST } = makeListCreate({
  model: TripExpense,
  searchFields: ["trackingNumber", "note", "type"],
  filterFields: ["type"],
  populate: [{ path: "driverId", select: "name" }],
  allowedFields: ["trackingNumber", "driverId", "type", "amount", "note", "date"],
  coerce: { amount: toNumber, date: (v) => (v ? new Date(v) : new Date()) },
});