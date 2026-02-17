import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useComments(decisionId: number) {
  return useQuery({
    queryKey: [api.comments.list.path, decisionId],
    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { decisionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return api.comments.list.responses[200].parse(await res.json());
    },
    enabled: !!decisionId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ decisionId, content }: { decisionId: number; content: string }) => {
      const url = buildUrl(api.comments.create.path, { decisionId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to post comment");
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { decisionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path, decisionId] });
    },
  });
}
