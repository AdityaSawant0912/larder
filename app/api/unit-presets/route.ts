import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { unitPickerSource, learnUnit, listLearnedUnits } from "@/lib/services/unitPresetService";

// GET /api/unit-presets?category=produce&itemId=...  -> picker source for one category
// GET /api/unit-presets                              -> all of the user's learned units (Settings > User Units)
export async function GET(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const category = req.nextUrl.searchParams.get("category");
    if (!category) return NextResponse.json(await listLearnedUnits(userId));
    const itemIdParam = req.nextUrl.searchParams.get("itemId");
    const units = await unitPickerSource(
      userId,
      category,
      itemIdParam ? new ObjectId(itemIdParam) : undefined
    );
    return NextResponse.json({ units });
  } catch (err) {
    return errorResponse(err);
  }
}

const bodySchema = z.object({ category: z.string().min(1), unit: z.string().min(1) });

// "Other ->" manual entry writes back here so it's offered as a chip next
// time (docs/02-database-schema.md "Units — presets over free text").
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { category, unit } = bodySchema.parse(await req.json());
    await learnUnit(userId, category, unit);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
