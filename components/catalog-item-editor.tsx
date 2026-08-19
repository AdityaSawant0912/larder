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
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Default unit</Label>
          <Input value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} />
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
            <Input
              placeholder="unit"
              value={t.unit}
              onChange={(e) =>
                setThresholds((prev) => prev.map((row, idx) => (idx === i ? { ...row, unit: e.target.value } : row)))
              }
            />
            <Input
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
