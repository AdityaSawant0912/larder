import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: err.issues }, { status: 400 });
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  const status = message === "Unauthorized" ? 401 : message.includes("not found") ? 404 : 500;
  return NextResponse.json({ error: message }, { status });
}
