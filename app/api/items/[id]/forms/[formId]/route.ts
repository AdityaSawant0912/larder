import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { consumeForm, convertForm, deleteForm } from "@/lib/services/pantryService";
import { locationSchema } from "@/lib/schemas/shared";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("consume"), qty: z.number().positive() }),
  z.object({
    action: z.literal("convert"),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id, formId } = await params;
    const itemId = new ObjectId(id);
    const fId = new ObjectId(formId);
    const body = patchSchema.parse(await req.json());

    if (body.action === "consume") {
      await consumeForm(userId, itemId, fId, body.qty);
    } else {
      await convertForm(userId, itemId, fId, body.outputs);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id, formId } = await params;
    await deleteForm(userId, new ObjectId(id), new ObjectId(formId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
