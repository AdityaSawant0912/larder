"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type HomeMode = "track" | "clearOut" | "restock";

const MODES: { value: HomeMode; label: string }[] = [
  { value: "track", label: "Track" },
  { value: "clearOut", label: "Clear-Out" },
  { value: "restock", label: "Restock" },
];

// docs/07 (mode toggle near top of Home) / docs/08 (moves into the top
// bar on desktop) — one component reused in both positions, per its
// containing layout's Tailwind classes.
export function ModeToggle({ mode, onModeChange }: { mode: HomeMode; onModeChange: (mode: HomeMode) => void }) {
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as HomeMode)}>
      <TabsList>
        {MODES.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
