import React from "react";
import { Megaphone, MessageSquare } from "lucide-react";
import type {
  DashboardAnnouncement,
  RecentChatConversation,
  UserActivitySummary,
} from "../../../types/memberDashboard";
import { SectionCard } from "./SectionCard";
import { AnnouncementItem } from "./AnnouncementItem";
import { ChatActivityItem } from "./ChatActivityItem";
import { QuickActionsCard } from "./QuickActionsCard";
import { YourActivityCard } from "./YourActivityCard";
import { EmptyState } from "./EmptyState";
import { AnnouncementsSkeleton, RecentChatsSkeleton } from "./DashboardSkeleton";

interface DashboardRightColumnProps {
  loading: boolean;
  announcements: DashboardAnnouncement[];
  announcementsError: string | null;
  onRetryAnnouncements: () => void;
  onNavigateAnnouncements: () => void;
  recentChats: RecentChatConversation[];
  chatsError: string | null;
  onRetryChats: () => void;
  onNavigateChat: () => void;
  onOpenConversation: (id: string) => void;
  activity?: UserActivitySummary;
  onNavigateRooms: () => void;
  onNavigateMeetings: () => void;
}

export const DashboardRightColumn: React.FC<DashboardRightColumnProps> = ({
  loading,
  announcements,
  announcementsError,
  onRetryAnnouncements,
  onNavigateAnnouncements,
  recentChats,
  chatsError,
  onRetryChats,
  onNavigateChat,
  onOpenConversation,
  activity,
  onNavigateRooms,
  onNavigateMeetings,
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActionsCard
        onJoinRoom={onNavigateRooms}
        onViewMeetings={onNavigateMeetings}
        onOpenChat={onNavigateChat}
        onViewProfile={onNavigateRooms}
      />

      {/* Latest Announcements */}
      <SectionCard
        title="Latest Announcements"
        icon={Megaphone}
        actionText="View all"
        onAction={onNavigateAnnouncements}
        error={announcementsError}
        onRetry={onRetryAnnouncements}
      >
        {loading ? (
          <AnnouncementsSkeleton />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="No announcements posted yet in your workspace."
          />
        ) : (
          <div className="space-y-2.5">
            {announcements.map((ann) => (
              <AnnouncementItem
                key={ann._id}
                announcement={ann}
                onClick={onNavigateAnnouncements}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recent Chat Activity */}
      <SectionCard
        title="Recent Chat Activity"
        icon={MessageSquare}
        actionText="Open chat"
        onAction={onNavigateChat}
        error={chatsError}
        onRetry={onRetryChats}
      >
        {loading ? (
          <RecentChatsSkeleton />
        ) : recentChats.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No recent conversations"
            description="Direct message colleagues to start collaborating."
            actionLabel="Start a Chat"
            onAction={onNavigateChat}
          />
        ) : (
          <div className="space-y-2">
            {recentChats.map((chat) => (
              <ChatActivityItem
                key={chat.id}
                chat={chat}
                onClick={onOpenConversation}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Optional: Your Activity */}
      {activity && <YourActivityCard activity={activity} />}
    </div>
  );
};
