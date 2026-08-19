import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { addAllToPantry } from "@/lib/services/groceryListService";
import { objectIdSchema, locationSchema } from "@/lib/schemas/shared";

const bodySchema = z.object({
  rows: z.array(
    z.object({
      groceryListItemId: objectIdSchema,
      location: locationSchema.optional(),
      shelfLifeDays: z.number().int().positive().optional(),
    })
  ),
});

// Review mode's "Add all to pantry" — the online-order bulk-commit flow
// (docs/01-product-overview.md, docs/07-screens-mobile "Grocery List").
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { rows } = bodySchema.parse(await req.json());
    await addAllToPantry(userId, rows);
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    return errorResponse(err);
  }
}
