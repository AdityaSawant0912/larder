import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { commitQueue } from "@/lib/services/restockService";
import { itemSelectionSchema } from "@/lib/schemas/selection";
import { locationSchema } from "@/lib/schemas/shared";

const bodySchema = z.object({
  queue: z.array(
    z.object({
      selection: itemSelectionSchema,
      unit: z.string().min(1),
      qty: z.number().positive(),
      location: locationSchema,
      shelfLifeDays: z.number().int().positive(),
      note: z.string().optional(),
    })
  ),
});

// Restock's "Add N to pantry" — commits the whole staging queue in one
// transaction (docs/07-screens-mobile "Restock mode").
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { queue } = bodySchema.parse(await req.json());
    await commitQueue(userId, queue);
    return NextResponse.json({ ok: true, count: queue.length });
  } catch (err) {
    return errorResponse(err);
  }
}
