import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { getOrCreateActiveInvite } from "@/lib/services/householdInviteService";

// Owner-only. Lazily creates the household's one active invite link.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const invite = await getOrCreateActiveInvite(userId, new ObjectId(id));
    return NextResponse.json(invite);
  } catch (err) {
    return errorResponse(err);
  }
}
