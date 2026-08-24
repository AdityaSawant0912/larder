import { headers } from "next/headers";
import Link from "next/link";
import { getAuth } from "@/lib/auth/auth";
import { previewInvite } from "@/lib/services/householdInviteService";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { InviteJoinButton } from "@/components/invite-join-button";

// Public top-level route (outside the (app) auth-gated group) so an
// unauthenticated visitor can see what they're being invited to before
// signing in — the (app) layout's redirect-to-/login has no way to
// preserve the target URL, so this deep link needs its own auth check.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [auth, invite] = await Promise.all([getAuth(), previewInvite(token)]);
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Logo className="justify-center" markClassName="size-8" />

        {!invite ? (
          <p className="text-sm text-muted-foreground">This invite link is invalid or has been revoked.</p>
        ) : (
          <>
            <div className="space-y-1">
              <p className="font-display text-2xl">Join {invite.name}</p>
              <p className="text-sm text-muted-foreground">
                {invite.memberCount} member{invite.memberCount === 1 ? "" : "s"} already sharing this pantry.
              </p>
            </div>

            {session ? (
              <InviteJoinButton token={token} />
            ) : (
              <div className="space-y-2">
                <Button className="w-full" render={<Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} />}>
                  Sign in to join
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`} />}
                >
                  Create an account to join
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
