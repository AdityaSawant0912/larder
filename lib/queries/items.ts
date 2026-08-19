"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import type {
  UserItemDTO,
  CatalogSearchResultDTO,
  ItemSelectionInput,
  FormDTO,
  ThresholdDTO,
} from "@/lib/types/dto";
import type { Location } from "@/lib/schemas/shared";

export const itemKeys = {
  pantry: ["items", "pantry"] as const,
  catalog: ["items", "catalog"] as const,
  item: (id: string) => ["items", "item", id] as const,
  search: (q: string) => ["items", "search", q] as const,
};

// Home: only items with live stock (app/api/items/route.ts GET).
export function useCurrentPantry() {
  return useQuery({
    queryKey: itemKeys.pantry,
    queryFn: () => apiGet<UserItemDTO[]>("/api/items"),
  });
}

// Settings/Catalog: every item ever touched.
export function useAllCatalogItems() {
  return useQuery({
    queryKey: itemKeys.catalog,
    queryFn: () => apiGet<UserItemDTO[]>("/api/items?all=true"),
  });
}

export function useCatalogSearch(query: string) {
  return useQuery({
    queryKey: itemKeys.search(query),
    queryFn: () => apiGet<CatalogSearchResultDTO>(`/api/catalog/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  });
}

export interface CreateCatalogItemInput {
  name: string;
  category: string;
  defaultUnit: string;
  defaultShelfLifeDays: number;
  defaultLocation: Location;
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCatalogItemInput) => apiPost<UserItemDTO>("/api/items", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.catalog }),
  });
}

export interface PatchCatalogItemInput {
  id: string;
  name?: string;
  category?: string;
  defaultUnit?: string;
  defaultShelfLifeDays?: number;
  defaultLocation?: Location;
  thresholds?: ThresholdDTO[];
}

export function usePatchCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: PatchCatalogItemInput) =>
      apiPatch<UserItemDTO>(`/api/items/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.catalog });
      qc.invalidateQueries({ queryKey: itemKeys.pantry });
    },
  });
}

export interface ResolveAndAddFormInput {
  selection: ItemSelectionInput;
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
  saveAsDefault?: boolean;
}

// Home's main add path (docs/03-resolution-flows.md).
export function useResolveAndAddForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveAndAddFormInput) =>
      apiPost<{ item: UserItemDTO; form: FormDTO }>("/api/items/resolve-and-add", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.pantry });
      qc.invalidateQueries({ queryKey: itemKeys.catalog });
    },
  });
}

export function useConsumeForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formId, qty }: { itemId: string; formId: string; qty: number }) =>
      apiPatch(`/api/items/${itemId}/forms/${formId}`, { action: "consume", qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.pantry }),
  });
}

export interface ConvertOutput {
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
}

export function useConvertForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      formId,
      outputs,
    }: {
      itemId: string;
      formId: string;
      outputs: ConvertOutput[];
    }) => apiPatch(`/api/items/${itemId}/forms/${formId}`, { action: "convert", outputs }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.pantry }),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formId }: { itemId: string; formId: string }) =>
      apiDelete(`/api/items/${itemId}/forms/${formId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.pantry }),
  });
}

export interface RestockQueueRow {
  selection: ItemSelectionInput;
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
}

// Restock's "Add N to pantry" — commits the client-side staging queue in
// one transaction (docs/07-screens-mobile "Restock mode").
export function useCommitRestock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queue: RestockQueueRow[]) =>
      apiPost<{ ok: true; count: number }>("/api/restock/commit", { queue }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.pantry });
      qc.invalidateQueries({ queryKey: itemKeys.catalog });
    },
  });
}

// Clear-Out's "Discard N items" (docs/07-screens-mobile "Clear-Out mode").
export function useDiscardClearOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (selections: { itemId: string; formId: string }[]) =>
      apiPost<{ ok: true; count: number }>("/api/clear-out/discard", { selections }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.pantry }),
  });
}
