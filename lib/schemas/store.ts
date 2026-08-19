import { z } from "zod";
import { objectIdSchema } from "./shared";

export const globalStoreSchema = z.object({
  _id: objectIdSchema,
  name: z.string().min(1),
});
export const globalStoreInputSchema = globalStoreSchema.omit({ _id: true });

export const userStoreSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  name: z.string().min(1),
  globalStoreId: objectIdSchema.nullable(),
});
export const userStoreInputSchema = userStoreSchema.omit({ _id: true });

export type GlobalStore = z.infer<typeof globalStoreSchema>;
export type GlobalStoreInput = z.infer<typeof globalStoreInputSchema>;
export type UserStore = z.infer<typeof userStoreSchema>;
export type UserStoreInput = z.infer<typeof userStoreInputSchema>;
