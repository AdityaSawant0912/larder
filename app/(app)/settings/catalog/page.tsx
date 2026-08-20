"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CatalogItemEditor } from "@/components/catalog-item-editor";
import { useAllCatalogItems, useCreateCatalogItem } from "@/lib/queries/items";
import { useUnitPresets, useLearnUnit } from "@/lib/queries/unitPresets";
import { UnitPicker } from "@/components/unit-picker";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { CATEGORIES } from "@/lib/constants/unitPresets";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { cn } from "@/lib/utils";

export default function CatalogSettingsPage() {
  const { data: items } = useAllCatalogItems();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const filtered = (items ?? []).filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
  const selected = items?.find((i) => i._id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <Link href="/settings" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <h1 className="mb-4 font-display text-3xl">Your Catalog</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-2">
          <Input placeholder="Search your catalog..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="space-y-1">
            {filtered.map((item) => (
              <button
                key={item._id}
                onClick={() => setSelectedId(item._id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  selectedId === item._id && "border-primary bg-accent"
                )}
              >
                <span>{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.category}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items yet.</p>}
          </div>
          <NewCatalogItemForm />
        </div>

        {/* Desktop: master-detail (docs/08). */}
        {isDesktop && (
          <div className="rounded-lg border border-border/60 p-4">
            {selected ? <CatalogItemEditor item={selected} /> : <p className="text-sm text-muted-foreground">Select an item to edit.</p>}
          </div>
        )}
      </div>

      {/* Mobile: list navigates into a sheet (docs/07). */}
      {!isDesktop && (
        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Edit item</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">{selected && <CatalogItemEditor item={selected} />}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function NewCatalogItemForm() {
  const createItem = useCreateCatalogItem();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("piece");
  const [defaultShelfLifeDays, setDefaultShelfLifeDays] = useState(7);
  const [defaultLocation, setDefaultLocation] = useState<Location>("pantry");

  const { data: unitPresets } = useUnitPresets(category);
  const learnUnit = useLearnUnit();

  async function addOtherUnit(newUnit: string) {
    setDefaultUnit(newUnit);
    if (category) await learnUnit.mutateAsync({ category, unit: newUnit });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus /> New catalog item
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
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
      <div className="grid grid-cols-2 gap-2">
        <UnitPicker value={defaultUnit} onChange={setDefaultUnit} presets={unitPresets?.units ?? []} onAddOther={addOtherUnit} />
        <Input
          type="number"
          min={1}
          value={defaultShelfLifeDays}
          onChange={(e) => setDefaultShelfLifeDays(Number(e.target.value))}
        />
      </div>
      <Select value={defaultLocation} onValueChange={(v) => setDefaultLocation(v as Location)}>
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
      <Button
        size="sm"
        className="w-full"
        disabled={!name || !category || createItem.isPending}
        onClick={async () => {
          await createItem.mutateAsync({ name, category, defaultUnit, defaultShelfLifeDays, defaultLocation });
          setOpen(false);
          setName("");
          setCategory("");
        }}
      >
        Add
      </Button>
    </div>
  );
}
