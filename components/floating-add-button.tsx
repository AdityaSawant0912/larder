"use client";

import { Plus } from "lucide-react";

// Same fixed bottom-right slot as Home's clear-out discard bar (docs/07-08):
// bottom-20/right-4 on mobile to clear the tab bar, bottom-6/right-6 on desktop.
export function FloatingAddButton({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
    >
      <Plus className="size-6" />
    </button>
  );
}
