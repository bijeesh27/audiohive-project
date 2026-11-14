import React from "react";
import { useNavigate } from "react-router-dom";
import { DoorOpen, Video, MessageSquare, Megaphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_ROUTES } from "../../constants/Api_Routes";
import { useMemberDashboard } from "../../hooks/useMemberDashboard";
import { DashboardHeader } from "../../components/member/dashboard/DashboardHeader";
import { StatCard } from "../../components/member/dashboard/StatCard";
import { DashboardStatsSkeleton } from "../../components/member/dashboard/DashboardSkeleton";
import { DashboardLeftColumn } from "../../components/member/dashboard/DashboardLeftColumn";
import { DashboardRightColumn } from "../../components/member/dashboard/DashboardRightColumn";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useAuth();
  const {
    loading,
    organizationName,
    stats,
    rooms,
    roomsError,
    retryRooms,
    meetings,
    meetingsError,
    retryMeetings,
    announcements,
    announcementsError,
    retryAnnouncements,
    recentChats,
    chatsError,
    retryChats,
    activity,
  } = useMemberDashboard();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <DashboardHeader
        username={username}
        organizationName={organizationName}
      />

      {/* 2. Stats Row */}
      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Rooms Available"
            value={stats.roomsCount}
            icon={DoorOpen}
            helperText="Public & assigned rooms"
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            accentGradient={true}
            onClick={() => navigate(API_ROUTES.MEMBER.NAV.ROOMS)}
          />
          <StatCard
            label="Upcoming Meetings"
            value={stats.upcomingMeetingsCount}
            icon={Video}
            helperText="Scheduled for you"
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            onClick={() => navigate(API_ROUTES.MEMBER.NAV.MEETINGS)}
          />
          <StatCard
            label="Unread Messages"
            value={stats.unreadChatCount}
            icon={MessageSquare}
            helperText="Direct conversations"
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => navigate(API_ROUTES.MEMBER.NAV.CHAT)}
          />
          <StatCard
            label="Announcements"
            value={stats.unreadAnnouncementsCount}
            icon={Megaphone}
            helperText="Workspace updates"
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            onClick={() => navigate(API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS)}
          />
        </div>
      )}

      {/* 3. Main Grid (2/3 Left + 1/3 Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2">
          <DashboardLeftColumn
            loading={loading}
            rooms={rooms}
            roomsError={roomsError}
            onRetryRooms={retryRooms}
            onNavigateRooms={() => navigate(API_ROUTES.MEMBER.NAV.ROOMS)}
            onJoinRoom={(roomId) => navigate(API_ROUTES.MEMBER.NAV.ROOM_DETAIL(roomId))}
            meetings={meetings}
            meetingsError={meetingsError}
            onRetryMeetings={retryMeetings}
            onNavigateMeetings={() => navigate(API_ROUTES.MEMBER.NAV.MEETINGS)}
          />
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1">
          <DashboardRightColumn
            loading={loading}
            announcements={announcements}
            announcementsError={announcementsError}
            onRetryAnnouncements={retryAnnouncements}
            onNavigateAnnouncements={() => navigate(API_ROUTES.MEMBER.NAV.ANNOUNCEMENTS)}
            recentChats={recentChats}
            chatsError={chatsError}
            onRetryChats={retryChats}
            onNavigateChat={() => navigate(API_ROUTES.MEMBER.NAV.CHAT)}
            onOpenConversation={(id) => navigate(API_ROUTES.MEMBER.NAV.CHAT_CONVERSATION(id))}
            activity={activity}
            onNavigateRooms={() => navigate(API_ROUTES.MEMBER.NAV.ROOMS)}
            onNavigateMeetings={() => navigate(API_ROUTES.MEMBER.NAV.MEETINGS)}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
