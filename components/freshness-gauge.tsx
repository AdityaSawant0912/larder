"use client";

import { motion } from "framer-motion";
import { wobblePath } from "@/lib/domain/wobblePath";
import type { FreshnessState } from "@/lib/domain/freshness";
import { cn } from "@/lib/utils";

const STATE_COLOR: Record<FreshnessState, string> = {
  fresh: "var(--fresh)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

export interface FreshnessGaugeProps {
  /** 0..1 remaining fraction of shelf life. */
  fraction: number;
  state: FreshnessState;
  /** Stable per-row id so the wobble doesn't reshuffle on re-render. */
  seed: string;
  className?: string;
}

// The design's "one bold move" (docs/06-design-system.md) — a loose,
// hand-wobbled stroke, not a gradient bar. Reserved for freshness only;
// everything else stays quiet around it.
export function FreshnessGauge({ fraction, state, seed, className }: FreshnessGaugeProps) {
  const d = wobblePath(seed);
  const clamped = Math.max(0, Math.min(1, fraction));

  return (
    <svg
      viewBox="0 0 100 12"
      className={cn("h-3 w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke="var(--border)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <motion.path
        d={d}
        pathLength={1}
        fill="none"
        stroke={STATE_COLOR[state]}
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: clamped }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}
