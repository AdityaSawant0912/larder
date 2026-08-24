import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { listForHousehold, addItem } from "@/lib/services/householdGroceryListService";
import { objectIdSchema } from "@/lib/schemas/shared";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    return NextResponse.json(await listForHousehold(householdId));
  } catch (err) {
    return errorResponse(err);
  }
}

const groceryAddSelectionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("global"), globalItemId: objectIdSchema }),
  z.object({ kind: z.literal("householdItem"), householdItemId: objectIdSchema }),
  z.object({ kind: z.literal("freeText"), name: z.string().min(1), category: z.string().min(1) }),
]);

const bodySchema = z.object({
  selection: groceryAddSelectionSchema,
  qty: z.number().positive(),
  unit: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const body = bodySchema.parse(await req.json());
    const item = await addItem(householdId, userId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
