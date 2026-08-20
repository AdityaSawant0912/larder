"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { UserUnitPresetDTO } from "@/lib/types/dto";

export const unitPresetKeys = {
  forCategory: (category: string, itemId?: string) => ["unitPresets", category, itemId ?? null] as const,
  list: ["unitPresets"] as const,
};

// Settings > User Units — every category this user has taught a custom unit.
export function useAllUnitPresets() {
  return useQuery({
    queryKey: unitPresetKeys.list,
    queryFn: () => apiGet<UserUnitPresetDTO[]>("/api/unit-presets"),
  });
}

// Picker source order: item's own units -> learned -> static presets
// (docs/02-database-schema.md "Units — presets over free text").
export function useUnitPresets(category: string, itemId?: string) {
  return useQuery({
    queryKey: unitPresetKeys.forCategory(category, itemId),
    queryFn: () => {
      const params = new URLSearchParams({ category });
      if (itemId) params.set("itemId", itemId);
      return apiGet<{ units: string[] }>(`/api/unit-presets?${params.toString()}`);
    },
    enabled: category.trim().length > 0,
  });
}

// "Other ->" manual entry writes back so it's offered next time.
export function useLearnUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ category, unit }: { category: string; unit: string }) =>
      apiPost("/api/unit-presets", { category, unit }),
    onSuccess: (_data, { category }) => {
      qc.invalidateQueries({ queryKey: ["unitPresets", category] });
      qc.invalidateQueries({ queryKey: unitPresetKeys.list });
    },
  });
}
