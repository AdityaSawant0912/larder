"use client";

import { useState } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHouseholdCatalogSearch, useAddHouseholdGroceryItem } from "@/lib/queries/households";
import { useUnitPresets, useLearnUnit } from "@/lib/queries/unitPresets";
import { UnitPicker } from "@/components/unit-picker";
import type { HouseholdGroceryAddSelectionInput } from "@/lib/types/dto";

type Step = "search" | "details";

// Mirrors components/grocery-add-dialog.tsx — no store step, household
// grocery items are always "Any" (stores are personal, not shared).
export function HouseholdGroceryAddDialog({
  householdId,
  open,
  onOpenChange,
}: {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const { data: searchResults, isFetching } = useHouseholdCatalogSearch(householdId, query);
  const addItem = useAddHouseholdGroceryItem(householdId);

  const [selection, setSelection] = useState<HouseholdGroceryAddSelectionInput | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(1);

  const { data: unitPresets } = useUnitPresets(category);
  const learnUnit = useLearnUnit();

  function reset() {
    setStep("search");
    setQuery("");
    setSelection(null);
    setName("");
    setCategory("");
    setUnit("");
    setQty(1);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  async function handleSubmit() {
    if (!selection) return;
    await addItem.mutateAsync({ selection, qty, unit });
    close();
  }

  async function addOtherUnit(newUnit: string) {
    setUnit(newUnit);
    if (category) await learnUnit.mutateAsync({ category, unit: newUnit });
  }

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())} title="Add to household list">
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
                    setCategory("pantry");
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
                      setCategory(g.category);
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
            {searchResults && searchResults.householdMatches.length > 0 && (
              <CommandGroup heading="This household's items">
                {searchResults.householdMatches.map((h) => (
                  <CommandItem
                    key={h._id}
                    value={h._id}
                    onSelect={() => {
                      setSelection({ kind: "householdItem", householdItemId: h._id });
                      setName(h.name);
                      setCategory(h.category);
                      setUnit(h.defaultUnit);
                      setStep("details");
                    }}
                  >
                    {h.name}
                    <span className="ml-auto text-xs text-muted-foreground">{h.category}</span>
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
              <UnitPicker value={unit} onChange={setUnit} presets={unitPresets?.units ?? []} onAddOther={addOtherUnit} />
            </div>
          </div>
          <Button className="w-full" disabled={addItem.isPending || !unit || qty <= 0} onClick={handleSubmit}>
            {addItem.isPending ? "Adding..." : "Add to list"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
