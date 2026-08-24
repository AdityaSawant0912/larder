import { z } from "zod";
import { objectIdSchema } from "./shared";

// Mirrors groceryList.ts, scoped by householdId. No storeId — userStores
// are personal, not shared, so household grocery items are always "Any".
export const householdGroceryListItemSchema = z.object({
  _id: objectIdSchema,
  householdId: objectIdSchema,
  addedByUserId: objectIdSchema,
  householdItemId: objectIdSchema.nullable(),
  name: z.string().min(1),
  category: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  checked: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export const householdGroceryListItemInputSchema = householdGroceryListItemSchema.omit({
  _id: true,
  createdAt: true,
});

export type HouseholdGroceryListItem = z.infer<typeof householdGroceryListItemSchema>;
export type HouseholdGroceryListItemInput = z.infer<typeof householdGroceryListItemInputSchema>;
