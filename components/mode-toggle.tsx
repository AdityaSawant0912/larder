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
// containing layout's Tailwind classes. `modes` restricts which tabs show
// (e.g. household Pantry only offers Track/Clear-Out, no Restock).
export function ModeToggle({
  mode,
  onModeChange,
  modes = MODES.map((m) => m.value),
}: {
  mode: HomeMode;
  onModeChange: (mode: HomeMode) => void;
  modes?: HomeMode[];
}) {
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as HomeMode)}>
      <TabsList>
        {MODES.filter((m) => modes.includes(m.value)).map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
