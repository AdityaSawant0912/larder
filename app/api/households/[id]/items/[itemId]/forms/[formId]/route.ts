import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { consumeForm, convertForm, deleteForm } from "@/lib/services/householdPantryService";
import { locationSchema } from "@/lib/schemas/shared";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("consume"), qty: z.number().positive() }),
  z.object({
    action: z.literal("convert"),
    qty: z.number().positive(),
    outputs: z.array(
      z.object({
        unit: z.string().min(1),
        qty: z.number().positive(),
        location: locationSchema,
        shelfLifeDays: z.number().int().positive(),
        note: z.string().optional(),
      })
    ),
  }),
]);

// Mirrors app/api/items/[id]/forms/[formId]/route.ts, member-only.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; formId: string }> }
) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id, itemId, formId } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const iId = new ObjectId(itemId);
    const fId = new ObjectId(formId);
    const body = patchSchema.parse(await req.json());

    if (body.action === "consume") {
      await consumeForm(householdId, iId, fId, body.qty);
    } else {
      await convertForm(householdId, iId, fId, body.qty, body.outputs);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; formId: string }> }
) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id, itemId, formId } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    await deleteForm(householdId, new ObjectId(itemId), new ObjectId(formId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
