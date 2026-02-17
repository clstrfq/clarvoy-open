import { useQuery } from "@tanstack/react-query";
import type {
  CharityLookupResult,
  CharitySearchResult,
  CharityVerification,
} from "@shared/mcp-schemas";

export function useCharityLookup(ein: string) {
  return useQuery<CharityLookupResult>({
    queryKey: ["/api/charity/lookup", ein],
    queryFn: async () => {
      const res = await fetch(`/api/charity/lookup/${encodeURIComponent(ein)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Charity lookup failed");
      }
      return res.json();
    },
    enabled: !!ein && ein.replace(/-/g, "").length === 9,
  });
}

export function useCharitySearch(params: {
  query: string;
  city?: string;
  state?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.query) searchParams.set("query", params.query);
  if (params.city) searchParams.set("city", params.city);
  if (params.state) searchParams.set("state", params.state);
  if (params.limit) searchParams.set("limit", String(params.limit));

  return useQuery<CharitySearchResult>({
    queryKey: ["/api/charity/search", params],
    queryFn: async () => {
      const res = await fetch(`/api/charity/search?${searchParams}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Charity search failed");
      }
      return res.json();
    },
    enabled: params.query.length >= 2,
  });
}

export function useCharityVerify(ein: string) {
  return useQuery<CharityVerification>({
    queryKey: ["/api/charity/verify", ein],
    queryFn: async () => {
      const res = await fetch(`/api/charity/verify/${encodeURIComponent(ein)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Charity verification failed");
      }
      return res.json();
    },
    enabled: !!ein && ein.replace(/-/g, "").length === 9,
  });
}
