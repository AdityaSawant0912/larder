import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { deleteTemplate } from "@/lib/services/templateService";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    await deleteTemplate(userId, new ObjectId(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
