import { makeItem, toNumber } from "@/lib/crud";
import { Document } from "@/lib/models";

export const { PATCH, DELETE } = makeItem({
  model: Document,
  allowedFields: ["type", "number", "trackingNumber", "partyName", "amount", "date", "status", "notes"],
  coerce: { amount: toNumber, date: (v) => (v ? new Date(v) : new Date()) },
});