"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import { groceryKeys } from "@/lib/queries/groceryList";
import type { ListTemplateDTO, TemplateItemDTO } from "@/lib/types/dto";

export const templateKeys = {
  list: ["templates"] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list,
    queryFn: () => apiGet<ListTemplateDTO[]>("/api/templates"),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; items: TemplateItemDTO[] }) =>
      apiPost<ListTemplateDTO>("/api/templates", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.list }),
  });
}

// "Repeat list" — drops a saved template into the grocery list in one
// action (docs/01-product-overview.md).
export function useApplyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/api/templates/${id}/apply`),
    onSuccess: () => qc.invalidateQueries({ queryKey: groceryKeys.list }),
  });
}
