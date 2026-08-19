import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { discardSelected } from "@/lib/services/clearOutService";
import { objectIdSchema } from "@/lib/schemas/shared";

const bodySchema = z.object({
  selections: z.array(z.object({ itemId: objectIdSchema, formId: objectIdSchema })),
});

// Clear-Out's "Discard N items" — one transaction, no confirmation step
// (docs/07-screens-mobile "Clear-Out mode": low-stakes, reversible by
// re-adding).
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { selections } = bodySchema.parse(await req.json());
    await discardSelected(userId, selections);
    return NextResponse.json({ ok: true, count: selections.length });
  } catch (err) {
    return errorResponse(err);
  }
}
