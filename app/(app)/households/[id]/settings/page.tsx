"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, RefreshCw, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth/client";
import {
  useHousehold,
  useHouseholdInvite,
  useRegenerateInvite,
  useRemoveHouseholdMember,
  useLeaveHousehold,
  useDeleteHousehold,
} from "@/lib/queries/households";

export default function HouseholdSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: detail, isLoading } = useHousehold(id);
  const removeMember = useRemoveHouseholdMember();
  const leaveHousehold = useLeaveHousehold();
  const deleteHousehold = useDeleteHousehold();

  if (isLoading || !detail) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const { household, members } = detail;
  const isOwner = session?.user.id === household.ownerId;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.name || m.email}</p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {m.id === household.ownerId && <span className="text-xs text-muted-foreground">Owner</span>}
                {m.id !== household.ownerId && isOwner && (
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    aria-label="Remove member"
                    disabled={removeMember.isPending}
                    onClick={() => {
                      if (confirm(`Remove ${m.name || m.email} from ${household.name}?`)) {
                        removeMember.mutate({ householdId: id, userId: m.id });
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!isOwner && (
            <Button
              variant="outline"
              size="sm"
              disabled={leaveHousehold.isPending}
              onClick={() => {
                if (confirm(`Leave ${household.name}?`)) {
                  leaveHousehold.mutate(id, { onSuccess: () => router.push("/households") });
                }
              }}
            >
              <LogOut /> Leave household
            </Button>
          )}
        </CardContent>
      </Card>

      {isOwner && <InviteBox householdId={id} />}

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              disabled={deleteHousehold.isPending}
              onClick={() => {
                if (confirm("Delete this household? This removes its shared pantry and grocery list for everyone.")) {
                  deleteHousehold.mutate(id, { onSuccess: () => router.push("/households") });
                }
              }}
            >
              <Trash2 /> Delete household
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InviteBox({ householdId }: { householdId: string }) {
  const { data: invite } = useHouseholdInvite(householdId);
  const regenerate = useRegenerateInvite();

  const link = invite && typeof window !== "undefined" ? `${window.location.origin}/invite/${invite.token}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Invite link</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Input readOnly value={link} className="min-w-0 flex-1 font-mono text-xs" />
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Copy invite link"
          disabled={!link}
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast.success("Invite link copied");
          }}
        >
          <Copy />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Regenerate invite link"
          disabled={regenerate.isPending}
          onClick={() => regenerate.mutate(householdId)}
        >
          <RefreshCw />
        </Button>
      </CardContent>
    </Card>
  );
}
