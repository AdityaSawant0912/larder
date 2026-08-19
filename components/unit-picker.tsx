"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Dropdown over the picker source list (docs/02-database-schema.md "Units
// — presets over free text": item's own units -> learned -> static
// category/generic presets), with "Other..." falling back to a one-off
// text entry that gets learned back via onAddOther. Shared by every unit
// field in the app instead of a raw text input.
export function UnitPicker({
  value,
  onChange,
  presets,
  onAddOther,
}: {
  value: string;
  onChange: (v: string) => void;
  presets: string[];
  onAddOther: (v: string) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");

  if (customOpen) {
    return (
      <div className="flex gap-1">
        <Input
          autoFocus
          value={custom}
          placeholder="unit"
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && custom.trim()) {
              onAddOther(custom.trim());
              setCustomOpen(false);
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={!custom.trim()}
          onClick={() => {
            onAddOther(custom.trim());
            setCustomOpen(false);
          }}
        >
          Set
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={presets.includes(value) ? value : ""}
      onValueChange={(v) => (v === "__other" ? setCustomOpen(true) : onChange(v ?? ""))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={value || "unit"} />
      </SelectTrigger>
      <SelectContent>
        {presets.map((u) => (
          <SelectItem key={u} value={u}>
            {u}
          </SelectItem>
        ))}
        <SelectItem value="__other">Other...</SelectItem>
      </SelectContent>
    </Select>
  );
}
