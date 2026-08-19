"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { useConvertForm, type ConvertOutput } from "@/lib/queries/items";
import { useUnitPresets, useLearnUnit } from "@/lib/queries/unitPresets";
import { UnitPicker } from "@/components/unit-picker";
import { LOCATIONS } from "@/lib/schemas/location";
import type { FormDTO } from "@/lib/types/dto";

// e.g. 1 whole watermelon -> 4 containers (docs/01-product-overview.md).
export function ConvertDialog({
  itemId,
  category,
  form,
  open,
  onOpenChange,
}: {
  itemId: string;
  category: string;
  form: FormDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [outputs, setOutputs] = useState<ConvertOutput[]>([
    { unit: form.unit, qty: 1, location: form.location, shelfLifeDays: form.shelfLifeDays },
  ]);
  const convertForm = useConvertForm();
  const { data: unitPresets } = useUnitPresets(category, itemId);
  const learnUnit = useLearnUnit();

  async function addOtherUnit(i: number, newUnit: string) {
    updateOutput(i, { unit: newUnit });
    if (category) await learnUnit.mutateAsync({ category, unit: newUnit });
  }

  function updateOutput(i: number, patch: Partial<ConvertOutput>) {
    setOutputs((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  async function onSubmit() {
    await convertForm.mutateAsync({ itemId, formId: form.id, outputs });
    onOpenChange(false);
    setOutputs([{ unit: form.unit, qty: 1, location: form.location, shelfLifeDays: form.shelfLifeDays }]);
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Convert"
      description={`Turn this ${form.unit} into something else.`}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {outputs.map((output, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Output {i + 1}</span>
                {outputs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setOutputs((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={output.qty}
                    onChange={(e) => updateOutput(i, { qty: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit</Label>
                  <UnitPicker
                    value={output.unit}
                    onChange={(v) => updateOutput(i, { unit: v })}
                    presets={unitPresets?.units ?? []}
                    onAddOther={(v) => addOtherUnit(i, v)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Select value={output.location} onValueChange={(v) => updateOutput(i, { location: v as ConvertOutput["location"] })}>
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
                    value={output.shelfLifeDays}
                    onChange={(e) => updateOutput(i, { shelfLifeDays: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setOutputs((prev) => [...prev, { unit: form.unit, qty: 1, location: form.location, shelfLifeDays: form.shelfLifeDays }])
          }
        >
          <Plus /> Add output
        </Button>

        <Button className="w-full" onClick={onSubmit} disabled={convertForm.isPending || outputs.length === 0}>
          {convertForm.isPending ? "Converting..." : "Convert"}
        </Button>
      </div>
    </ResponsiveModal>
  );
}
