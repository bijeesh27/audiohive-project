import React from "react";
import { X, Download, FileText, Loader2 } from "lucide-react";
import type { RoomDocumentItem } from "../../../types/rooms";
import { formatFileSize } from "../../common/formatters";

interface FilePreviewModalProps {
  document: RoomDocumentItem | null;
  fileUrl?: string;
  isLoading: boolean;
  onClose: () => void;
  onDownload: (doc: RoomDocumentItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  document,
  fileUrl,
  isLoading,
  onClose,
  onDownload,
}) => {
  if (!document) return null;

  const ext = (document.originalName.split(".").pop() || "").toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext) || document.mimeType.startsWith("image/");
  const isPdf = ext === "pdf" || document.mimeType === "application/pdf";
  const isAudio = ["mp3", "wav", "ogg"].includes(ext) || document.mimeType.startsWith("audio/");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate max-w-md" title={document.originalName}>
                {document.originalName}
              </h3>
              <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(document)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 bg-gray-50 overflow-auto flex items-center justify-center p-4 min-h-[360px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading preview...</span>
            </div>
          ) : !fileUrl ? (
            <div className="text-center text-gray-500">
              <p className="text-sm">Unable to generate preview link.</p>
              <button
                type="button"
                onClick={() => onDownload(document)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold underline"
              >
                Download file directly
              </button>
            </div>
          ) : isImage ? (
            <img src={fileUrl} alt={document.originalName} className="max-h-[70vh] object-contain rounded-lg shadow-sm" />
          ) : isPdf ? (
            <iframe src={fileUrl} title={document.originalName} className="w-full h-[70vh] rounded-lg border-0 shadow-sm" />
          ) : isAudio ? (
            <div className="p-8 bg-white rounded-2xl shadow-sm text-center space-y-4">
              <audio controls src={fileUrl} className="w-full max-w-md">
                Your browser does not support audio element.
              </audio>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-sm">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-gray-800">Preview not available</h4>
              <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
                This file format cannot be previewed in the browser. Please download it to view.
              </p>
              <button
                type="button"
                onClick={() => onDownload(document)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download file</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FilePreviewModal;

