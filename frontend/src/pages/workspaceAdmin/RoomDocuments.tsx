import React, { useEffect, useState, useRef, useMemo } from "react";
import { uploadRoomDocument, getRoomDocuments, deleteRoomDocument } from "../../services/documentServices";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { FileText, Download, UploadCloud, Loader2, Eye, Trash2 } from "lucide-react";

interface Document {
  _id: string;
  originalName: string;
  url: string;
  size: number;
  uploaderId: { _id: string; username: string };
  createdAt: string;
}

export const RoomDocuments = ({ roomId }: { roomId: string }) => {
  const { socket } = useSocket();
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [documentToView, setDocumentToView] = useState<Document | null>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadRoomDocument(roomId, file);
      // The socket event will append the file automatically
    } catch (error) {
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
      console.error("Delete failed", error);
      alert("Failed to delete document");
    } finally {
      setDeletingId(null);
      setDocumentToDelete(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

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
                    {formatSize(doc.size)} • by {doc.uploaderId.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDocumentToView(doc)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center"
                  title="View Document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <a 
                  href={`http://localhost:3000${doc.url}`} // Adjust base URL as needed
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </a>
                
                {currentUserId === doc.uploaderId._id && (
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
                <a
                  href={`http://localhost:3000${documentToView.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setDocumentToView(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-100 w-full h-full relative">
              <iframe
                src={`http://localhost:3000${documentToView.url}`}
                className="w-full h-full border-0 absolute inset-0"
                title={documentToView.originalName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};