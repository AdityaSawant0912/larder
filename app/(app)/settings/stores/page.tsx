"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStores, useAddStore } from "@/lib/queries/stores";

export default function StoresSettingsPage() {
  const { data: stores } = useStores();
  const addStore = useAddStore();
  const [name, setName] = useState("");

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <Link href="/settings" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <h1 className="mb-4 font-display text-3xl">Stores</h1>

      <div className="space-y-2">
        {stores?.map((s) => (
          <div key={s._id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
            {s.name}
          </div>
        ))}
        {stores?.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No stores yet.</p>}
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
    </div>
  );
}
