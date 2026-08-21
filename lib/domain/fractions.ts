// Clean, human-nameable splits only (½, ⅓, ¼...) — anything messier is left
// as a plain decimal qty on the source unit. ponytail: no nested fractions —
// consuming a fractional amount of an already-fractional unit (e.g. 1.5
// "half") re-slices using the same word ("half" of "half"), a known naming
// collision. Add unit-aware naming if that turns out to matter in practice.
const FRACTION_UNITS = [
  { denominator: 2, unit: "half" },
  { denominator: 3, unit: "third" },
  { denominator: 4, unit: "quarter" },
] as const;

const EPSILON = 1e-6;

export interface FractionMatch {
  unit: string;
  piecesConsumed: number;
  piecesRemaining: number;
}

// frac must be in (0, 1). Returns the simplest denominator (2 before 3
// before 4) that divides it evenly, or null if it's not a clean fraction.
export function matchCleanFraction(frac: number): FractionMatch | null {
  for (const { denominator, unit } of FRACTION_UNITS) {
    const pieces = frac * denominator;
    const rounded = Math.round(pieces);
    if (Math.abs(pieces - rounded) < EPSILON && rounded >= 1 && rounded < denominator) {
      return { unit, piecesConsumed: rounded, piecesRemaining: denominator - rounded };
    }
  }
  return null;
}
