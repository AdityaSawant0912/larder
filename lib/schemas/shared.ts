import { z } from "zod";
import { ObjectId } from "mongodb";

// Accepts either a Mongo ObjectId instance or its 24-char hex string —
// repository layer passes ObjectId, API boundary passes string.
export const objectIdSchema = z
  .union([z.instanceof(ObjectId), z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")])
  .transform((val) => (val instanceof ObjectId ? val : new ObjectId(val)));

export const LOCATIONS = ["fridge", "freezer", "pantry", "counter"] as const;
export const locationSchema = z.enum(LOCATIONS);
export type Location = z.infer<typeof locationSchema>;
