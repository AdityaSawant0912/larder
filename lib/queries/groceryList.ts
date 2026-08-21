"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import { itemKeys } from "@/lib/queries/items";
import type { GroceryListItemDTO, GroceryAddSelectionInput } from "@/lib/types/dto";
import type { Location } from "@/lib/schemas/shared";

export const groceryKeys = {
  list: ["groceryList"] as const,
};

export function useGroceryList() {
  return useQuery({
    queryKey: groceryKeys.list,
    queryFn: () => apiGet<GroceryListItemDTO[]>("/api/grocery-list"),
  });
}

export interface AddGroceryItemInput {
  selection: GroceryAddSelectionInput;
  qty: number;
  unit: string;
  storeId: string | null;
}

export function useAddGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddGroceryItemInput) => apiPost<GroceryListItemDTO>("/api/grocery-list", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groceryKeys.list });
      toast.success("Added to grocery list");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add item"),
  });
}

// Checklist mode's strike-through toggle — the strike-through itself is the
// feedback, doesn't touch the pantry, no toast needed.
export function useToggleGroceryChecked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      apiPatch(`/api/grocery-list/${id}`, { checked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: groceryKeys.list }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update item"),
  });
}

export function useDeleteGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/grocery-list/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groceryKeys.list });
      toast.success("Removed from list");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove item"),
  });
}

export interface BulkAddRow {
  groceryListItemId: string;
  location?: Location;
  shelfLifeDays?: number;
}

// Review mode's "Add all to pantry" bulk-commit.
export function useAddAllToPantry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: BulkAddRow[]) =>
      apiPost<{ ok: true; count: number }>("/api/grocery-list/add-to-pantry", { rows }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: groceryKeys.list });
      qc.invalidateQueries({ queryKey: itemKeys.pantry });
      qc.invalidateQueries({ queryKey: itemKeys.catalog });
      toast.success(`Added ${data.count} item${data.count === 1 ? "" : "s"} to pantry`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add items"),
  });
}
