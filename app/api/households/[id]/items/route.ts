import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { listCurrentHousehold } from "@/lib/services/householdPantryService";

// Member-only — items with live stock (mirrors GET /api/items).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    return NextResponse.json(await listCurrentHousehold(householdId));
  } catch (err) {
    return errorResponse(err);
  }
}
