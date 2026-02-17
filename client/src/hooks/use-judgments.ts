import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useJudgments(decisionId: number) {
  return useQuery({
    queryKey: [api.judgments.list.path, decisionId],
    queryFn: async () => {
      const url = buildUrl(api.judgments.list.path, { decisionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch judgments");
      return api.judgments.list.responses[200].parse(await res.json());
    },
    enabled: !!decisionId,
  });
}

export function useSubmitJudgment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ decisionId, data }: { decisionId: number, data: z.infer<typeof api.judgments.create.input> }) => {
      const url = buildUrl(api.judgments.create.path, { decisionId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit judgment");
      }
      return api.judgments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { decisionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.judgments.list.path, decisionId] });
      toast({
        title: "Judgment Sealed",
        description: "Your input has been cryptographically hashed and stored."
      });
    },
    onError: (error) => {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    },
  });
}
