import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Attachment } from "@shared/schema";

export function useAttachments(decisionId: number) {
  return useQuery<Attachment[]>({
    queryKey: ["/api/decisions", decisionId, "attachments"],
    enabled: decisionId > 0,
  });
}

export function useCreateAttachment() {
  return useMutation({
    mutationFn: async (data: {
      decisionId: number;
      fileName: string;
      fileType: string;
      fileSize: number;
      objectPath: string;
      context?: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/decisions/${data.decisionId}/attachments`,
        data
      );
      return await res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/decisions", variables.decisionId, "attachments"],
      });
    },
  });
}

export function useDeleteAttachment() {
  return useMutation({
    mutationFn: async ({ id, decisionId }: { id: number; decisionId: number }) => {
      await apiRequest("DELETE", `/api/attachments/${id}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/decisions", variables.decisionId, "attachments"],
      });
    },
  });
}

export function useAttachmentText(id: number) {
  return useQuery<{ extractedText: string }>({
    queryKey: ["/api/attachments", id, "text"],
    enabled: id > 0,
  });
}
