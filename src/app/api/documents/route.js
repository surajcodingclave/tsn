import { makeListCreate, toNumber } from "@/lib/crud";
import { Document } from "@/lib/models";

export const { GET, POST } = makeListCreate({
  model: Document,
  searchFields: ["number", "trackingNumber", "partyName", "notes"],
  filterFields: ["type", "status"],
  allowedFields: ["type", "number", "trackingNumber", "partyName", "amount", "date", "status", "notes"],
  coerce: { amount: toNumber, date: (v) => (v ? new Date(v) : new Date()) },
});