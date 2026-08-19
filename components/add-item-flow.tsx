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
import { useCatalogSearch } from "@/lib/queries/items";
import { useUnitPresets, useLearnUnit } from "@/lib/queries/unitPresets";
import { UnitPicker } from "@/components/unit-picker";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import type { ItemSelectionInput } from "@/lib/types/dto";

export interface AddItemDetails {
  selection: ItemSelectionInput;
  name: string;
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
  saveAsDefault?: boolean;
}

type Step = "search" | "manual" | "details";

// The resolution flow (docs/03-resolution-flows.md): search catalog ->
// pick a match or add manually -> unit/qty/location/shelf-life details.
// Shared by Home's "add now" and Restock's "add to queue" — the caller
// decides what onSubmit does with the resolved details.
export function AddItemFlow({
  open,
  onOpenChange,
  onSubmit,
  showSaveAsDefault = true,
  submitLabel = "Add",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: AddItemDetails) => void | Promise<void>;
  showSaveAsDefault?: boolean;
  submitLabel?: string;
}) {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const { data: searchResults, isFetching } = useCatalogSearch(query);

  const [selection, setSelection] = useState<ItemSelectionInput | null>(null);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");

  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState(1);
  const [location, setLocation] = useState<Location>("pantry");
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [note, setNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [pending, setPending] = useState(false);

  const itemIdForUnits = selection?.kind === "userItem" ? selection.userItemId : undefined;
  const { data: unitPresets } = useUnitPresets(category, itemIdForUnits);
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

  function pickUserItem(id: string, itemName: string, itemCategory: string, defaultUnit: string, defaultShelfLifeDays: number, defaultLocation: Location) {
    setSelection({ kind: "userItem", userItemId: id });
    setCategory(itemCategory);
    setName(itemName);
    setUnit(defaultUnit);
    setShelfLifeDays(defaultShelfLifeDays);
    setLocation(defaultLocation);
    setStep("details");
  }

  function confirmManual() {
    setSelection({
      kind: "manual",
      manual: { name, category, defaultUnit: unit || "piece", defaultShelfLifeDays: shelfLifeDays, defaultLocation: location },
    });
    setStep("details");
  }

  async function handleSubmit() {
    if (!selection) return;
    setPending(true);
    try {
      await onSubmit({ selection, name, unit, qty, location, shelfLifeDays, note: note || undefined, saveAsDefault });
      close();
    } finally {
      setPending(false);
    }
  }

  async function addOtherUnit(newUnit: string) {
    setUnit(newUnit);
    if (category) await learnUnit.mutateAsync({ category, unit: newUnit });
  }

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => (o ? onOpenChange(o) : close())} title="Add item">
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
                  Add &quot;{query}&quot; to your catalog
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
            {searchResults && searchResults.userMatches.length > 0 && (
              <CommandGroup heading="Your items">
                {searchResults.userMatches.map((u) => (
                  <CommandItem
                    key={u._id}
                    value={u._id}
                    onSelect={() => pickUserItem(u._id, u.name, u.category, u.defaultUnit, u.defaultShelfLifeDays, u.defaultLocation)}
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

      {step === "manual" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              placeholder="produce, dairy, pantry, ..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Default unit</Label>
              <UnitPicker value={unit} onChange={setUnit} presets={unitPresets?.units ?? []} onAddOther={addOtherUnit} />
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
            <Label>Default location</Label>
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
          {showSaveAsDefault && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={saveAsDefault} onCheckedChange={(c) => setSaveAsDefault(c === true)} />
              Save as default for this item
            </label>
          )}
          <Button className="w-full" disabled={pending || !unit || qty <= 0} onClick={handleSubmit}>
            {pending ? "Adding..." : submitLabel}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
}
