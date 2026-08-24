import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { regenerateInvite } from "@/lib/services/householdInviteService";

// Owner-only. Revokes the old link and issues a new token.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const invite = await regenerateInvite(userId, new ObjectId(id));
    return NextResponse.json(invite);
  } catch (err) {
    return errorResponse(err);
  }
}
