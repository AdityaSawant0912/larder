"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { UseSoonRowDTO } from "@/lib/types/dto";

export const useSoonKey = ["useSoon"] as const;

export function useUseSoon() {
  return useQuery({
    queryKey: useSoonKey,
    queryFn: () => apiGet<UseSoonRowDTO[]>("/api/use-soon"),
  });
}
