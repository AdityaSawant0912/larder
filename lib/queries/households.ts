"use client";

import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import type {
  HouseholdDTO,
  HouseholdDetailDTO,
  HouseholdInviteDTO,
  HouseholdItemDTO,
  HouseholdCatalogSearchResultDTO,
  HouseholdGroceryListItemDTO,
  HouseholdGroceryAddSelectionInput,
  ResolveAndAddHouseholdFormInput,
  FormDTO,
} from "@/lib/types/dto";
import type { Location } from "@/lib/schemas/shared";

export const householdKeys = {
  list: ["households"] as const,
  detail: (id: string) => ["households", id] as const,
  invite: (id: string) => ["households", id, "invite"] as const,
  pantry: (id: string) => ["households", id, "pantry"] as const,
  groceryList: (id: string) => ["households", id, "groceryList"] as const,
};

export function useHouseholds() {
  return useQuery({
    queryKey: householdKeys.list,
    queryFn: () => apiGet<HouseholdDTO[]>("/api/households"),
  });
}

export function useHousehold(id: string) {
  return useQuery({
    queryKey: householdKeys.detail(id),
    queryFn: () => apiGet<HouseholdDetailDTO>(`/api/households/${id}`),
    enabled: !!id,
  });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiPost<HouseholdDTO>("/api/households", { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.list });
      toast.success("Household created");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't create household"),
  });
}

export function useDeleteHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/households/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.list });
      toast.success("Household deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't delete household"),
  });
}

export function useRemoveHouseholdMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, userId }: { householdId: string; userId: string }) =>
      apiDelete(`/api/households/${householdId}/members/${userId}`),
    onSuccess: (_data, { householdId }) => {
      qc.invalidateQueries({ queryKey: householdKeys.detail(householdId) });
      toast.success("Member removed");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove member"),
  });
}

