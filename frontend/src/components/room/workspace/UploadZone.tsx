import React, { useState, useRef } from "react";
import { UploadCloud, X, AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { formatFileSize, sanitizeFileName } from "../../common/formatters";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const BLOCKED_EXTENSIONS = ["exe", "bat", "cmd", "sh", "bin", "dll", "msi", "com", "vbs", "ps1", "scr", "jar"];

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  abortController?: AbortController;
}

interface UploadZoneProps {
  isUploading: boolean;
  onUploadFiles: (files: File[]) => Promise<void>;
  queue: UploadQueueItem[];
  onCancelUpload: (id: string) => void;
  onDismissItem: (id: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  isUploading,
  onUploadFiles,
  queue,
  onCancelUpload,
  onDismissItem,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | File[]): File[] => {
    const valid: File[] = [];
    const array = Array.from(files);

    array.forEach((f) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        alert(`File "${f.name}" is an executable and cannot be uploaded.`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        alert(`File "${f.name}" exceeds the maximum 50MB limit.`);
        return;
      }
      valid.push(f);
    });
    return valid;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateFiles(e.dataTransfer.files);
      if (valid.length > 0) {
        await onUploadFiles(valid);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateFiles(e.target.files);
      if (valid.length > 0) {
        await onUploadFiles(valid);
      }
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragOver
            ? "border-indigo-500 bg-indigo-50/60 scale-[1.005]"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/70 bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
        </div>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 tracking-tight">
          Click to browse or drag & drop files here
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          Supported documents, images, audio & video · Max 50MB per file
        </p>
      </div>

      {/* Per-File Progress & Error Queue */}
      {queue.length > 0 && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-56 overflow-y-auto">
          {queue.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-white border border-gray-200/80 shadow-xs flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 truncate" title={item.name}>
                      {sanitizeFileName(item.name)}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{formatFileSize(item.size)}</span>
                  </div>

                  {item.status === "uploading" && (
                    <div className="w-full h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === "error" && (
                    <span className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" />
                      {item.error || "Upload failed"}
                    </span>
                  )}
                </div>
              </div>

              {item.status === "uploading" ? (
                <button
                  type="button"
                  onClick={() => onCancelUpload(item.id)}
                  title="Cancel upload"
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : item.status === "completed" ? (
                <div className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onDismissItem(item.id)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default UploadZone;

