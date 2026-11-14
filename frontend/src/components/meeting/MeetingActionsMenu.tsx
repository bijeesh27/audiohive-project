import React, { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Link as LinkIcon, Ban, Trash2, Check } from "lucide-react";

interface MeetingActionsMenuProps {
  meetingId: string;
  meetingCode: string;
  isCancelled: boolean;
  isCompleted: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export const MeetingActionsMenu: React.FC<MeetingActionsMenuProps> = ({
  meetingCode,
  isCancelled,
  isCompleted,
  onEdit,
  onCancel,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleCopyInviteLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/member/meetings?q=${meetingCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setIsOpen(false);
    }, 1500);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Meeting actions menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-gray-100 bg-white p-1 shadow-lg ring-1 ring-black/5 z-20 animate-fade-in"
        >
          {/* Edit (disabled if completed or cancelled) */}
          {!isCompleted && !isCancelled && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit meeting</span>
            </button>
          )}

          {/* Copy Invite Link */}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyInviteLink}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-600 font-semibold">Link copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                <span>Copy invite link</span>
              </>
            )}
          </button>

          {/* Cancel (if not cancelled yet) */}
          {!isCancelled && !isCompleted && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onCancel();
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cancel meeting</span>
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Delete meeting</span>
          </button>
        </div>
      )}
    </div>
  );
};

