import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  uploadRoomDocument,
  getRoomDocuments,
  getRoomDocumentFile,
  deleteRoomDocument,
} from "../../services/documentServices";
import { useSocket } from "../../context/SocketContext";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  FileText,
  Download,
  UploadCloud,
  Loader2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Archive,
  Eye,
} from "lucide-react";

interface RoomDocument {
  _id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploaderId?: { _id?: string; username?: string } | string | null;
  createdAt: string;
}

export type PreviewCategory = "image" | "pdf" | "text" | "video" | "audio" | "unsupported";

const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "sh",
  "bin",
  "dll",
  "msi",
  "com",
  "vbs",
  "ps1",
  "scr",
  "jar",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const getEffectiveMimeType = (mimeType?: string, fileName?: string): string => {
  if (mimeType && mimeType !== "application/octet-stream" && mimeType.trim() !== "") {
    return mimeType.toLowerCase().split(";")[0].trim();
  }
  if (!fileName) return "application/octet-stream";
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "bmp":
      return "image/bmp";
    case "ico":
      return "image/x-icon";
    case "txt":
      return "text/plain";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "md":
      return "text/markdown";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "zip":
    case "tar":
    case "gz":
    case "rar":
    case "7z":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
};

export const getDocumentPreviewType = (mimeType?: string, fileName?: string): PreviewCategory => {
  const type = getEffectiveMimeType(mimeType, fileName);
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("text/") || type === "application/json" || type === "text/csv" || type === "text/markdown")
    return "text";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "unsupported";
};

const getDocumentIcon = (mimeType?: string, fileName?: string) => {
  const previewType = getDocumentPreviewType(mimeType, fileName);
  switch (previewType) {
    case "pdf":
      return <FileText className="w-5 h-5 text-rose-500" />;
    case "image":
      return <ImageIcon className="w-5 h-5 text-indigo-500" />;
    case "video":
      return <Film className="w-5 h-5 text-purple-500" />;
    case "audio":
      return <Music className="w-5 h-5 text-amber-500" />;
    case "text":
      return <FileCode className="w-5 h-5 text-blue-500" />;
    default: {
      const ext = (fileName || "").toLowerCase().split(".").pop();
      if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
        return <Archive className="w-5 h-5 text-emerald-500" />;
      }
      return <File className="w-5 h-5 text-gray-500" />;
    }
  }
};

