import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { userItemRepository } from "@/lib/repositories/userItemRepository";
import { listCurrentPantry } from "@/lib/services/pantryService";
import { createManualItem } from "@/lib/services/itemResolutionService";
import { locationSchema } from "@/lib/schemas/shared";

// GET /api/items            -> Home: only items with live stock
// GET /api/items?all=true   -> Settings/Catalog: every item ever touched
export async function GET(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const all = req.nextUrl.searchParams.get("all") === "true";
    const items = all ? await userItemRepository.findAllForUser(userId) : await listCurrentPantry(userId);
    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err);
  }
}

const createItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  defaultUnit: z.string().min(1),
  defaultShelfLifeDays: z.number().int().positive(),
  defaultLocation: locationSchema,
});

// Settings/Catalog "add a new catalog item" — no form, just identity +
// defaults (docs/02: "an item can exist with forms: []").
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const body = createItemSchema.parse(await req.json());
    const item = await createManualItem(userId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
