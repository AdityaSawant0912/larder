"use client";

import { useState } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouseholdCatalogSearch, useResolveAndAddHouseholdForm } from "@/lib/queries/households";
import { useUnitPresets, useLearnUnit } from "@/lib/queries/unitPresets";
import { UnitPicker } from "@/components/unit-picker";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { CATEGORIES } from "@/lib/constants/unitPresets";
import type { HouseholdItemSelectionInput } from "@/lib/types/dto";

type Step = "search" | "manual" | "details";

// Household Pantry tab's direct "Add" — mirrors components/add-item-flow.tsx,
// scoped to this household's own catalog instead of the personal one, and
// posts straight to householdItems (no grocery-list detour).
export function HouseholdAddItemFlow({
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
  const resolveAndAddForm = useResolveAndAddHouseholdForm(householdId);

  const [selection, setSelection] = useState<HouseholdItemSelectionInput | null>(null);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");

  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(1);
  const [location, setLocation] = useState<Location>("pantry");
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [note, setNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const { data: unitPresets } = useUnitPresets(category);
  const learnUnit = useLearnUnit();

  function reset() {
    setStep("search");
    setQuery("");
    setSelection(null);
    setCategory("");
    setName("");
    setUnit("");
    setQty(1);
    setLocation("pantry");
    setShelfLifeDays(7);
    setNote("");
    setSaveAsDefault(false);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  function pickGlobal(id: string, itemName: string, itemCategory: string, defaultUnit: string, defaultShelfLifeDays: number, defaultLocation: Location) {
    setSelection({ kind: "global", globalItemId: id });
    setCategory(itemCategory);
    setName(itemName);
    setUnit(defaultUnit);
    setShelfLifeDays(defaultShelfLifeDays);
    setLocation(defaultLocation);
    setStep("details");
  }

  function pickHouseholdItem(id: string, itemName: string, itemCategory: string, defaultUnit: string, defaultShelfLifeDays: number, defaultLocation: Location) {
    setSelection({ kind: "householdItem", householdItemId: id });
    setCategory(itemCategory);
    setName(itemName);
    setUnit(defaultUnit);
    setShelfLifeDays(defaultShelfLifeDays);
    setLocation(defaultLocation);
    setStep("details");
  }

  function confirmManual() {
    setSelection({ kind: "manual", manual: { name, category, defaultUnit: "piece", defaultShelfLifeDays: 7, defaultLocation: "pantry" } });
    setStep("details");
  }

  async function handleSubmit() {
    if (!selection) return;
    const finalSelection =
      selection.kind === "manual"
        ? { ...selection, manual: { ...selection.manual, defaultUnit: unit, defaultShelfLifeDays: shelfLifeDays, defaultLocation: location } }
        : selection;
    await resolveAndAddForm.mutateAsync({ selection: finalSelection, unit, qty, location, shelfLifeDays, note: note || undefined, saveAsDefault });
    close();
  }

  async function addOtherUnit(newUnit: string) {
    setUnit(newUnit);
    if (category) await learnUnit.mutateAsync({ category, unit: newUnit });
  }

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())} title="Add to household pantry">
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
                    setName(query);
                    setStep("manual");
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
                    onSelect={() => pickGlobal(g._id, g.name, g.category, g.defaultUnit, g.defaultShelfLifeDays, g.defaultLocation)}
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
                    onSelect={() => pickHouseholdItem(h._id, h.name, h.category, h.defaultUnit, h.defaultShelfLifeDays, h.defaultLocation)}
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

      {step === "manual" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={!name || !category} onClick={confirmManual}>
            Continue
          </Button>
        </div>
      )}

      {step === "details" && selection && (
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
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select value={location} onValueChange={(v) => setLocation(v as Location)}>
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
            <div className="space-y-1.5">
              <Label>Shelf life (days)</Label>
              <Input
                type="number"
                min={1}
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={saveAsDefault} onCheckedChange={(c) => setSaveAsDefault(c === true)} />
            Save as default for this item
          </label>
          <Button className="w-full" disabled={resolveAndAddForm.isPending || !unit || qty <= 0} onClick={handleSubmit}>
            {resolveAndAddForm.isPending ? "Adding..." : "Add"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
