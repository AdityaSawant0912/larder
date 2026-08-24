import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { resolveAndAddForm } from "@/lib/services/householdPantryService";
import { householdItemSelectionSchema } from "@/lib/schemas/householdSelection";
import { locationSchema } from "@/lib/schemas/shared";

const bodySchema = z.object({
  selection: householdItemSelectionSchema,
  unit: z.string().min(1),
  qty: z.number().positive(),
  location: locationSchema,
  shelfLifeDays: z.number().int().positive(),
  note: z.string().optional(),
  saveAsDefault: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const body = bodySchema.parse(await req.json());
    const { selection, ...input } = body;
    const result = await resolveAndAddForm(householdId, userId, selection, input);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
