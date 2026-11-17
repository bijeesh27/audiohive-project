import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Eye,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import type { RoomDocumentItem } from "../../../types/rooms";
import { formatFileSize, formatRelativeTime, formatAbsoluteTime } from "../../common/formatters";

interface DocumentRowProps {
  document: RoomDocumentItem;
  canManage: boolean;
  onPreview: (doc: RoomDocumentItem) => void;
  onDownload: (doc: RoomDocumentItem) => void;
  onRename: (doc: RoomDocumentItem) => void;
  onDelete: (doc: RoomDocumentItem) => void;
}

export const getDocumentIcon = (fileName: string, mimeType: string) => {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (["pdf"].includes(ext) || mimeType === "application/pdf") {
    return { icon: FileText, color: "text-rose-600 bg-rose-50" };
  }
  if (["doc", "docx"].includes(ext) || mimeType.includes("word")) {
    return { icon: FileText, color: "text-blue-600 bg-blue-50" };
  }
  if (["xls", "xlsx", "csv"].includes(ext) || mimeType.includes("sheet") || mimeType === "text/csv") {
    return { icon: FileSpreadsheet, color: "text-emerald-600 bg-emerald-50" };
  }
  if (["ppt", "pptx"].includes(ext) || mimeType.includes("presentation")) {
    return { icon: FileText, color: "text-orange-600 bg-orange-50" };
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext) || mimeType.startsWith("image/")) {
    return { icon: ImageIcon, color: "text-purple-600 bg-purple-50" };
  }
  if (["mp3", "wav", "ogg"].includes(ext) || mimeType.startsWith("audio/")) {
    return { icon: FileAudio, color: "text-amber-600 bg-amber-50" };
  }
  if (["mp4", "webm", "mov"].includes(ext) || mimeType.startsWith("video/")) {
    return { icon: FileVideo, color: "text-teal-600 bg-teal-50" };
  }
  return { icon: FileCode, color: "text-gray-600 bg-gray-50" };
};

export const DocumentRow: React.FC<DocumentRowProps> = ({
  document: docItem,
  canManage,
  onPreview,
  onDownload,
  onRename,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { icon: Icon, color } = getDocumentIcon(docItem.originalName, docItem.mimeType);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);
    return () => window.document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Safe uploader username
  const uploaderName =
    typeof docItem.uploaderId === "object" && docItem.uploaderId?.username
      ? docItem.uploaderId.username
      : "Former member";

  const uploaderInitial = uploaderName.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-gray-50/70 border-b border-gray-100 last:border-b-0 transition-colors gap-3">
      {/* File Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-xs sm:text-sm font-semibold text-gray-900 truncate tracking-tight hover:text-indigo-600 cursor-pointer"
            title={docItem.originalName}
            onClick={() => onPreview(docItem)}
          >
            {docItem.originalName}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            <span>{formatFileSize(docItem.size)}</span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
              <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                {uploaderInitial}
              </span>
              <span className="truncate">{uploaderName}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span title={formatAbsoluteTime(docItem.createdAt)}>{formatRelativeTime(docItem.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Row Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onPreview(docItem)}
          title="Preview file"
          aria-label="Preview file"
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDownload(docItem)}
          title="Download file"
          aria-label="Download file"
          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
        </button>

        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="More options"
              aria-label="More options"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white border border-gray-100 shadow-xl py-1 text-xs text-gray-700 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(docItem);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(docItem);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default DocumentRow;

