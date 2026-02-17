import { useQuery } from "@tanstack/react-query";
import type { McpStatus } from "@shared/mcp-schemas";

export function useMcpStatus() {
  return useQuery<McpStatus>({
    queryKey: ["/api/mcp/status"],
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
