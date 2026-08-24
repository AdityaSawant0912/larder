import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { acceptInvite } from "@/lib/services/householdInviteService";

// Idempotent — accepting twice just no-ops the $addToSet.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { token } = await params;
    const result = await acceptInvite(userId, token);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
