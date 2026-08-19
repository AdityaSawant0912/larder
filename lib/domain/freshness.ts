export function daysLeft(addedDate: Date, shelfLifeDays: number, now = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsed = Math.floor((now.getTime() - addedDate.getTime()) / msPerDay);
  return shelfLifeDays - elapsed;
}

export type FreshnessState = "fresh" | "warning" | "danger";

// Absolute days left, not % of shelf life — a 1-day item must read as
// urgent on day one, not "full and green" just because it's fresh relative
// to its own (short) shelf life. Matches the sage/amber/coral palette in
// docs/06-design-system.md.
export function freshnessState(remaining: number): FreshnessState {
  if (remaining <= 2) return "danger";
  if (remaining <= 5) return "warning";
  return "fresh";
}

// Bar fills relative to this many days out, capped — so bar length also
// reads as absolute urgency, not shelf-life-relative progress.
export const FRESHNESS_GAUGE_CEILING_DAYS = 7;
