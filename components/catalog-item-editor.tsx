"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { usePatchCatalogItem } from "@/lib/queries/items";
import { useUnitPresets, useLearnUnit } from "@/lib/queries/unitPresets";
import { UnitPicker } from "@/components/unit-picker";
import { CATEGORIES } from "@/lib/constants/unitPresets";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import type { UserItemDTO, ThresholdDTO } from "@/lib/types/dto";

// Settings is the one screen where editing a default doesn't need the
// "save as default" checkbox — editing IS the point (docs/07).
export function CatalogItemEditor({ item }: { item: UserItemDTO }) {
  const patch = usePatchCatalogItem();

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [defaultUnit, setDefaultUnit] = useState(item.defaultUnit);
  const [defaultShelfLifeDays, setDefaultShelfLifeDays] = useState(item.defaultShelfLifeDays);
  const [defaultLocation, setDefaultLocation] = useState<Location>(item.defaultLocation);
  const [thresholds, setThresholds] = useState<ThresholdDTO[]>(item.thresholds);

  const { data: unitPresets } = useUnitPresets(category, item._id);
  const learnUnit = useLearnUnit();

  async function addOtherUnit(newUnit: string) {
    setDefaultUnit(newUnit);
    if (category) await learnUnit.mutateAsync({ category, unit: newUnit });
  }

  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setDefaultUnit(item.defaultUnit);
    setDefaultShelfLifeDays(item.defaultShelfLifeDays);
    setDefaultLocation(item.defaultLocation);
    setThresholds(item.thresholds);
  }, [item]);

  async function save() {
    await patch.mutateAsync({
      id: item._id,
      name,
      category,
      defaultUnit,
      defaultShelfLifeDays,
      defaultLocation,
      thresholds,
    });
  }

  return (
    <div className="space-y-4">
      <p className="font-display text-3xl">{item.name}</p>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="space-y-1.5">
          <Label>Default unit</Label>
          <UnitPicker value={defaultUnit} onChange={setDefaultUnit} presets={unitPresets?.units ?? []} onAddOther={addOtherUnit} />
        </div>
        <div className="space-y-1.5">
          <Label>Default shelf life (days)</Label>
          <Input
            type="number"
            min={1}
            value={defaultShelfLifeDays}
            onChange={(e) => setDefaultShelfLifeDays(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Default location</Label>
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
        </div>
      </div>

      <div className="space-y-2">
        <Label>Running-low thresholds</Label>
        {thresholds.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <UnitPicker
                value={t.unit}
                onChange={(v) => setThresholds((prev) => prev.map((row, idx) => (idx === i ? { ...row, unit: v } : row)))}
                presets={unitPresets?.units ?? []}
                onAddOther={async (v) => {
                  setThresholds((prev) => prev.map((row, idx) => (idx === i ? { ...row, unit: v } : row)));
                  if (category) await learnUnit.mutateAsync({ category, unit: v });
                }}
              />
            </div>
            <Input
              className="flex-1"
              type="number"
              min={0}
              placeholder="min qty"
              value={t.minQty}
              onChange={(e) =>
                setThresholds((prev) =>
                  prev.map((row, idx) => (idx === i ? { ...row, minQty: Number(e.target.value) } : row))
                )
              }
            />
            <Button variant="ghost" size="icon-sm" onClick={() => setThresholds((prev) => prev.filter((_, idx) => idx !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setThresholds((prev) => [...prev, { unit: defaultUnit, minQty: 1 }])}>
          <Plus /> Add threshold
        </Button>
      </div>

      <Button className="w-full" disabled={patch.isPending} onClick={save}>
        {patch.isPending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
