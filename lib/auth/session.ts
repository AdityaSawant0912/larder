import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/auth";

// Middleware already rejects unauthenticated requests before an API route
// runs, so a route calling this can trust the session exists.
export async function requireUserId(): Promise<string> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}
