import { z } from "zod";
import { objectIdSchema } from "./shared";

export const groceryListItemSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  userItemId: objectIdSchema.nullable(),
  name: z.string().min(1),
  category: z.string().min(1),
  storeId: objectIdSchema.nullable(), // null = "Any"
  qty: z.number().positive(),
  unit: z.string().min(1),
  checked: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export const groceryListItemInputSchema = groceryListItemSchema.omit({
  _id: true,
  createdAt: true,
});

export type GroceryListItem = z.infer<typeof groceryListItemSchema>;
export type GroceryListItemInput = z.infer<typeof groceryListItemInputSchema>;
