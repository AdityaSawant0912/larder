"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient, useSession } from "@/lib/auth/client";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <h1 className="mb-4 font-display text-3xl">Settings</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Manage</h2>
        <div className="space-y-2">
          <SettingsLink href="/settings/catalog" label="Catalog" />
          <SettingsLink href="/settings/stores" label="Stores" />
          <SettingsLink href="/settings/units" label="Units" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Appearance</h2>
        <ThemeSection />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Account</h2>
        <AccountSection />
      </section>
    </div>
  );
}

function SettingsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
    >
      {label}
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
      <Label htmlFor="theme-select" className="text-sm font-medium">
        Theme
      </Label>
      <Select value={theme ?? "system"} onValueChange={(v) => v && setTheme(v)}>
        <SelectTrigger id="theme-select" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function AccountSection() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
      <div>
        <p className="text-sm font-medium">{session?.user.name || session?.user.email}</p>
        <p className="text-xs text-muted-foreground">{session?.user.email}</p>
      </div>
      <Button
        variant="destructive"
        onClick={async () => {
          await authClient.signOut();
          router.push("/login");
          router.refresh();
        }}
      >
        <LogOut /> Sign out
      </Button>
    </div>
  );
}
