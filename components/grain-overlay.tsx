// Fractal-noise grain overlay for the board (page background) only, per
// docs/06-design-system.md. Rendered once in the root layout.
export function GrainOverlay() {
  return (
    <svg className="board-grain" aria-hidden="true">
      <filter id="board-grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#board-grain-filter)" />
    </svg>
  );
}
