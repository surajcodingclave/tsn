import { makeItem } from "@/lib/crud";
import { Vendor } from "@/lib/models";

export const { PATCH, DELETE } = makeItem({
  model: Vendor,
  allowedFields: ["name", "type", "phone", "email", "address", "gstin", "notes", "status"],
});