const getUploaderName = (uploaderId?: { _id?: string; username?: string } | string | null): string => {
  if (!uploaderId) return "Workspace Member";
  if (typeof uploaderId === "object") {
    return uploaderId.username || "Workspace Member";
  }
  return "Workspace Member";
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (iso: string): string => {
  if (!iso) return "–";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};

interface Toast {
  type: "success" | "error";
  message: string;
}

export const RoomDocuments = ({ roomId }: { roomId: string }) => {
  const { socket } = useSocket();

  const [documents, setDocuments] = useState<RoomDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");

  // Toast Notification State
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete Confirmation State
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<RoomDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Preview Modal State
  const [documentToView, setDocumentToView] = useState<RoomDocument | null>(null);
  const [viewFile, setViewFile] = useState<{
    documentId: string;
    status: "loading" | "ready" | "error" | "unsupported";
    previewType: PreviewCategory;
    url?: string;
    textContent?: string;
    errorMessage?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Load documents
  useEffect(() => {
    getRoomDocuments(roomId)
      .then((res) => {
        setDocuments(res.data?.data || res.data || []);
      })
      .catch((err) => {
        showToast("error", err?.response?.data?.message || "Failed to load documents");
      })
      .finally(() => setLoading(false));

    const handleNewDocument = (newDoc: RoomDocument) => {
      setDocuments((prev) => [newDoc, ...prev.filter((d) => d._id !== newDoc._id)]);
    };

    const handleDeleteDocument = (deletedId: string) => {
      setDocuments((prev) => prev.filter((doc) => doc._id !== deletedId));
    };

    socket.on("room:new-document", handleNewDocument);
    socket.on("room:delete-document", handleDeleteDocument);

    return () => {
      socket.off("room:new-document", handleNewDocument);
      socket.off("room:delete-document", handleDeleteDocument);
    };
  }, [roomId, socket, showToast]);

  // Document preview loader
  const viewDocumentId = documentToView?._id;
  const viewDocumentMimeType = documentToView?.mimeType;
  const viewDocumentName = documentToView?.originalName;

  useEffect(() => {
    if (!viewDocumentId || !documentToView) return;

    const previewType = getDocumentPreviewType(viewDocumentMimeType, viewDocumentName);
    if (previewType === "unsupported") {
      setViewFile({
        documentId: viewDocumentId,
        status: "unsupported",
        previewType: "unsupported",
      });
      return;
    }

    let active = true;
    setViewFile({
      documentId: viewDocumentId,
      status: "loading",
      previewType,
    });

    getRoomDocumentFile(roomId, viewDocumentId)
      .then(async (response) => {
        const downloadUrl = response.data?.data?.downloadUrl;
        if (!downloadUrl) throw new Error("No download URL returned from server");

        let textContent: string | undefined;
        if (previewType === "text") {
          try {
            const textResponse = await fetch(downloadUrl);
            textContent = await textResponse.text();
          } catch {
            // ignore text decode error
          }
        }

        if (active) {
          setViewFile({
            documentId: viewDocumentId,
            status: "ready",
            previewType,
            url: downloadUrl,
            textContent,
          });
        }
      })
      .catch((error: unknown) => {
        const errorMsg =
          error && typeof error === "object" && "response" in error
            ? (error as any).response?.data?.message ||
              "Could not open this document. Try downloading it."
            : "Could not open this document. Try downloading it.";

        if (active) {
          setViewFile({
            documentId: viewDocumentId,
            status: "error",
            previewType,
            errorMessage: errorMsg,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [roomId, viewDocumentId, viewDocumentMimeType, viewDocumentName]);

  // Validation function
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatSize(file.size)}) exceeds the 50MB maximum limit.`;
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return `.${ext} files are not permitted for security reasons.`;
    }
    return null;
  };

  // Process File Upload
  const processUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      showToast("error", validationError);
      return;
    }

    try {
      setUploading(true);
      setUploadFileName(file.name);
      setUploadProgress(0);

      const res = await uploadRoomDocument(roomId, file, (percent) => {
        setUploadProgress(percent);
      });

      const uploadedDoc = res.data?.data || res.data;
      if (uploadedDoc) {
        setDocuments((prev) => [uploadedDoc, ...prev.filter((d) => d._id !== uploadedDoc._id)]);
      }

      showToast("success", `"${file.name}" uploaded successfully.`);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to upload document.";
      showToast("error", message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUpload(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUpload(file);
    }
  };

  // Download Handler
  const handleDownload = async (doc: RoomDocument) => {
    try {
      const response = await getRoomDocumentFile(roomId, doc._id);
      const downloadUrl = response.data?.data?.downloadUrl;
      if (!downloadUrl) throw new Error("Download URL could not be generated");

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = doc.originalName;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      showToast("error", error?.response?.data?.message || "Failed to download document");
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmDoc) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteRoomDocument(roomId, deleteConfirmDoc._id);
      setDocuments((prev) => prev.filter((d) => d._id !== deleteConfirmDoc._id));
      showToast("success", `"${deleteConfirmDoc.originalName}" was deleted.`);
      setDeleteConfirmDoc(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to delete document";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const activeViewFile = viewFile?.documentId === documentToView?._id ? viewFile : null;

  return (
    <div className="space-y-6">
      {/* ── TOAST NOTIFICATIONS ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── UPLOAD DRAG-AND-DROP ZONE ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
              isDragging ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            {uploading
              ? `Uploading ${uploadFileName}...`
              : "Drag and drop your documents here, or browse"}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Supports PDFs, images, text, presentations, spreadsheets, and archives up to 50MB.
          </p>

          {/* Progress Bar */}
          {uploading && uploadProgress !== null && (
            <div className="w-full max-w-xs mt-4">
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-150 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Browse File</span>
            </button>
          )}
        </div>
      </div>

      {/* ── DOCUMENTS TABLE OR EMPTY STATE ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Room Documents
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {documents.length} {documents.length === 1 ? "file" : "files"} shared with this room
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs text-gray-400">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-300">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No documents shared yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Files uploaded to this room will appear here for all participants to view and download.
            </p>
          </div>
        ) : (
          /* Documents Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Size
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Uploaded By
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Date
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {documents.map((doc) => {
                  const ext = (doc.originalName || "").split(".").pop()?.toUpperCase() || "FILE";
                  return (
                    <tr key={doc._id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Icon */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                            {getDocumentIcon(doc.mimeType, doc.originalName)}
                          </div>
                          <button
                            type="button"
                            onClick={() => setDocumentToView(doc)}
                            className="text-left text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate max-w-xs sm:max-w-md block"
                            title={doc.originalName}
                          >
                            {doc.originalName}
                          </button>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 font-mono">
                          {ext}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {formatSize(doc.size)}
                      </td>

                      {/* Uploaded By */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs text-gray-700 font-medium">
                        {getUploaderName(doc.uploaderId)}
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(doc.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => setDocumentToView(doc)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Preview file"
                            aria-label={`Preview ${doc.originalName}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download file"
                            aria-label={`Download ${doc.originalName}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmDoc(doc)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete file"
                            aria-label={`Delete ${doc.originalName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {documentToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                {getDocumentIcon(documentToView.mimeType, documentToView.originalName)}
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {documentToView.originalName}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(documentToView)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentToView(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-auto flex-1 bg-gray-50 flex items-center justify-center min-h-[300px]">
              {activeViewFile?.status === "loading" ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs text-gray-500">Preparing preview...</span>
                </div>
              ) : activeViewFile?.previewType === "image" && activeViewFile.url ? (
                <img
                  src={activeViewFile.url}
                  alt={documentToView.originalName}
                  className="max-h-[60vh] object-contain rounded-lg shadow-sm"
                />
              ) : activeViewFile?.previewType === "pdf" && activeViewFile.url ? (
                <iframe
                  src={activeViewFile.url}
                  title={documentToView.originalName}
                  className="w-full h-[65vh] rounded-lg border border-gray-200"
                />
              ) : activeViewFile?.previewType === "text" && activeViewFile.textContent ? (
                <pre className="w-full h-full max-h-[60vh] p-4 bg-white rounded-lg border border-gray-200 overflow-auto font-mono text-xs text-gray-800 whitespace-pre-wrap">
                  {activeViewFile.textContent}
                </pre>
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">
                    Preview not available for this file type
                  </p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">
                    Please download the file to view its full contents.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(documentToView)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmDoc)}
        title={deleteConfirmDoc ? `Delete "${deleteConfirmDoc.originalName}"?` : "Delete Document"}
        message={`Are you sure you want to permanently delete "${deleteConfirmDoc?.originalName}"? This action cannot be undone.`}
        confirmLabel="Delete File"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmDoc(null);
          setDeleteError(null);
        }}
        isLoading={isDeleting}
        isDanger
        error={deleteError}
      />
    </div>
  );
};

export default RoomDocuments;