export function useLeaveHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (householdId: string) => apiPost(`/api/households/${householdId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.list });
      toast.success("Left household");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't leave household"),
  });
}

export function useHouseholdInvite(id: string) {
  return useQuery({
    queryKey: householdKeys.invite(id),
    queryFn: () => apiGet<HouseholdInviteDTO>(`/api/households/${id}/invite`),
    enabled: !!id,
  });
}

export function useRegenerateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (householdId: string) => apiPost<HouseholdInviteDTO>(`/api/households/${householdId}/invite/regenerate`),
    onSuccess: (_data, householdId) => {
      qc.invalidateQueries({ queryKey: householdKeys.invite(householdId) });
      toast.success("New invite link generated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't regenerate invite"),
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (token: string) => apiPost<{ householdId: string }>(`/api/invites/${token}/accept`),
  });
}

// One query per household — simple, react-query parallelizes it fine for
// the handful of households a user is expected to belong to.
export function useHouseholdPantry(householdId: string) {
  return useQuery({
    queryKey: householdKeys.pantry(householdId),
    queryFn: () => apiGet<HouseholdItemDTO[]>(`/api/households/${householdId}/items`),
    enabled: !!householdId,
  });
}

// Household Pantry tab's "Add" — direct add, no grocery list detour
// (mirrors useResolveAndAddForm in lib/queries/items.ts).
export function useResolveAndAddHouseholdForm(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveAndAddHouseholdFormInput) =>
      apiPost<{ item: HouseholdItemDTO; form: FormDTO }>(`/api/households/${householdId}/items/resolve-and-add`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.pantry(householdId) });
      toast.success("Added to household pantry");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add item"),
  });
}

// Merges every household the user belongs to into one flat, badge-tagged
// list — for Home's "your pantry + everything shared with you" view. One
// query per household; react-query parallelizes them, fine for the
// handful of households a user is expected to belong to.
export interface HouseholdPantryItem extends HouseholdItemDTO {
  householdName: string;
}

export function useAllHouseholdPantries(): { items: HouseholdPantryItem[]; isLoading: boolean } {
  const { data: households, isLoading: householdsLoading } = useHouseholds();
  const list = households ?? [];

  const results = useQueries({
    queries: list.map((h) => ({
      queryKey: householdKeys.pantry(h._id),
      queryFn: () => apiGet<HouseholdItemDTO[]>(`/api/households/${h._id}/items`),
    })),
  });

  const items = list.flatMap((h, i) => {
    const data = results[i]?.data ?? [];
    return data.map((item) => ({ ...item, householdName: h.name }));
  });

  return { items, isLoading: householdsLoading || results.some((r) => r.isLoading) };
}

export function useHouseholdCatalogSearch(householdId: string, query: string) {
  return useQuery({
    queryKey: ["households", householdId, "catalogSearch", query] as const,
    queryFn: () =>
      apiGet<HouseholdCatalogSearchResultDTO>(
        `/api/households/${householdId}/catalog/search?q=${encodeURIComponent(query)}`
      ),
    enabled: !!householdId && query.trim().length > 0,
  });
}

export function useHouseholdGroceryList(householdId: string) {
  return useQuery({
    queryKey: householdKeys.groceryList(householdId),
    queryFn: () => apiGet<HouseholdGroceryListItemDTO[]>(`/api/households/${householdId}/grocery-list`),
    enabled: !!householdId,
  });
}

export interface AddHouseholdGroceryItemInput {
  selection: HouseholdGroceryAddSelectionInput;
  qty: number;
  unit: string;
}

export function useAddHouseholdGroceryItem(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddHouseholdGroceryItemInput) =>
      apiPost<HouseholdGroceryListItemDTO>(`/api/households/${householdId}/grocery-list`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.groceryList(householdId) });
      toast.success("Added to grocery list");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add item"),
  });
}

export function useToggleHouseholdGroceryChecked(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      apiPatch(`/api/households/${householdId}/grocery-list/${id}`, { checked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: householdKeys.groceryList(householdId) }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update item"),
  });
}

export function useDeleteHouseholdGroceryItem(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/households/${householdId}/grocery-list/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.groceryList(householdId) });
      toast.success("Removed from list");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove item"),
  });
}

export interface HouseholdBulkAddRow {
  groceryListItemId: string;
  location?: Location;
  shelfLifeDays?: number;
}

export function useAddAllToHouseholdPantry(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: HouseholdBulkAddRow[]) =>
      apiPost<{ ok: true; count: number }>(`/api/households/${householdId}/grocery-list/add-to-pantry`, { rows }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: householdKeys.groceryList(householdId) });
      qc.invalidateQueries({ queryKey: householdKeys.pantry(householdId) });
      toast.success(`Added ${data.count} item${data.count === 1 ? "" : "s"} to pantry`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add items"),
  });
}

// Household pantry item actions — mirror items.ts's useConsumeForm/
// useConvertForm/useDeleteForm, hitting the household-scoped routes and
// invalidating householdKeys.pantry (shared by both the household's own
// Pantry tab and Home's merged view).
export function useConsumeHouseholdForm(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formId, qty }: { itemId: string; formId: string; qty: number }) =>
      apiPatch(`/api/households/${householdId}/items/${itemId}/forms/${formId}`, { action: "consume", qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: householdKeys.pantry(householdId) }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't consume item"),
  });
}

export interface HouseholdConvertOutput {
  unit: string;
  qty: number;
  location: Location;
  shelfLifeDays: number;
  note?: string;
}

export function useConvertHouseholdForm(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      formId,
      qty,
      outputs,
    }: {
      itemId: string;
      formId: string;
      qty: number;
      outputs: HouseholdConvertOutput[];
    }) => apiPatch(`/api/households/${householdId}/items/${itemId}/forms/${formId}`, { action: "convert", qty, outputs }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: householdKeys.pantry(householdId) });
      toast.success("Converted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't convert item"),
  });
}

export function useDeleteHouseholdForm(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formId }: { itemId: string; formId: string }) =>
      apiDelete(`/api/households/${householdId}/items/${itemId}/forms/${formId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: householdKeys.pantry(householdId) }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove item"),
  });
}

// Household Pantry tab's Clear-Out mode — mirrors useDiscardClearOut in
// items.ts. No household Restock (not requested).
export function useDiscardHouseholdClearOut(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (selections: { itemId: string; formId: string }[]) =>
      apiPost<{ ok: true; count: number }>(`/api/households/${householdId}/clear-out/discard`, { selections }),
    onSuccess: () => qc.invalidateQueries({ queryKey: householdKeys.pantry(householdId) }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't discard items"),
  });
}
