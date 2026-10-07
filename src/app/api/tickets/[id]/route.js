import { makeItem } from "@/lib/crud";
import { Ticket } from "@/lib/models";

export const { PATCH, DELETE } = makeItem({
  model: Ticket,
  allowedFields: ["subject", "message", "category", "priority", "status", "raisedBy"],
});