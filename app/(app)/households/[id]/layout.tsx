"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHousehold } from "@/lib/queries/households";
import { cn } from "@/lib/utils";

const SUB_NAV = [
  { segment: "pantry", label: "Pantry" },
  { segment: "grocery", label: "Grocery List" },
  { segment: "settings", label: "Settings" },
];

export default function HouseholdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const { data: detail } = useHousehold(id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <div className="mb-4">
        <Link href="/households" className="text-xs text-muted-foreground hover:text-foreground">
          ← Households
        </Link>
        <h1 className="font-display text-3xl">{detail?.household.name ?? "..."}</h1>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        {SUB_NAV.map(({ segment, label }) => {
          const href = `/households/${id}/${segment}`;
          const active = pathname === href;
          return (
            <Link
              key={segment}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
