import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export async function GET(req: NextRequest) {
  const { GET: handler } = toNextJsHandler(await getAuth());
  return handler(req);
}

export async function POST(req: NextRequest) {
  const { POST: handler } = toNextJsHandler(await getAuth());
  return handler(req);
}
