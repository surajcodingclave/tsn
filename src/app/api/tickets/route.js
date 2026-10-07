import { makeListCreate } from "@/lib/crud";
import { Ticket } from "@/lib/models";

export const { GET, POST } = makeListCreate({
  model: Ticket,
  searchFields: ["subject", "message", "category"],
  filterFields: ["status", "priority"],
  allowedFields: ["subject", "message", "category", "priority", "status", "raisedBy"],
});