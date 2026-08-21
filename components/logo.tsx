// Jar mark: lid + neck + body, with a cut-out fill line echoing the
// freshness gauge — "what's left" is this app's one signature visual idea
// (docs/06-design-system.md), so the mark repeats it. Kept as flat filled
// rects, not a path, so it stays legible shrunk down to a 16px favicon
// (app/icon.svg is the same geometry, standalone since favicons can't read
// this file's CSS variables).
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect fill="var(--primary)" x="7.5" y="2" width="9" height="2.75" rx="1.2" />
      <rect fill="var(--primary)" x="8.75" y="4.25" width="6.5" height="2" />
      <rect fill="var(--primary)" x="4" y="5.75" width="16" height="16" rx="3.5" />
      <rect fill="var(--background)" x="4.75" y="13.25" width="14.5" height="1.6" />
    </svg>
  );
}

export function Logo({ className, markClassName = "size-7" }: { className?: string; markClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className={markClassName} />
      <span className="font-display text-3xl leading-none">Larder</span>
    </span>
  );
}
