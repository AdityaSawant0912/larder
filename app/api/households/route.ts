import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { listForUser, createHousehold } from "@/lib/services/householdService";

export async function GET() {
  try {
    const userId = new ObjectId(await requireUserId());
    return NextResponse.json(await listForUser(userId));
  } catch (err) {
    return errorResponse(err);
  }
}

const bodySchema = z.object({ name: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const { name } = bodySchema.parse(await req.json());
    const household = await createHousehold(userId, name);
    return NextResponse.json(household, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
