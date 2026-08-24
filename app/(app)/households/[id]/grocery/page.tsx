"use client";

import { use, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HouseholdGroceryAddDialog } from "@/components/household-grocery-add-dialog";
import { FloatingAddButton } from "@/components/floating-add-button";
import {
  useHouseholdGroceryList,
  useToggleHouseholdGroceryChecked,
  useDeleteHouseholdGroceryItem,
  useAddAllToHouseholdPantry,
} from "@/lib/queries/households";
import { cn } from "@/lib/utils";

type ListMode = "checklist" | "review";

export default function HouseholdGroceryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: householdId } = use(params);
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
        <Tabs value={listMode} onValueChange={(v) => setListMode(v as ListMode)}>
          <TabsList>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" className="hidden md:inline-flex" onClick={() => setAddOpen(true)}>
          <Plus /> Add
        </Button>
      </div>

      <div className="space-y-2 pb-24">
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
      <FloatingAddButton onClick={() => setAddOpen(true)} />
    </div>
  );
}
