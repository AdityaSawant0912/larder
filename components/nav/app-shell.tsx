"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Clock, Settings, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/grocery", label: "Grocery", icon: ShoppingCart },
  { href: "/use-soon", label: "Use Soon", icon: Clock },
  { href: "/households", label: "Households", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const pathname = usePathname();

  return (
    // Sidebar + content centered together as one unit (max-w-5xl content +
    // w-56 sidebar) instead of the sidebar pinned to the viewport edge with
    // content re-centered in whatever's left — that gap was the complaint.
    <div className="mx-auto flex min-h-0 w-full max-w-[78rem] flex-1">
      {/* Desktop: persistent left sidebar (docs/08-screens-desktop.md). */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/60 p-4 md:flex">
        <Logo className="mb-6" />
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="truncate text-xs text-muted-foreground" title={user.email}>
          {user.name || user.email}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile: bottom tab bar, 4 slots (docs/07-screens-mobile.md). */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 backdrop-blur-sm md:hidden">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
