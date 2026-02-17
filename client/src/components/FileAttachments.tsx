import { useState } from "react";
import { useAttachments, useCreateAttachment, useDeleteAttachment, useAttachmentText } from "@/hooks/use-attachments";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  File,
  Trash2,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import type { Attachment } from "@shared/schema";

const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />;
  if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />;
  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return <FileSpreadsheet className="w-4 h-4" />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation className="w-4 h-4" />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TextPreviewDialog({
  attachment,
  open,
  onClose,
}: {
  attachment: Attachment;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useAttachmentText(open ? attachment.id : 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(attachment.fileType)}
            {attachment.fileName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : data?.extractedText ? (
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground p-4 font-mono leading-relaxed">
              {data.extractedText}
            </pre>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {attachment.fileType.startsWith("image/")
                ? "Image files do not have extractable text content."
                : "No text content was extracted from this file."}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface FileAttachmentsProps {
  decisionId: number;
  context?: string;
  compact?: boolean;
}

export function FileAttachments({
  decisionId,
  context = "decision",
  compact = false,
}: FileAttachmentsProps) {
  const { data: attachmentsList, isLoading } = useAttachments(decisionId);
  const { mutate: createAttachment } = useCreateAttachment();
  const { mutate: deleteAttachment } = useDeleteAttachment();
  const { uploadFile, isUploading, progress } = useUpload();
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, text, or image files.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    const uploadResult = await uploadFile(file);
    if (uploadResult) {
      createAttachment({
        decisionId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        objectPath: uploadResult.objectPath,
        context,
      });
    }

    e.target.value = "";
  };

  const handleDelete = (id: number) => {
    deleteAttachment({ id, decisionId });
  };

  const hasText = (att: Attachment) =>
    att.extractedText && att.extractedText.length > 0;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label
            className="cursor-pointer"
            data-testid="button-attach-file-compact"
          >
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={isUploading}
            >
              <span>
                {isUploading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 mr-1" />
                )}
                Attach
              </span>
            </Button>
          </label>
          {attachmentsList && attachmentsList.length > 0 && (
            <Badge variant="secondary">
              {attachmentsList.length} file{attachmentsList.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {attachmentsList && attachmentsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachmentsList.map((att) => (
              <Badge
                key={att.id}
                variant="outline"
                className="gap-1 pr-1"
                data-testid={`badge-attachment-${att.id}`}
              >
                {getFileIcon(att.fileType)}
                <span className="max-w-[100px] truncate text-xs">{att.fileName}</span>
                {hasText(att) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-0.5 no-default-hover-elevate no-default-active-elevate"
                    onClick={() => setPreviewAttachment(att)}
                    data-testid={`button-preview-${att.id}`}
                  >
                    <Eye className="w-2.5 h-2.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 no-default-hover-elevate no-default-active-elevate"
                  onClick={() => handleDelete(att.id)}
                  data-testid={`button-delete-attachment-${att.id}`}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        {previewAttachment && (
          <TextPreviewDialog
            attachment={previewAttachment}
            open={!!previewAttachment}
            onClose={() => setPreviewAttachment(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Supporting Documents
        </h4>
        <label className="cursor-pointer" data-testid="button-attach-file">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button variant="outline" size="sm" asChild disabled={isUploading}>
            <span>
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isUploading ? `Uploading ${progress}%` : "Upload File"}
            </span>
          </Button>
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : attachmentsList && attachmentsList.length > 0 ? (
        <div className="space-y-2">
          {attachmentsList.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
              data-testid={`attachment-row-${att.id}`}
            >
              <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shrink-0">
                {getFileIcon(att.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(att.fileSize)}
                  {hasText(att) && " \u00B7 Text extracted"}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ visibility: 'visible' }}>
                {hasText(att) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewAttachment(att)}
                    data-testid={`button-preview-${att.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(att.id)}
                  data-testid={`button-delete-attachment-${att.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
          No documents attached yet. Upload PDFs, Word, Excel, or image files.
        </div>
      )}

      {previewAttachment && (
        <TextPreviewDialog
          attachment={previewAttachment}
          open={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  );
}
