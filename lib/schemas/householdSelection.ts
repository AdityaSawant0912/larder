import { z } from "zod";
import { objectIdSchema, locationSchema } from "./shared";

// Mirrors selection.ts's itemSelectionSchema, swapping "userItem" for
// "householdItem" — same "how was this item resolved" shape at the API
// boundary, for household pantry/grocery-list adds.
export const householdItemSelectionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("global"), globalItemId: objectIdSchema }),
  z.object({ kind: z.literal("householdItem"), householdItemId: objectIdSchema }),
  z.object({
    kind: z.literal("manual"),
    manual: z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      defaultUnit: z.string().min(1),
      defaultShelfLifeDays: z.number().int().positive(),
      defaultLocation: locationSchema,
    }),
  }),
]);

export type HouseholdItemSelectionDTO = z.infer<typeof householdItemSelectionSchema>;
