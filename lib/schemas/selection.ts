import { z } from "zod";
import { objectIdSchema, locationSchema } from "./shared";

// Shared "how was this item resolved" shape used at the API boundary for
// both pantry adds and grocery-list adds (docs/03-resolution-flows.md).
export const itemSelectionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("global"), globalItemId: objectIdSchema }),
  z.object({ kind: z.literal("userItem"), userItemId: objectIdSchema }),
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

export type ItemSelectionDTO = z.infer<typeof itemSelectionSchema>;
