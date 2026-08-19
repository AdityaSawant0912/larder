import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { applyTemplate } from "@/lib/services/templateService";

// "Repeat list" — drops a saved template into a new grocery list in one
// action (docs/01-product-overview.md).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { id } = await params;
    await applyTemplate(userId, new ObjectId(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
