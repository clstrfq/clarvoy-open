import { useState, useCallback } from "react";

export interface UploadResponse {
  fileName: string;
  objectPath: string;
  fileType: string;
  fileSize: number;
}

interface UseUploadOptions {
  onSuccess?: (result: UploadResponse) => void;
  onError?: (error: string) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File): Promise<UploadResponse | null> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Upload failed");
      }

      setProgress(100);
      const data: UploadResponse = await response.json();
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      options.onError?.(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  return { uploadFile, isUploading, progress };
}
