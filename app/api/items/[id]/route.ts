import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import { locationSchema } from "@/lib/schemas/shared";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const item = await userItemRepository.findById(userId, new ObjectId(id));
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    return errorResponse(err);
  }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  defaultUnit: z.string().min(1).optional(),
  defaultShelfLifeDays: z.number().int().positive().optional(),
  defaultLocation: locationSchema.optional(),
  thresholds: z.array(z.object({ unit: z.string().min(1), minQty: z.number().nonnegative() })).optional(),
});

// Settings screen edits — the one place editing a default doesn't need
// the "save as default" checkbox (docs/07-screens-mobile).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const itemId = new ObjectId(id);
    const body = patchSchema.parse(await req.json());
    const { thresholds, ...defaults } = body;

    if (Object.keys(defaults).length > 0) {
      await userItemRepository.updateDefaults(userId, itemId, defaults);
    }
    if (thresholds) {
      await userItemRepository.setThresholds(userId, itemId, thresholds);
    }
    const item = await userItemRepository.findById(userId, itemId);
    return NextResponse.json(item);
  } catch (err) {
    return errorResponse(err);
  }
}
