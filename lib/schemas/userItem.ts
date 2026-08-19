import { z } from "zod";
import { objectIdSchema, locationSchema } from "./shared";

export const thresholdSchema = z.object({
  unit: z.string().min(1),
  minQty: z.number().nonnegative(),
});

export const formSchema = z.object({
  id: objectIdSchema,
  unit: z.string().min(1),
  qty: z.number().positive(),
  note: z.string().optional(),
  location: locationSchema,
  addedDate: z.coerce.date(),
  shelfLifeDays: z.number().int().positive(),
});

export const userItemSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
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

// Input for creating a new userItem — server assigns _id/timestamps.
export const userItemInputSchema = userItemSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

// Input for adding a single form to an existing userItem.
export const formInputSchema = formSchema.omit({ id: true });

export type Threshold = z.infer<typeof thresholdSchema>;
export type Form = z.infer<typeof formSchema>;
export type UserItem = z.infer<typeof userItemSchema>;
export type UserItemInput = z.infer<typeof userItemInputSchema>;
export type FormInput = z.infer<typeof formInputSchema>;
