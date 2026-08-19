import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { toggleChecked, deleteItem } from "@/lib/services/groceryListService";

const patchSchema = z.object({ checked: z.boolean() });

// Checklist mode's strike-through toggle — doesn't touch the pantry
// (docs/07-screens-mobile "Grocery List").
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const { checked } = patchSchema.parse(await req.json());
    await toggleChecked(userId, new ObjectId(id), checked);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    await deleteItem(userId, new ObjectId(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
