import React, { useEffect, useState, useRef, useMemo } from "react";
import { uploadRoomDocument, getRoomDocuments, getRoomDocumentFile, deleteRoomDocument } from "../../services/documentServices";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { FileText, Download, UploadCloud, Loader2, Eye, Trash2, ExternalLink } from "lucide-react";

interface Document {
  _id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploaderId?: { _id?: string; username?: string } | string | null;
  createdAt: string;
}

export type PreviewCategory = "image" | "pdf" | "text" | "video" | "audio" | "unsupported";

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
    default:
      return "application/octet-stream";
  }
};

export const getDocumentPreviewType = (mimeType?: string, fileName?: string): PreviewCategory => {
  const type = getEffectiveMimeType(mimeType, fileName);
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("text/") || type === "application/json" || type === "text/csv" || type === "text/markdown") return "text";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "unsupported";
};

const getUploaderName = (uploaderId?: { _id?: string; username?: string } | string | null) => {
  if (!uploaderId) return "Unknown";
  if (typeof uploaderId === "object") {
    return uploaderId.username || "Unknown";
  }
  return "Unknown";
};

const getUploaderId = (uploaderId?: { _id?: string; username?: string } | string | null) => {
  if (!uploaderId) return null;
  if (typeof uploaderId === "object") {
    return uploaderId._id || null;
  }
  return uploaderId;
};

export const RoomDocuments = ({ roomId }: { roomId: string }) => {
  const { socket } = useSocket();
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [documentToView, setDocumentToView] = useState<Document | null>(null);
  const [viewFile, setViewFile] = useState<{
    documentId: string;
    status: "loading" | "ready" | "error" | "unsupported";
    previewType: PreviewCategory;
    url?: string;
    textContent?: string;
    errorMessage?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = useMemo(() => {
    if (!accessToken) return null;
    try {
      const payload = accessToken.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded?.id || decoded?.userId || null;
    } catch {
      return null;
    }
  }, [accessToken]);

  useEffect(() => {
    getRoomDocuments(roomId)
      .then((res) => {
        setDocuments(res.data.data);
      })
      .finally(() => setLoading(false));

    const handleNewDocument = (newDoc: Document) => {
      setDocuments((prev) => [newDoc, ...prev]);
    };

    const handleDeleteDocument = (deletedId: string) => {
      setDocuments((prev) => prev.filter(doc => doc._id !== deletedId));
    };

    socket.on("room:new-document", handleNewDocument);
    socket.on("room:delete-document", handleDeleteDocument);

    return () => {
      socket.off("room:new-document", handleNewDocument);
      socket.off("room:delete-document", handleDeleteDocument);
    };
  }, [roomId, socket]);

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
        if (!downloadUrl) {
          throw new Error("No download URL returned from server");
        }

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
        // eslint-disable-next-line no-console
        console.error("Document preview failed", error);
        const errorMsg =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadRoomDocument(roomId, file);
      // The socket event will append the file automatically
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Upload failed", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      setDeletingId(documentId);
      await deleteRoomDocument(roomId, documentId);
      // The socket event will remove it from the list automatically
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete failed", error);
      alert("Failed to delete document");
    } finally {
      setDeletingId(null);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await getRoomDocumentFile(roomId, doc._id);
      const downloadUrl = response.data?.data?.downloadUrl;
      if (!downloadUrl) {
        throw new Error("Download URL could not be generated");
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = doc.originalName;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Document download failed", error);
      alert("Failed to download document");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const activeViewFile = viewFile?.documentId === documentToView?._id ? viewFile : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Room Resources
        </h2>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No documents have been shared yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc._id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] md:max-w-xs">{doc.originalName}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(doc.size)} • by {getUploaderName(doc.uploaderId)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setDocumentToView(doc);
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center"
                  title="View Document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                {currentUserId && getUploaderId(doc.uploaderId) === currentUserId && (
                  <button
                    onClick={() => setDocumentToDelete(doc._id)}
                    disabled={deletingId === doc._id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === doc._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Document</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(documentToDelete)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={deletingId !== null}
              >
                {deletingId === documentToDelete && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {documentToView && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setDocumentToView(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{documentToView.originalName}</h3>
                  <p className="text-xs text-gray-500">{formatSize(documentToView.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeViewFile?.url && (
                  <a
                    href={activeViewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDownload(documentToView)}
                  className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => setDocumentToView(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-50 w-full h-full relative overflow-auto flex items-center justify-center p-4">
              {!activeViewFile || activeViewFile.status === "loading" ? (
                <div className="flex flex-col items-center justify-center text-sm text-gray-500 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <span>Loading preview...</span>
                </div>
              ) : activeViewFile.status === "unsupported" ? (
                <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-base font-semibold text-gray-800 mb-1">Preview not available</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Preview is not supported for this file type ({documentToView.originalName.split('.').pop()?.toUpperCase() || "file"}). You can download it to view on your device.
                  </p>
                  <button
                    onClick={() => handleDownload(documentToView)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </button>
                </div>
              ) : activeViewFile.status === "error" ? (
                <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
                  <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-base font-semibold text-gray-800 mb-1">Unable to Load Preview</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {activeViewFile.errorMessage || "Could not retrieve the document file. Please try downloading it directly."}
                  </p>
                  <button
                    onClick={() => handleDownload(documentToView)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Instead
                  </button>
                </div>
              ) : activeViewFile.previewType === "image" ? (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={activeViewFile.url}
                    alt={documentToView.originalName}
                    className="max-h-full max-w-full object-contain rounded shadow-sm bg-white"
                  />
                </div>
              ) : activeViewFile.previewType === "text" ? (
                <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap">
                  {activeViewFile.textContent || "Empty file"}
                </div>
              ) : activeViewFile.previewType === "video" ? (
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    src={activeViewFile.url}
                    controls
                    className="max-h-full max-w-full rounded shadow"
                  />
                </div>
              ) : activeViewFile.previewType === "audio" ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white rounded-lg p-8 shadow-sm max-w-md my-auto">
                  <FileText className="w-16 h-16 text-indigo-500" />
                  <p className="text-sm font-medium text-gray-700">{documentToView.originalName}</p>
                  <audio src={activeViewFile.url} controls className="w-full" />
                </div>
              ) : activeViewFile.previewType === "pdf" ? (
                <div className="w-full h-full relative">
                  <object
                    data={activeViewFile.url}
                    type="application/pdf"
                    className="w-full h-full rounded border-0"
                  >
                    <iframe
                      src={activeViewFile.url}
                      className="w-full h-full border-0"
                      title={documentToView.originalName}
                    >
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-2">PDF preview could not be displayed directly.</p>
                        <a
                          href={activeViewFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 underline font-medium text-sm"
                        >
                          Open PDF in a new tab
                        </a>
                      </div>
                    </iframe>
                  </object>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
