import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { searchCatalog } from "@/lib/services/itemResolutionService";

// GET /api/catalog/search?q=... — typeahead across global + user catalogs
// (docs/03-resolution-flows.md step 1-3).
export async function GET(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const q = req.nextUrl.searchParams.get("q") ?? "";
    if (!q.trim()) return NextResponse.json({ globalMatches: [], userMatches: [] });
    const results = await searchCatalog(userId, q);
    return NextResponse.json(results);
  } catch (err) {
    return errorResponse(err);
  }
}
