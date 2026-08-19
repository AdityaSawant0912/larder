// Deterministic per-item "hand-wobble" so the same freshness gauge draws
// the same loose chalk stroke across renders (docs/06-design-system.md
// "Signature element" — a wobbled stroke, not a gradient progress bar).
function seedNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return hash;
}

export function wobblePath(seed: string, width = 100, height = 12, segments = 8): string {
  const seedN = seedNumber(seed);
  const midY = height / 2;
  const amplitude = height * 0.28;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (width / segments) * i;
    const wobble = Math.sin(seedN * 0.013 + i * 1.7) * amplitude;
    points.push([x, midY + wobble]);
  }

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const midX = (x0 + x1) / 2;
    d += ` Q ${midX} ${y0}, ${x1} ${y1}`;
  }
  return d;
}
