"use client";

import { useState } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCatalogSearch } from "@/lib/queries/items";
import { useStores } from "@/lib/queries/stores";
import { useAddGroceryItem } from "@/lib/queries/groceryList";
import type { GroceryAddSelectionInput } from "@/lib/types/dto";

type Step = "search" | "details";

// Grocery List's add flow — same catalog resolution as pantry adds when a
// match is picked, but a raw free-text row is also allowed since a
// grocery row doesn't need shelf-life/location (docs/03-resolution-flows.md).
export function GroceryAddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const { data: searchResults, isFetching } = useCatalogSearch(query);
  const { data: stores } = useStores();
  const addItem = useAddGroceryItem();

  const [selection, setSelection] = useState<GroceryAddSelectionInput | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(1);
  const [storeId, setStoreId] = useState<string | null>(null);

  function reset() {
    setStep("search");
    setQuery("");
    setSelection(null);
    setName("");
    setUnit("");
    setQty(1);
    setStoreId(null);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  async function handleSubmit() {
    if (!selection) return;
    await addItem.mutateAsync({ selection, qty, unit, storeId });
    close();
  }

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())} title="Add to grocery list">
      {step === "search" && (
        <Command shouldFilter={false} className="border border-border">
          <CommandInput placeholder="Search for an item..." value={query} onValueChange={setQuery} />
          <CommandList>
            {query.trim() && !isFetching && (
              <CommandEmpty className="flex flex-col items-center gap-2 py-4">
                <span className="text-sm text-muted-foreground">No match for &quot;{query}&quot;</span>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelection({ kind: "freeText", name: query, category: "pantry" });
                    setName(query);
                    setUnit("piece");
                    setStep("details");
                  }}
                >
                  Add &quot;{query}&quot; anyway
                </Button>
              </CommandEmpty>
            )}
            {searchResults && searchResults.globalMatches.length > 0 && (
              <CommandGroup heading="Catalog">
                {searchResults.globalMatches.map((g) => (
                  <CommandItem
                    key={g._id}
                    value={g._id}
                    onSelect={() => {
                      setSelection({ kind: "global", globalItemId: g._id });
                      setName(g.name);
                      setUnit(g.defaultUnit);
                      setStep("details");
                    }}
                  >
                    {g.name}
                    <span className="ml-auto text-xs text-muted-foreground">{g.category}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchResults && searchResults.userMatches.length > 0 && (
              <CommandGroup heading="Your items">
                {searchResults.userMatches.map((u) => (
                  <CommandItem
                    key={u._id}
                    value={u._id}
                    onSelect={() => {
                      setSelection({ kind: "userItem", userItemId: u._id });
                      setName(u.name);
                      setUnit(u.defaultUnit);
                      setStep("details");
                    }}
                  >
                    {u.name}
                    <span className="ml-auto text-xs text-muted-foreground">{u.category}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}

      {step === "details" && (
        <div className="space-y-3">
          <p className="font-display text-2xl">{name}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Qty</Label>
              <Input type="number" min={0.01} step="any" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Store</Label>
            <Select value={storeId ?? "__any"} onValueChange={(v) => setStoreId(v === "__any" ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any">Any</SelectItem>
                {stores?.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={addItem.isPending || !unit || qty <= 0} onClick={handleSubmit}>
            {addItem.isPending ? "Adding..." : "Add to list"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
