export function daysLeft(addedDate: Date, shelfLifeDays: number, now = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsed = Math.floor((now.getTime() - addedDate.getTime()) / msPerDay);
  return shelfLifeDays - elapsed;
}

export type FreshnessState = "fresh" | "warning" | "danger";

// >33% of shelf life left = fresh, >10% = warning, else danger — matches
// the sage/amber/coral three-state palette in docs/06-design-system.md.
export function freshnessState(remaining: number, shelfLifeDays: number): FreshnessState {
  if (shelfLifeDays <= 0) return "danger";
  const ratio = remaining / shelfLifeDays;
  if (ratio > 1 / 3) return "fresh";
  if (ratio > 0.1) return "warning";
  return "danger";
}
