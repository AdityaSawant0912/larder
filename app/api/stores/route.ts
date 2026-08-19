import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { userStoreRepository } from "@/lib/repositories/storeRepository";
import { searchStores, resolveGlobalStore, createPersonalStore } from "@/lib/services/storeResolutionService";
import { objectIdSchema } from "@/lib/schemas/shared";

// GET /api/stores?q=...  -> search (global + user)
// GET /api/stores        -> the user's linked/personal store list
export async function GET(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const q = req.nextUrl.searchParams.get("q");
    if (q) return NextResponse.json(await searchStores(userId, q));
    return NextResponse.json(await userStoreRepository.findAllForUser(userId));
  } catch (err) {
    return errorResponse(err);
  }
}

const bodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("global"), globalStoreId: objectIdSchema }),
  z.object({ kind: z.literal("personal"), name: z.string().min(1) }),
]);

// docs/03-resolution-flows.md "Store resolution" — link an existing
// global store or add a personal one, no copy step either way.
export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const body = bodySchema.parse(await req.json());
    const store =
      body.kind === "global"
        ? await resolveGlobalStore(userId, body.globalStoreId)
        : await createPersonalStore(userId, body.name);
    return NextResponse.json(store, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
