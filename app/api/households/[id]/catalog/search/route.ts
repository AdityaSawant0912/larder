import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { requireHousehold, assertMember } from "@/lib/services/householdService";
import { searchHouseholdCatalog } from "@/lib/services/householdItemResolutionService";

// GET /api/households/[id]/catalog/search?q=... — typeahead across the
// global catalog + this household's own items (mirrors /api/catalog/search).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const householdId = new ObjectId(id);
    assertMember(await requireHousehold(householdId), userId);
    const q = req.nextUrl.searchParams.get("q") ?? "";
    if (!q.trim()) return NextResponse.json({ globalMatches: [], householdMatches: [] });
    const results = await searchHouseholdCatalog(householdId, q);
    return NextResponse.json(results);
  } catch (err) {
    return errorResponse(err);
  }
}
