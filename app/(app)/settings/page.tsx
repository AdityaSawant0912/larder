"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CatalogItemEditor } from "@/components/catalog-item-editor";
import { useAllCatalogItems, useCreateCatalogItem } from "@/lib/queries/items";
import { useStores, useAddStore } from "@/lib/queries/stores";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { LOCATIONS, type Location } from "@/lib/schemas/location";
import { authClient, useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: items } = useAllCatalogItems();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const filtered = (items ?? []).filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
  const selected = items?.find((i) => i._id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <h1 className="mb-4 font-display text-3xl">Settings</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">User Catalog</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-2">
            <Input placeholder="Search your catalog..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="space-y-1">
              {filtered.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    selectedId === item._id && "border-primary bg-accent"
                  )}
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items yet.</p>}
            </div>
            <NewCatalogItemForm />
          </div>

          {/* Desktop: master-detail (docs/08). */}
          {isDesktop && (
            <div className="rounded-lg border border-border/60 p-4">
              {selected ? <CatalogItemEditor item={selected} /> : <p className="text-sm text-muted-foreground">Select an item to edit.</p>}
            </div>
          )}
        </div>

        {/* Mobile: list navigates into a sheet (docs/07). */}
        {!isDesktop && (
          <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Edit item</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">{selected && <CatalogItemEditor item={selected} />}</div>
            </SheetContent>
          </Sheet>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Stores</h2>
        <StoresSection />
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

function NewCatalogItemForm() {
  const createItem = useCreateCatalogItem();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("piece");
  const [defaultShelfLifeDays, setDefaultShelfLifeDays] = useState(7);
  const [defaultLocation, setDefaultLocation] = useState<Location>("pantry");

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus /> New catalog item
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Unit" value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} />
        <Input
          type="number"
          min={1}
          value={defaultShelfLifeDays}
          onChange={(e) => setDefaultShelfLifeDays(Number(e.target.value))}
        />
      </div>
      <Select value={defaultLocation} onValueChange={(v) => setDefaultLocation(v as Location)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCATIONS.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="w-full"
        disabled={!name || !category || createItem.isPending}
        onClick={async () => {
          await createItem.mutateAsync({ name, category, defaultUnit, defaultShelfLifeDays, defaultLocation });
          setOpen(false);
          setName("");
          setCategory("");
        }}
      >
        Add
      </Button>
    </div>
  );
}

function StoresSection() {
  const { data: stores } = useStores();
  const addStore = useAddStore();
  const [name, setName] = useState("");

  return (
    <div className="space-y-2">
      {stores?.map((s) => (
        <div key={s._id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
          {s.name}
        </div>
      ))}
      <div className="flex gap-2">
        <Input placeholder="Add a store..." value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          disabled={!name.trim() || addStore.isPending}
          onClick={async () => {
            await addStore.mutateAsync({ kind: "personal", name: name.trim() });
            setName("");
          }}
        >
          <Plus /> Add
        </Button>
      </div>
    </div>
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
        variant="outline"
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
