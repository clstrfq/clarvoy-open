import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GrantAlertListResult, GrantAlertStatus } from "@shared/mcp-schemas";

export function useGrantAlerts(status?: GrantAlertStatus) {
  const searchParams = new URLSearchParams();
  if (status) searchParams.set("status", status);

  return useQuery<GrantAlertListResult>({
    queryKey: ["/api/grants/alerts", status],
    queryFn: async () => {
      const url = status
        ? `/api/grants/alerts?status=${status}`
        : "/api/grants/alerts";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch grant alerts");
      return res.json();
    },
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: GrantAlertStatus;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/grants/alerts/${id}/status`,
        { status }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants/alerts"] });
    },
  });
}

export function useAlertCount() {
  const { data } = useGrantAlerts();
  return data?.newCount ?? 0;
}
