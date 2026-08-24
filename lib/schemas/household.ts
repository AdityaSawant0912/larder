import { z } from "zod";
import { objectIdSchema } from "./shared";

export const householdSchema = z.object({
  _id: objectIdSchema,
  name: z.string().min(1),
  ownerId: objectIdSchema,
  memberIds: z.array(objectIdSchema).min(1), // includes ownerId
  createdAt: z.coerce.date(),
});

export const householdInputSchema = householdSchema.omit({
  _id: true,
  createdAt: true,
});

export const householdInviteSchema = z.object({
  _id: objectIdSchema,
  householdId: objectIdSchema,
  token: z.string().min(1),
  createdByUserId: objectIdSchema,
  createdAt: z.coerce.date(),
  revoked: z.boolean().default(false),
});

export const householdInviteInputSchema = householdInviteSchema.omit({
  _id: true,
  createdAt: true,
});

export type Household = z.infer<typeof householdSchema>;
export type HouseholdInput = z.infer<typeof householdInputSchema>;
export type HouseholdInvite = z.infer<typeof householdInviteSchema>;
export type HouseholdInviteInput = z.infer<typeof householdInviteInputSchema>;
