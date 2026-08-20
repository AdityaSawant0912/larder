"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/item-card";
import { ModeToggle, type HomeMode } from "@/components/mode-toggle";
import { AddItemFlow, type AddItemDetails } from "@/components/add-item-flow";
import { ExportSheet } from "@/components/export-sheet";
import { FloatingAddButton } from "@/components/floating-add-button";
import { useCurrentPantry, useResolveAndAddForm, useCommitRestock, useDiscardClearOut, type RestockQueueRow } from "@/lib/queries/items";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { cn } from "@/lib/utils";

type StagedRow = RestockQueueRow & { name: string; key: string };

export default function HomePage() {
  const { data: pantry, isLoading } = useCurrentPantry();
  const [mode, setMode] = useState<HomeMode>("track");
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [clearOutSelection, setClearOutSelection] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<StagedRow[]>([]);

  const resolveAndAddForm = useResolveAndAddForm();
  const commitRestock = useCommitRestock();
  const discardClearOut = useDiscardClearOut();

  const filtered = (pantry ?? [])
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    .map((item) => ({
      ...item,
      forms: locationFilter === "all" ? item.forms : item.forms.filter((f) => f.location === locationFilter),
    }))
    .filter((item) => item.forms.length > 0);

  function toggleClearOutSelect(itemId: string, formId: string) {
    const key = `${itemId}:${formId}`;
    setClearOutSelection((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleDiscard() {
    const selections = [...clearOutSelection].map((key) => {
      const [itemId, formId] = key.split(":");
      return { itemId, formId };
    });
    await discardClearOut.mutateAsync(selections);
    setClearOutSelection(new Set());
  }

  function handleQueueAdd(details: AddItemDetails) {
    setQueue((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        selection: details.selection,
        name: details.name,
        unit: details.unit,
        qty: details.qty,
        location: details.location,
        shelfLifeDays: details.shelfLifeDays,
        note: details.note,
      },
    ]);
  }

  async function handleCommitRestock() {
    await commitRestock.mutateAsync(queue.map(({ key: _key, name: _name, ...row }) => row));
    setQueue([]);
  }

  async function handleTrackAdd(details: AddItemDetails) {
    await resolveAndAddForm.mutateAsync(details);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Larder</h1>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onModeChange={setMode} />
          <Button variant="ghost" size="icon" aria-label="Export pantry" onClick={() => setExportOpen(true)}>
            <Download />
          </Button>
        </div>
      </div>

      {mode === "track" && (
        <>
          <div className="mb-3 flex gap-2">
            <Input placeholder="Search your pantry..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button className="hidden md:inline-flex" onClick={() => setAddOpen(true)}>
              <Plus /> Add
            </Button>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={locationFilter === "all"} onClick={() => setLocationFilter("all")}>
              All
            </FilterChip>
            {LOCATIONS.map((loc) => (
              <FilterChip key={loc} active={locationFilter === loc} onClick={() => setLocationFilter(loc)}>
                {loc[0].toUpperCase() + loc.slice(1)}
              </FilterChip>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing here yet. Add your first item.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ItemCard key={item._id} item={item} mode="track" />
              ))}
            </div>
          )}

          <AddItemFlow open={addOpen} onOpenChange={setAddOpen} onSubmit={handleTrackAdd} />
          <FloatingAddButton onClick={() => setAddOpen(true)} />
        </>
      )}

      {mode === "clearOut" && (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={locationFilter === "all"} onClick={() => setLocationFilter("all")}>
              All
            </FilterChip>
            {LOCATIONS.map((loc) => (
              <FilterChip key={loc} active={locationFilter === loc} onClick={() => setLocationFilter(loc)}>
                {loc[0].toUpperCase() + loc.slice(1)}
              </FilterChip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 pb-24 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                mode="clearOut"
                selectedFormIds={new Set([...clearOutSelection].filter((k) => k.startsWith(`${item._id}:`)).map((k) => k.split(":")[1]))}
                onToggleSelect={toggleClearOutSelect}
              />
            ))}
          </div>

          <AnimatePresence>
            {clearOutSelection.size > 0 && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed inset-x-4 bottom-20 z-30 md:inset-x-auto md:right-6 md:bottom-6 md:w-80"
              >
                <Button
                  className="w-full shadow-lg"
                  variant="destructive"
                  disabled={discardClearOut.isPending}
                  onClick={handleDiscard}
                >
                  Discard {clearOutSelection.size} item{clearOutSelection.size === 1 ? "" : "s"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {mode === "restock" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Scan through your groceries and add each one to the queue.</p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus /> Add to queue
            </Button>
            <AddItemFlow open={addOpen} onOpenChange={setAddOpen} onSubmit={handleQueueAdd} showSaveAsDefault={false} submitLabel="Add to queue" />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Queue ({queue.length})</h2>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing staged yet.</p>
            ) : (
              <div className="space-y-2">
                {queue.map((row) => (
                  <div key={row.key} className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.qty} {row.unit} · {row.location}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove"
                      onClick={() => setQueue((prev) => prev.filter((r) => r.key !== row.key))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                <Button className="w-full" disabled={commitRestock.isPending} onClick={handleCommitRestock}>
                  Add {queue.length} to pantry
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ExportSheet open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
