import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { addAllToPantry } from "@/lib/services/householdGroceryListService";
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

// Household's "Add all to pantry" — lands in householdItems, visible to
// every member (mirrors POST /api/grocery-list/add-to-pantry).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const { rows } = bodySchema.parse(await req.json());
    await addAllToPantry(householdId, userId, rows);
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    return errorResponse(err);
  }
}
