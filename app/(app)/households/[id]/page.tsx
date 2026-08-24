"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, RefreshCw, Trash2, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HouseholdGroceryAddDialog } from "@/components/household-grocery-add-dialog";
import { useSession } from "@/lib/auth/client";
import {
  useHousehold,
  useHouseholdInvite,
  useRegenerateInvite,
  useRemoveHouseholdMember,
  useLeaveHousehold,
  useDeleteHousehold,
  useHouseholdGroceryList,
  useToggleHouseholdGroceryChecked,
  useDeleteHouseholdGroceryItem,
  useAddAllToHouseholdPantry,
} from "@/lib/queries/households";
import { cn } from "@/lib/utils";

type ListMode = "checklist" | "review";

export default function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: detail, isLoading } = useHousehold(id);
  const removeMember = useRemoveHouseholdMember();
  const leaveHousehold = useLeaveHousehold();
  const deleteHousehold = useDeleteHousehold();

  if (isLoading || !detail) {
    return <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">Loading...</div>;
  }

  const { household, members } = detail;
  const isOwner = session?.user.id === household.ownerId;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{household.name}</h1>
        {isOwner && (
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteHousehold.isPending}
            onClick={() => {
              if (confirm("Delete this household? This removes its shared pantry and grocery list for everyone.")) {
                deleteHousehold.mutate(id, { onSuccess: () => router.push("/households") });
              }
            }}
          >
            <Trash2 /> Delete household
          </Button>
        )}
      </div>

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

      <HouseholdGroceryList householdId={id} />
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

function HouseholdGroceryList({ householdId }: { householdId: string }) {
  const { data: items } = useHouseholdGroceryList(householdId);
  const toggleChecked = useToggleHouseholdGroceryChecked(householdId);
  const deleteItem = useDeleteHouseholdGroceryItem(householdId);
  const addAllToPantry = useAddAllToHouseholdPantry(householdId);

  const [listMode, setListMode] = useState<ListMode>("checklist");
  const [addOpen, setAddOpen] = useState(false);
  const [reviewSelection, setReviewSelection] = useState<Set<string>>(new Set());

  function toggleReviewSelect(id: string) {
    setReviewSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAddAllToPantry() {
    await addAllToPantry.mutateAsync([...reviewSelection].map((id) => ({ groceryListItemId: id })));
    setReviewSelection(new Set());
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">Shared grocery list</h2>
        <div className="flex items-center gap-2">
          <Tabs value={listMode} onValueChange={(v) => setListMode(v as ListMode)}>
            <TabsList>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Plus /> Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {(items ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing on the shared list yet.</p>
        ) : (
          (items ?? []).map((item) => (
            <div key={item._id} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
              {listMode === "checklist" ? (
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(c) => toggleChecked.mutate({ id: item._id, checked: c === true })}
                />
              ) : (
                <Checkbox checked={reviewSelection.has(item._id)} onCheckedChange={() => toggleReviewSelect(item._id)} />
              )}
              <div className={cn("min-w-0 flex-1", listMode === "checklist" && item.checked && "text-muted-foreground line-through")}>
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {item.qty} {item.unit}
                </p>
              </div>
              {listMode === "checklist" && (
                <Button variant="destructive" size="icon-xs" aria-label="Remove" onClick={() => deleteItem.mutate(item._id)}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))
        )}

        {listMode === "review" && reviewSelection.size > 0 && (
          <Button className="w-full" disabled={addAllToPantry.isPending} onClick={handleAddAllToPantry}>
            Add {reviewSelection.size} to household pantry
          </Button>
        )}
      </div>

      <HouseholdGroceryAddDialog householdId={householdId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
