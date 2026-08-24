"use client";

import { use, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/item-card";
import { ModeToggle, type HomeMode } from "@/components/mode-toggle";
import { HouseholdAddItemFlow } from "@/components/household-add-item-flow";
import { FloatingAddButton } from "@/components/floating-add-button";
import { useHouseholdPantry, useDiscardHouseholdClearOut } from "@/lib/queries/households";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { cn } from "@/lib/utils";

// Track + Clear-Out only — no Restock for households (not requested; the
// personal Home page keeps Restock/Clear-Out scoped to personal items only).
export default function HouseholdPantryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: items, isLoading } = useHouseholdPantry(id);
  const discardClearOut = useDiscardHouseholdClearOut(id);
  const [mode, setMode] = useState<HomeMode>("track");
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [clearOutSelection, setClearOutSelection] = useState<Set<string>>(new Set());

  const filtered = (items ?? [])
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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ModeToggle mode={mode} onModeChange={setMode} modes={["track", "clearOut"]} />
        {mode === "track" && (
          <Button className="hidden shrink-0 md:inline-flex" onClick={() => setAddOpen(true)}>
            <Plus /> Add
          </Button>
        )}
      </div>

      <div className="mb-3 flex gap-2">
        <Input placeholder="Search this pantry..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
          Nothing in this household&apos;s pantry yet. Add the first item.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 pb-24 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((item) =>
              mode === "clearOut" ? (
                <ItemCard
                  key={item._id}
                  item={item}
                  mode="clearOut"
                  householdId={id}
                  selectedFormIds={new Set([...clearOutSelection].filter((k) => k.startsWith(`${item._id}:`)).map((k) => k.split(":")[1]))}
                  onToggleSelect={toggleClearOutSelect}
                />
              ) : (
                <ItemCard key={item._id} item={item} mode="track" householdId={id} />
              )
            )}
          </AnimatePresence>
        </div>
      )}

      {mode === "clearOut" && (
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
      )}

      {mode === "track" && (
        <>
          <HouseholdAddItemFlow householdId={id} open={addOpen} onOpenChange={setAddOpen} />
          <FloatingAddButton onClick={() => setAddOpen(true)} />
        </>
      )}
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
