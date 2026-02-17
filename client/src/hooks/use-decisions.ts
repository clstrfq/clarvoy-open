import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useDecisions() {
  return useQuery({
    queryKey: [api.decisions.list.path],
    queryFn: async () => {
      const res = await fetch(api.decisions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch decisions");
      return api.decisions.list.responses[200].parse(await res.json());
    },
  });
}

export function useDecision(id: number) {
  return useQuery({
    queryKey: [api.decisions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.decisions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch decision");
      return api.decisions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.decisions.create.input>) => {
      const res = await fetch(api.decisions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create decision");
      }
      return api.decisions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.decisions.list.path] });
      toast({ title: "Success", description: "Decision case created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: z.infer<typeof api.decisions.update.input> }) => {
      const url = buildUrl(api.decisions.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update decision");
      return api.decisions.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.decisions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.decisions.get.path, id] });
      toast({ title: "Updated", description: "Decision status updated." });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.decisions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete decision");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.decisions.list.path] });
      toast({ title: "Deleted", description: "Decision removed permanently." });
    },
  });
}
