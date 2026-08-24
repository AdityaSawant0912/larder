"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useHouseholds, useCreateHousehold } from "@/lib/queries/households";

export default function HouseholdsPage() {
  const { data: households, isLoading } = useHouseholds();
  const createHousehold = useCreateHousehold();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    await createHousehold.mutateAsync(name.trim());
    setName("");
    setCreateOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Households</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Create household
        </Button>
      </div>

      {!isLoading && (households ?? []).length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No households yet — create one to start sharing a pantry with housemates.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(households ?? []).map((h) => (
          <Link key={h._id} href={`/households/${h._id}`}>
            <Card className="transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between font-display text-xl font-semibold">
                  {h.name}
                  <Users className="size-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {h.memberIds.length} member{h.memberIds.length === 1 ? "" : "s"}
                  {h.isOwner ? " · you're the owner" : ""}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <ResponsiveModal open={createOpen} onOpenChange={setCreateOpen} title="Create household">
        <div className="space-y-3">
          <Input
            placeholder="Household name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button className="w-full" disabled={!name.trim() || createHousehold.isPending} onClick={handleCreate}>
            {createHousehold.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
