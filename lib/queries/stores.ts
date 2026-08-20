"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import type { UserStoreDTO, StoreSearchResultDTO } from "@/lib/types/dto";

export const storeKeys = {
  list: ["stores"] as const,
  search: (q: string) => ["stores", "search", q] as const,
};

export function useStores() {
  return useQuery({
    queryKey: storeKeys.list,
    queryFn: () => apiGet<UserStoreDTO[]>("/api/stores"),
  });
}

export function useStoreSearch(query: string) {
  return useQuery({
    queryKey: storeKeys.search(query),
    queryFn: () => apiGet<StoreSearchResultDTO>(`/api/stores?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  });
}

export type AddStoreInput = { kind: "global"; globalStoreId: string } | { kind: "personal"; name: string };

// docs/03-resolution-flows.md "Store resolution".
export function useAddStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddStoreInput) => apiPost<UserStoreDTO>("/api/stores", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: storeKeys.list }),
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/stores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: storeKeys.list }),
  });
}
