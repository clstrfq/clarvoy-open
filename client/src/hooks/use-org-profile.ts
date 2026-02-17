import { useQuery } from "@tanstack/react-query";
import type { OrgProfile } from "@shared/mcp-schemas";

export function useOrgProfile() {
  return useQuery<OrgProfile>({
    queryKey: ["/api/org/profile"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
