import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { discardSelected } from "@/lib/services/householdClearOutService";
import { objectIdSchema } from "@/lib/schemas/shared";

const bodySchema = z.object({
  selections: z.array(z.object({ itemId: objectIdSchema, formId: objectIdSchema })),
});

// Household Pantry tab's Clear-Out mode — mirrors /api/clear-out/discard,
// member-only. No Restock equivalent for households (not requested).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const { selections } = bodySchema.parse(await req.json());
    await discardSelected(householdId, selections);
    return NextResponse.json({ ok: true, count: selections.length });
  } catch (err) {
    return errorResponse(err);
  }
}
