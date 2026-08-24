"use client";

import { use, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/item-card";
import { useHouseholdPantry } from "@/lib/queries/households";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { cn } from "@/lib/utils";

// Read-only for now — consume/convert/restock/clear-out on household items
// aren't wired up yet (see the shared-pantry plan's "out of scope").
export default function HouseholdPantryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: items, isLoading } = useHouseholdPantry(id);
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = (items ?? [])
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    .map((item) => ({
      ...item,
      forms: locationFilter === "all" ? item.forms : item.forms.filter((f) => f.location === locationFilter),
    }))
    .filter((item) => item.forms.length > 0);

  return (
    <div>
      <div className="mb-3">
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
          Nothing in this household&apos;s pantry yet — add items from the grocery list.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((item) => (
              <ItemCard key={item._id} item={item} mode="track" readOnly />
            ))}
          </AnimatePresence>
        </div>
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
