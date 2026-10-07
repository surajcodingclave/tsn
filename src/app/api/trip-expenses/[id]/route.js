import { makeItem, toNumber } from "@/lib/crud";
import { TripExpense } from "@/lib/models";

export const { PATCH, DELETE } = makeItem({
  model: TripExpense,
  allowedFields: ["trackingNumber", "driverId", "type", "amount", "note", "date"],
  coerce: { amount: toNumber, date: (v) => (v ? new Date(v) : new Date()) },
});