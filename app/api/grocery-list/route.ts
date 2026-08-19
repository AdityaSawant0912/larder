import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { listForUser, addItem } from "@/lib/services/groceryListService";
import { objectIdSchema } from "@/lib/schemas/shared";

export async function GET() {
  try {
    const userId = new ObjectId(await requireUserId());
    return NextResponse.json(await listForUser(userId));
  } catch (err) {
    return errorResponse(err);
  }
}

const groceryAddSelectionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("global"), globalItemId: objectIdSchema }),
  z.object({ kind: z.literal("userItem"), userItemId: objectIdSchema }),
  z.object({ kind: z.literal("freeText"), name: z.string().min(1), category: z.string().min(1) }),
]);

const bodySchema = z.object({
  selection: groceryAddSelectionSchema,
  qty: z.number().positive(),
  unit: z.string().min(1),
  storeId: objectIdSchema.nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const body = bodySchema.parse(await req.json());
    const item = await addItem(userId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
