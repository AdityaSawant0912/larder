"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Minus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { FreshnessGauge } from "@/components/freshness-gauge";
import { ConvertDialog } from "@/components/convert-dialog";
import { useConsumeForm, useDeleteForm } from "@/lib/queries/items";
import { useConsumeHouseholdForm, useDeleteHouseholdForm } from "@/lib/queries/households";
import { daysLeft, freshnessState, FRESHNESS_GAUGE_CEILING_DAYS } from "@/lib/domain/freshness";
import { cn } from "@/lib/utils";
import type { FormDTO } from "@/lib/types/dto";

export type ItemCardMode = "track" | "clearOut";

// A minimal shape both UserItemDTO and a household item (plus its
// householdName tag) satisfy — lets ItemCard render either.
export interface ItemCardData {
  _id: string;
  name: string;
  category: string;
  forms: FormDTO[];
}

export function ItemCard({
  item,
  mode,
  selectedFormIds,
  onToggleSelect,
  householdBadge,
  householdId,
}: {
  item: ItemCardData;
  mode: ItemCardMode;
  selectedFormIds?: Set<string>;
  onToggleSelect?: (itemId: string, formId: string) => void;
  // Set when this card is a shared item merged in from a household's
  // pantry — shows which household it belongs to.
  householdBadge?: string;
  // Set for any household item (merged into Home, or on the household's
  // own Pantry tab) — routes consume/convert/delete through the
  // household-scoped API instead of the personal one.
  householdId?: string;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 font-display text-xl font-semibold">
            {item.name}
            {householdBadge && (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-normal text-accent-foreground">
                {householdBadge}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence initial={false}>
            {item.forms.map((form) => (
              <FormRow
                key={form.id}
                itemId={item._id}
                category={item.category}
                form={form}
                mode={mode}
                selected={selectedFormIds?.has(form.id) ?? false}
                onToggleSelect={onToggleSelect}
                householdId={householdId}
              />
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FormRow({
  itemId,
  category,
  form,
  mode,
  selected,
  onToggleSelect,
  householdId,
}: {
  itemId: string;
  category: string;
  form: FormDTO;
  mode: ItemCardMode;
  selected: boolean;
  onToggleSelect?: (itemId: string, formId: string) => void;
  householdId?: string;
}) {
  const [convertOpen, setConvertOpen] = useState(false);
  const [consumeQty, setConsumeQty] = useState(1);
  const personalConsume = useConsumeForm();
  const personalDelete = useDeleteForm();
  const householdConsume = useConsumeHouseholdForm(householdId ?? "");
  const householdDelete = useDeleteHouseholdForm(householdId ?? "");
  const consumeForm = householdId ? householdConsume : personalConsume;
  const deleteForm = householdId ? householdDelete : personalDelete;

  const remaining = daysLeft(new Date(form.addedDate), form.shelfLifeDays);
  const state = freshnessState(remaining);
  const fraction = Math.max(0, remaining) / FRESHNESS_GAUGE_CEILING_DAYS;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5"
    >
      {mode === "clearOut" ? (
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelect?.(itemId, form.id)} />
      ) : null}

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-sm">
            {form.qty} {form.unit}
            <span className="ml-1.5 text-muted-foreground">· {form.location}</span>
          </span>
          <span
            className={cn(
              "font-mono text-xs",
              state === "danger" ? "text-danger" : state === "warning" ? "text-warning" : "text-muted-foreground"
            )}
          >
            {remaining >= 0 ? `${remaining}d left` : `${Math.abs(remaining)}d over`}
          </span>
        </div>
        <FreshnessGauge fraction={fraction} state={state} seed={form.id} />
      </div>

      {mode === "track" && (
        <div className="flex shrink-0 items-center gap-0.5">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Consume">
                  <Minus />
                </Button>
              }
            />
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Input
                  type="number"
                  min={0.01}
                  max={form.qty}
                  step="any"
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(Number(e.target.value))}
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={consumeForm.isPending}
                  onClick={() => consumeForm.mutate({ itemId, formId: form.id, qty: consumeQty })}
                >
                  Consume
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon-sm" aria-label="Convert" onClick={() => setConvertOpen(true)}>
            <Repeat />
          </Button>

          <Button
            variant="destructive"
            size="icon-sm"
            aria-label="Delete"
            disabled={deleteForm.isPending}
            onClick={() => deleteForm.mutate({ itemId, formId: form.id })}
          >
            <Trash2 />
          </Button>

          <ConvertDialog
            itemId={itemId}
            category={category}
            form={form}
            open={convertOpen}
            onOpenChange={setConvertOpen}
            householdId={householdId}
          />
        </div>
      )}
    </motion.div>
  );
}
