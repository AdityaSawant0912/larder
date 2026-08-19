import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { resolveAndAddForm } from "@/lib/services/pantryService";
import { itemSelectionSchema } from "@/lib/schemas/selection";
import { locationSchema } from "@/lib/schemas/shared";

const bodySchema = z.object({
  selection: itemSelectionSchema,
  unit: z.string().min(1),
  qty: z.number().positive(),
  location: locationSchema,
  shelfLifeDays: z.number().int().positive(),
  note: z.string().optional(),
  saveAsDefault: z.boolean().optional(),
});

// Home's main add path: search -> catalog match -> instance
// (docs/03-resolution-flows.md).
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const body = bodySchema.parse(await req.json());
    const { selection, ...input } = body;
    const result = await resolveAndAddForm(userId, selection, input);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
