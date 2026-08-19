import { z } from "zod";
import { objectIdSchema } from "./shared";

export const userUnitPresetSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  category: z.string().min(1),
  units: z.array(z.string().min(1)).default([]),
});

export const userUnitPresetInputSchema = userUnitPresetSchema.omit({ _id: true });

export type UserUnitPreset = z.infer<typeof userUnitPresetSchema>;
export type UserUnitPresetInput = z.infer<typeof userUnitPresetInputSchema>;
