import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  GrantDiscoverInput,
  GrantDiscoverResult,
  GrantAgenciesInput,
  GrantAgenciesResult,
  GrantTrendsInput,
  GrantTrendsResult,
} from "@shared/mcp-schemas";

export function useGrantDiscovery() {
  return useMutation<GrantDiscoverResult, Error, GrantDiscoverInput>({
    mutationFn: async (params) => {
      const res = await apiRequest("POST", "/api/grants/discover", params);
      return res.json();
    },
  });
}

export function useAgencyLandscape() {
  return useMutation<GrantAgenciesResult, Error, GrantAgenciesInput>({
    mutationFn: async (params) => {
      const res = await apiRequest("POST", "/api/grants/agencies", params);
      return res.json();
    },
  });
}

export function useFundingTrends() {
  return useMutation<GrantTrendsResult, Error, GrantTrendsInput>({
    mutationFn: async (params) => {
      const res = await apiRequest("POST", "/api/grants/trends", params);
      return res.json();
    },
  });
}
