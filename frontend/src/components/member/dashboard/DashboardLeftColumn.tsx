import React from "react";
import { DoorOpen, Calendar, Video } from "lucide-react";
import type { ActiveRoom, UpcomingMeeting } from "../../../types/memberDashboard";
import { SectionCard } from "./SectionCard";
import { RoomItem } from "./RoomItem";
import { MeetingItem } from "./MeetingItem";
import { EmptyState } from "./EmptyState";
import { SectionItemsSkeleton } from "./DashboardSkeleton";

interface DashboardLeftColumnProps {
  loading: boolean;
  rooms: ActiveRoom[];
  roomsError: string | null;
  onRetryRooms: () => void;
  onNavigateRooms: () => void;
  onJoinRoom: (roomId: string) => void;
  meetings: UpcomingMeeting[];
  meetingsError: string | null;
  onRetryMeetings: () => void;
  onNavigateMeetings: () => void;
}

export const DashboardLeftColumn: React.FC<DashboardLeftColumnProps> = ({
  loading,
  rooms,
  roomsError,
  onRetryRooms,
  onNavigateRooms,
  onJoinRoom,
  meetings,
  meetingsError,
  onRetryMeetings,
  onNavigateMeetings,
}) => {
  return (
    <div className="space-y-6">
      {/* Active Rooms */}
      <SectionCard
        title="Active Rooms"
        icon={DoorOpen}
        badge={rooms.length > 0 ? rooms.length : undefined}
        actionText="View all rooms"
        onAction={onNavigateRooms}
        error={roomsError}
        onRetry={onRetryRooms}
      >
        {loading ? (
          <SectionItemsSkeleton count={3} />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No active rooms"
            description="There are currently no active rooms available in this workspace."
            actionLabel="Explore Rooms"
            onAction={onNavigateRooms}
          />
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <RoomItem key={room._id} room={room} onJoin={onJoinRoom} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Upcoming Meetings */}
      <SectionCard
        title="Upcoming Meetings"
        icon={Calendar}
        badge={meetings.length > 0 ? meetings.length : undefined}
        actionText="View all"
        onAction={onNavigateMeetings}
        error={meetingsError}
        onRetry={onRetryMeetings}
      >
        {loading ? (
          <SectionItemsSkeleton count={2} />
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No upcoming meetings"
            description="You have no meetings scheduled. Stay tuned for upcoming team discussions."
            actionLabel="Open Meetings"
            onAction={onNavigateMeetings}
          />
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingItem key={meeting._id} meeting={meeting} onJoin={onNavigateMeetings} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
