import { createContext } from "react";

export interface DirectChatContextType {
  unreadCount: number;
  onlineUserIds: Set<string>;
  isUserOnline: (userId: string) => boolean;
  refreshUnreadCount: () => Promise<void>;
  decrementUnread: (by?: number) => void;
}

export const DirectChatContext = createContext<DirectChatContextType | null>(null);
