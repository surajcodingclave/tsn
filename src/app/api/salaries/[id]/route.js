import { makeItem, toNumber, monthDate } from "@/lib/crud";
import { Salary } from "@/lib/models";

export const { PATCH, DELETE } = makeItem({
  model: Salary,
  allowedFields: ["driverId", "month", "base", "bonus", "deduction", "net", "paid", "paidOn", "notes"],
  coerce: { base: toNumber, bonus: toNumber, deduction: toNumber, net: toNumber, month: monthDate, paid: (v) => v === true || v === "true" },
});