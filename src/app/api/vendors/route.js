import { makeListCreate } from "@/lib/crud";
import { Vendor } from "@/lib/models";

export const { GET, POST } = makeListCreate({
  model: Vendor,
  searchFields: ["name", "phone", "email", "gstin", "address"],
  filterFields: ["type", "status"],
  allowedFields: ["name", "type", "phone", "email", "address", "gstin", "notes", "status"],
});