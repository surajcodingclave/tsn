import { makeListCreate, toNumber, monthDate } from "@/lib/crud";
import { Salary } from "@/lib/models";

export const { GET, POST } = makeListCreate({
  model: Salary,
  searchFields: ["notes"],
  filterFields: ["paid"],
  populate: [{ path: "driverId", select: "name phone driverUserId" }],
  allowedFields: ["driverId", "month", "base", "bonus", "deduction", "net", "paid", "paidOn", "notes"],
  coerce: { base: toNumber, bonus: toNumber, deduction: toNumber, net: toNumber, month: monthDate, paid: (v) => v === true || v === "true" },
});