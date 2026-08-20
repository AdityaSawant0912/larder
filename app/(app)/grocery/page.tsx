"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroceryAddDialog } from "@/components/grocery-add-dialog";
import { FloatingAddButton } from "@/components/floating-add-button";
import {
  useGroceryList,
  useToggleGroceryChecked,
  useDeleteGroceryItem,
  useAddAllToPantry,
  type BulkAddRow,
} from "@/lib/queries/groceryList";
import { useStores } from "@/lib/queries/stores";
import { useTemplates, useApplyTemplate, useCreateTemplate } from "@/lib/queries/templates";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { cn } from "@/lib/utils";

type ListMode = "checklist" | "review";

export default function GroceryListPage() {
  const { data: items } = useGroceryList();
  const { data: stores } = useStores();
  const { data: templates } = useTemplates();
  const toggleChecked = useToggleGroceryChecked();
  const deleteItem = useDeleteGroceryItem();
  const addAllToPantry = useAddAllToPantry();
  const applyTemplate = useApplyTemplate();
  const createTemplate = useCreateTemplate();

  const [listMode, setListMode] = useState<ListMode>("checklist");
  const [selectedStore, setSelectedStore] = useState<string>("any");
  const [addOpen, setAddOpen] = useState(false);
  const [reviewSelection, setReviewSelection] = useState<Set<string>>(new Set());
  const [reviewDefaults, setReviewDefaults] = useState<Record<string, { location: Location; shelfLifeDays: number }>>({});

  const visible = (items ?? []).filter((item) =>
    selectedStore === "any" ? true : item.storeId === selectedStore || item.storeId === null
  );

  // Only chip stores that actually have something on this list — the
  // user's full store list can grow past what's relevant here (global
  // stores included), so don't let the filter row grow unbounded.
  const storeIdsWithItems = new Set((items ?? []).map((item) => item.storeId).filter((id): id is string => id !== null));
  const storesWithItems = (stores ?? []).filter((s) => storeIdsWithItems.has(s._id));

  function toggleReviewSelect(id: string) {
    setReviewSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAddAllToPantry() {
    const rows: BulkAddRow[] = [...reviewSelection].map((id) => {
      const defaults = reviewDefaults[id];
      return { groceryListItemId: id, location: defaults?.location, shelfLifeDays: defaults?.shelfLifeDays };
    });
    await addAllToPantry.mutateAsync(rows);
    setReviewSelection(new Set());
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Grocery List</h1>
        <div className="flex items-center gap-2">
          <Tabs value={listMode} onValueChange={(v) => setListMode(v as ListMode)}>
            <TabsList>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
          </Tabs>
          <TemplatesMenu
            templates={templates ?? []}
            onApply={(id) => applyTemplate.mutate(id)}
            onSaveCurrent={(name) =>
              createTemplate.mutate({
                name,
                items: (items ?? []).map((i) => ({ name: i.name, category: i.category, storeId: i.storeId, unit: i.unit, qty: i.qty })),
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[14rem_1fr]">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          <StoreChip active={selectedStore === "any"} onClick={() => setSelectedStore("any")}>
            Any
          </StoreChip>
          {storesWithItems.map((s) => (
            <StoreChip key={s._id} active={selectedStore === s._id} onClick={() => setSelectedStore(s._id)}>
              {s.name}
            </StoreChip>
          ))}
        </div>

        <div className="space-y-2 pb-24">
          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nothing on the list here.</p>
          ) : (
            visible.map((item) => (
              <div key={item._id} className="rounded-lg border border-border/60 p-2.5">
                <div className="flex items-center gap-3">
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
                    <Button variant="ghost" size="icon-xs" aria-label="Remove" onClick={() => deleteItem.mutate(item._id)}>
                      <Trash2 />
                    </Button>
                  )}
                </div>

                {listMode === "review" && reviewSelection.has(item._id) && !item.userItemId && (
                  <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Location</Label>
                      <Select
                        value={reviewDefaults[item._id]?.location ?? "pantry"}
                        onValueChange={(v) =>
                          setReviewDefaults((prev) => ({
                            ...prev,
                            [item._id]: { location: v as Location, shelfLifeDays: prev[item._id]?.shelfLifeDays ?? 7 },
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Shelf life (days)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={reviewDefaults[item._id]?.shelfLifeDays ?? 7}
                        onChange={(e) =>
                          setReviewDefaults((prev) => ({
                            ...prev,
                            [item._id]: { location: prev[item._id]?.location ?? "pantry", shelfLifeDays: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {listMode === "review" && reviewSelection.size > 0 && (
            <Button className="w-full" disabled={addAllToPantry.isPending} onClick={handleAddAllToPantry}>
              Add {reviewSelection.size} to pantry
            </Button>
          )}
        </div>
      </div>

      <GroceryAddDialog open={addOpen} onOpenChange={setAddOpen} />
      <FloatingAddButton onClick={() => setAddOpen(true)} />
    </div>
  );
}

function StoreChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-left text-sm transition-colors md:rounded-lg",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function TemplatesMenu({
  templates,
  onApply,
  onSaveCurrent,
}: {
  templates: { _id: string; name: string }[];
  onApply: (id: string) => void;
  onSaveCurrent: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline">Templates</Button>} />
      <DropdownMenuContent align="end" className="w-64">
        {templates.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">No saved templates yet.</p>}
        {templates.map((t) => (
          <DropdownMenuItem key={t._id} onClick={() => onApply(t._id)}>
            Apply &quot;{t.name}&quot;
          </DropdownMenuItem>
        ))}
        <div className="flex gap-1 p-1.5">
          <Input
            placeholder="Save current list as..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            // The menu's roving-focus/typeahead keydown handling would
            // otherwise swallow keystrokes meant for this input.
            onKeyDown={(e) => e.stopPropagation()}
            className="h-7 text-xs"
          />
          <Button
            size="xs"
            disabled={!name.trim()}
            onClick={() => {
              onSaveCurrent(name.trim());
              setName("");
            }}
          >
            Save
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
