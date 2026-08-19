import { z } from "zod";
import { objectIdSchema, locationSchema } from "./shared";

export const globalItemSchema = z.object({
  _id: objectIdSchema,
  name: z.string().min(1),
  category: z.string().min(1),
  defaultUnit: z.string().min(1),
  defaultShelfLifeDays: z.number().int().positive(),
  defaultLocation: locationSchema,
  status: z.enum(["active", "pending"]).default("active"),
  createdAt: z.coerce.date(),
});

export const globalItemInputSchema = globalItemSchema.omit({
  _id: true,
  createdAt: true,
});

export type GlobalItem = z.infer<typeof globalItemSchema>;
export type GlobalItemInput = z.infer<typeof globalItemInputSchema>;
