import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { removeMember } from "@/lib/services/householdService";

// Owner-only. Can't remove the owner themself — see removeMember.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const requesterId = new ObjectId(await requireUserId());
    const { id, userId } = await params;
    await removeMember(requesterId, new ObjectId(id), new ObjectId(userId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
