import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getMongoClient } from "@/lib/db/connection";

async function buildAuth() {
  const client = await getMongoClient();
  return betterAuth({
    database: mongodbAdapter(client.db()),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      // TODO: wire a transactional email provider (Resend/Postmark) here
      // for verification + reset emails once one is picked (see
      // docs/04-architecture.md).
    },
    session: {
      cookieCache: {
        enabled: true,
      },
    },
  });
}

// Lazy + memoized: nothing connects to Mongo at import time (see
// lib/db/connection.ts for why that matters for `next build`).
let authPromise: ReturnType<typeof buildAuth> | undefined;

export function getAuth(): ReturnType<typeof buildAuth> {
  if (!authPromise) {
    authPromise = buildAuth();
  }
  return authPromise;
}
