"use client";

import { Plus } from "lucide-react";

// Mobile only — desktop keeps the inline header "Add" button instead
// (same fixed bottom-20/right-4 slot as Home's clear-out discard bar).
export function FloatingAddButton({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="size-6" />
    </button>
  );
}
