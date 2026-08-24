import { z } from "zod";
import { objectIdSchema, locationSchema } from "./shared";
import { thresholdSchema, formSchema } from "./userItem";

// Mirrors userItem.ts exactly, scoped by householdId instead of userId.
// addedByUserId is provenance only (who added it) — access control is
// "is this user in household.memberIds", checked at the service layer.
export const householdItemSchema = z.object({
  _id: objectIdSchema,
  householdId: objectIdSchema,
  addedByUserId: objectIdSchema,
  name: z.string().min(1),
  category: z.string().min(1),
  globalItemId: objectIdSchema.nullable(),
  defaultUnit: z.string().min(1),
  defaultShelfLifeDays: z.number().int().positive(),
  defaultLocation: locationSchema,
  thresholds: z.array(thresholdSchema).default([]),
  forms: z.array(formSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const householdItemInputSchema = householdItemSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export type HouseholdItem = z.infer<typeof householdItemSchema>;
export type HouseholdItemInput = z.infer<typeof householdItemInputSchema>;
