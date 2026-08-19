"use client";

import { useMemo, useState } from "react";
import { Share2, Copy } from "lucide-react";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCurrentPantry } from "@/lib/queries/items";
import { useGroceryList } from "@/lib/queries/groceryList";
import { daysLeft } from "@/lib/domain/freshness";
import { LOCATIONS } from "@/lib/schemas/location";

// docs/03-resolution-flows.md "Pantry export" — plain text, client-side
// only (no new endpoint), built straight from the already-fetched query
// cache.
export function ExportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: pantry } = useCurrentPantry();
  const { data: groceryList } = useGroceryList();
  const [includeGrocery, setIncludeGrocery] = useState(false);

  const text = useMemo(() => {
    const dateLabel = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    const lines: string[] = [`Current Pantry (${dateLabel})`, ""];

    for (const location of LOCATIONS) {
      const rows = (pantry ?? [])
        .flatMap((item) => item.forms.filter((f) => f.location === location).map((f) => ({ item, f })))
        .sort((a, b) => daysLeft(new Date(a.f.addedDate), a.f.shelfLifeDays) - daysLeft(new Date(b.f.addedDate), b.f.shelfLifeDays));
      if (rows.length === 0) continue;

      lines.push(`${location[0].toUpperCase()}${location.slice(1)}:`);
      for (const { item, f } of rows) {
        const remaining = daysLeft(new Date(f.addedDate), f.shelfLifeDays);
        const daysLabel = remaining >= 0 ? `${remaining} day${remaining === 1 ? "" : "s"} left` : `${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? "" : "s"} over`;
        const noteLabel = f.note ? ` (${f.note})` : "";
        lines.push(`- ${item.name}: ${f.qty} ${f.unit}${noteLabel} — ${daysLabel}`);
      }
      lines.push("");
    }

    if (includeGrocery && groceryList && groceryList.length > 0) {
      lines.push("Next Grocery List:");
      for (const g of groceryList) lines.push(`- ${g.name}`);
      lines.push("");
    }

    return lines.join("\n").trimEnd();
  }, [pantry, groceryList, includeGrocery]);

  async function copy() {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Export pantry" description="Paste into an LLM for recipe ideas.">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={includeGrocery} onCheckedChange={(c) => setIncludeGrocery(c === true)} />
          Include grocery list
        </label>
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
          {text}
        </pre>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={copy}>
            <Copy /> Copy
          </Button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button variant="outline" onClick={share} className="md:hidden">
              <Share2 />
            </Button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
