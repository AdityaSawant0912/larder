"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { UseSoonRowDTO } from "@/lib/types/dto";

export function useUseSoon() {
  return useQuery({
    queryKey: ["useSoon"],
    queryFn: () => apiGet<UseSoonRowDTO[]>("/api/use-soon"),
  });
}
