import { createAuthClient } from "better-auth/react";

// No baseURL — this always runs client-side (web tab or the native app's
// WebView, wherever Settings > Debug pointed it), so requests should stay
// relative to whatever origin the page actually loaded from. A hardcoded
// baseURL previously sent every environment's sign-in request to
// localhost:3000: `process.env.BETTER_AUTH_URL` (no NEXT_PUBLIC_ prefix)
// is never inlined into the browser bundle, so it was always undefined
// here and the "|| localhost:3000" fallback fired unconditionally,
// including in production.
export const authClient = createAuthClient({});

export const { signIn, signOut, signUp, useSession } = authClient;
