import { z } from "zod";

// Split out from shared.ts so client components can import LOCATIONS
// without pulling in the mongodb driver (which shared.ts's objectIdSchema
// depends on) — that dependency broke client bundling (tls, timers/promises
// aren't available in the browser).
export const LOCATIONS = ["fridge", "freezer", "pantry", "counter"] as const;
export const locationSchema = z.enum(LOCATIONS);
export type Location = z.infer<typeof locationSchema>;
