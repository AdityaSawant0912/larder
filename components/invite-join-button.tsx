"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api/client";

export function InviteJoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleJoin() {
    setPending(true);
    try {
      const { householdId } = await apiPost<{ householdId: string }>(`/api/invites/${token}/accept`);
      router.push(`/households/${householdId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join household");
      setPending(false);
    }
  }

  return (
    <Button className="w-full" disabled={pending} onClick={handleJoin}>
      {pending ? "Joining..." : "Join household"}
    </Button>
  );
}
