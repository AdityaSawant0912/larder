"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, CookingPot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUseSoon } from "@/lib/queries/useSoon";
import { useConsumeForm } from "@/lib/queries/items";
import { freshnessState } from "@/lib/domain/freshness";
import { cn } from "@/lib/utils";
import type { UseSoonRowDTO } from "@/lib/types/dto";

type SortKey = "daysLeft" | "itemName" | "location";

export default function UseSoonPage() {
  const { data: rows, isLoading } = useUseSoon();
  const [sortKey, setSortKey] = useState<SortKey>("daysLeft");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const list = [...(rows ?? [])];
    list.sort((a, b) => {
      const cmp =
        sortKey === "daysLeft" ? a.daysLeft - b.daysLeft : String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [rows, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <h1 className="mb-4 font-display text-3xl">Use Soon</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : sorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nothing expiring soon.</p>
      ) : (
        <>
          {/* Mobile: minimal rows (docs/07-screens-mobile). */}
          <div className="space-y-2 md:hidden">
            {sorted.map((row) => (
              <UseSoonRow key={row.formId} row={row} />
            ))}
          </div>

          {/* Desktop: dense sortable table (docs/08-screens-desktop). */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Item" active={sortKey === "itemName"} onClick={() => toggleSort("itemName")} />
                  <TableHead>Qty</TableHead>
                  <SortableHead label="Location" active={sortKey === "location"} onClick={() => toggleSort("location")} />
                  <SortableHead label="Days left" active={sortKey === "daysLeft"} onClick={() => toggleSort("daysLeft")} />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.formId}>
                    <TableCell className="font-medium">{row.itemName}</TableCell>
                    <TableCell className="font-mono">
                      {row.qty} {row.unit}
                    </TableCell>
                    <TableCell className="capitalize">{row.location}</TableCell>
                    <TableCell
                      className={cn(
                        "font-mono",
                        freshnessState(row.daysLeft) === "danger" && "text-danger",
                        freshnessState(row.daysLeft) === "warning" && "text-warning"
                      )}
                    >
                      {row.daysLeft >= 0 ? `${row.daysLeft}d` : `${Math.abs(row.daysLeft)}d over`}
                    </TableCell>
                    <TableCell>
                      <UseUpButton row={row} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function SortableHead({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <TableHead>
      <button onClick={onClick} className={cn("flex items-center gap-1", active && "text-foreground")}>
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );
}

function UseSoonRow({ row }: { row: UseSoonRowDTO }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.itemName}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {row.qty} {row.unit} · {row.location}
        </p>
      </div>
      <span
        className={cn(
          "font-mono text-xs",
          freshnessState(row.daysLeft) === "danger" && "text-danger",
          freshnessState(row.daysLeft) === "warning" && "text-warning"
        )}
      >
        {row.daysLeft >= 0 ? `${row.daysLeft}d left` : `${Math.abs(row.daysLeft)}d over`}
      </span>
      <UseUpButton row={row} />
    </div>
  );
}

function UseUpButton({ row }: { row: UseSoonRowDTO }) {
  const [qty, setQty] = useState(row.qty);
  const consumeForm = useConsumeForm();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Use up"
            className="text-fresh hover:bg-fresh/10 hover:text-fresh dark:hover:bg-fresh/20"
          >
            <CookingPot />
          </Button>
        }
      />
      <PopoverContent className="w-48">
        <div className="space-y-2">
          <Input type="number" min={0.01} max={row.qty} step="any" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <Button
            size="sm"
            className="w-full"
            disabled={consumeForm.isPending}
            onClick={() => consumeForm.mutate({ itemId: row.itemId, formId: row.formId, qty })}
          >
            Use up
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
