import React from "react";
import { DoorOpen, Calendar, MessageSquare, UserCheck, Sparkles, ChevronRight } from "lucide-react";

interface QuickActionsCardProps {
  onJoinRoom: () => void;
  onViewMeetings: () => void;
  onOpenChat: () => void;
  onViewProfile?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onJoinRoom,
  onViewMeetings,
  onOpenChat,
  onViewProfile,
}) => {
  const actions = [
    {
      title: "Join a Room",
      description: "Jump into active audio channels",
      icon: DoorOpen,
      iconBg: "bg-indigo-50 text-indigo-600",
      onClick: onJoinRoom,
      highlight: true,
    },
    {
      title: "Upcoming Meetings",
      description: "Check schedule & join calls",
      icon: Calendar,
      iconBg: "bg-purple-50 text-purple-600",
      onClick: onViewMeetings,
    },
    {
      title: "Direct Messages",
      description: "Chat with teammates",
      icon: MessageSquare,
      iconBg: "bg-blue-50 text-blue-600",
      onClick: onOpenChat,
    },
    {
      title: "Workspace Profile",
      description: "View access & team details",
      icon: UserCheck,
      iconBg: "bg-emerald-50 text-emerald-600",
      onClick: onViewProfile || onJoinRoom,
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 min-h-[44px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">Quick Actions</h2>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              type="button"
              onClick={act.onClick}
              className={`group flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                act.highlight
                  ? "border-indigo-200/80 bg-gradient-to-r from-indigo-50/50 via-indigo-50/30 to-purple-50/30 hover:border-indigo-300 hover:from-indigo-50/80"
                  : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${act.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{act.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </section>
  );
};
