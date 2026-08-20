"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllUnitPresets, useLearnUnit, useForgetUnit } from "@/lib/queries/unitPresets";
import { CATEGORIES } from "@/lib/constants/unitPresets";

export default function UnitsSettingsPage() {
  const { data: presets } = useAllUnitPresets();
  const learnUnit = useLearnUnit();
  const forgetUnit = useForgetUnit();
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <Link href="/settings" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <h1 className="mb-4 font-display text-3xl">Units</h1>

      <div className="space-y-2">
        {presets?.map((p) => (
          <div key={p._id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm">
            <span className="font-medium">{p.category}</span>
            {p.units.map((u) => (
              <span key={u} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {u}
                <button
                  aria-label={`Remove ${u}`}
                  onClick={() => forgetUnit.mutate({ category: p.category, unit: u })}
                  className="hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ))}
        {presets?.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No custom units yet.</p>}

        <div className="flex gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Add a unit..." value={unit} onChange={(e) => setUnit(e.target.value)} />
          <Button
            disabled={!category || !unit.trim() || learnUnit.isPending}
            onClick={async () => {
              await learnUnit.mutateAsync({ category, unit: unit.trim() });
              setUnit("");
            }}
          >
            <Plus /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
