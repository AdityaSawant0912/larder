import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { errorResponse } from "@/lib/api/respond";
import { listTemplatesForUser, createTemplate } from "@/lib/services/templateService";
import { objectIdSchema } from "@/lib/schemas/shared";

export async function GET() {
  try {
    const userId = new ObjectId(await requireUserId());
    return NextResponse.json(await listTemplatesForUser(userId));
  } catch (err) {
    return errorResponse(err);
  }
}

const bodySchema = z.object({
  name: z.string().min(1),
  items: z.array(
    z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      storeId: objectIdSchema.nullable(),
      unit: z.string().min(1),
      qty: z.number().positive(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const userId = new ObjectId(await requireUserId());
    const body = bodySchema.parse(await req.json());
    const template = await createTemplate(userId, body.name, body.items);
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
