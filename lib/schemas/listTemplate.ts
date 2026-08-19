import { z } from "zod";
import { objectIdSchema } from "./shared";

export const templateItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  storeId: objectIdSchema.nullable(),
  unit: z.string().min(1),
  qty: z.number().positive(),
});

export const listTemplateSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  name: z.string().min(1),
  items: z.array(templateItemSchema).default([]),
});

export const listTemplateInputSchema = listTemplateSchema.omit({ _id: true });

export type TemplateItem = z.infer<typeof templateItemSchema>;
export type ListTemplate = z.infer<typeof listTemplateSchema>;
export type ListTemplateInput = z.infer<typeof listTemplateInputSchema>;
