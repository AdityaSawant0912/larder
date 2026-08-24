import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { getHouseholdDetail, deleteHousehold } from "@/lib/services/householdService";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    const detail = await getHouseholdDetail(userId, new ObjectId(id));
    return NextResponse.json(detail);
  } catch (err) {
    return errorResponse(err);
  }
}

// Owner-only, cascades: household items, grocery items, invite.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    await deleteHousehold(userId, new ObjectId(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
