import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { toggleChecked, deleteItem } from "@/lib/services/householdGroceryListService";

const patchSchema = z.object({ checked: z.boolean() });

// Checklist mode's strike-through toggle — doesn't touch the pantry.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id, itemId } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const { checked } = patchSchema.parse(await req.json());
    await toggleChecked(householdId, new ObjectId(itemId), checked);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id, itemId } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    await deleteItem(householdId, new ObjectId(itemId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
