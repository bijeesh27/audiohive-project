import { useState } from "react";
import {
  LayoutDashboard,
  DoorOpen,
  Video,
  Calendar,
  MessageSquare,
  Megaphone,
  Settings,
  Users,
  Mic,
  MicOff,
  Headphones,
  Radio,
  Lock,
  ArrowRight,
  Search,
  Sparkles,
  Plus,
  Monitor,
  PenTool,
  BarChart3,
  TrendingUp,
  Clock,
  PhoneOff,
  Hand,
  CheckCircle2,
  Volume2,
} from "lucide-react";

export type PreviewTab = "dashboard" | "room" | "analytics";

export const DashboardPreview = () => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("dashboard");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const triggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 1800);
  };

  return (
    <div className="relative mx-auto mt-12 w-full max-w-6xl">
      {/* Decorative Glow Background */}
      <div className="absolute -inset-1 sm:-inset-2 rounded-3xl bg-gradient-to-r from-indigo-500/25 via-violet-500/25 to-fuchsia-500/25 blur-2xl opacity-75 sm:opacity-100 -z-10" />

      {/* Main Browser Mockup Window */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
        
        {/* Browser Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur-md">
          {/* Traffic Light Dots & Window Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400/90 transition-transform hover:scale-110" />
              <span className="h-3 w-3 rounded-full bg-amber-400/90 transition-transform hover:scale-110" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/90 transition-transform hover:scale-110" />
            </div>

            {/* URL Breadcrumb Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-2xs">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span className="font-mono text-slate-400">https://</span>
              <span className="font-medium text-slate-700">app.audiohive.io</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600 font-semibold">acme-corp</span>
            </div>
          </div>

          {/* Interactive Preview View Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-slate-200/70 p-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "dashboard"
                  ? "bg-white text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Workspace Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("room")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "room"
                  ? "bg-white text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-rose-500" />
              <span className="flex items-center gap-1">
                Live Audio Room
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "analytics"
                  ? "bg-white text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Live Audio Presence Status Badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Spatial Audio HD</span>
            <span className="text-emerald-400">•</span>
            <span className="font-semibold text-emerald-900">48kHz</span>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: WORKSPACE DASHBOARD VIEW
        ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col md:flex-row bg-[#F8FAFC] text-slate-800 min-h-[580px]">
            {/* Sidebar Mockup */}
            <aside className="w-full md:w-56 shrink-0 border-r border-slate-200 bg-white p-4 flex flex-col justify-between">
              <div>
                {/* Workspace Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-sm">
                      AH
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        Acme Virtual HQ
                        <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Design & Eng Teams</div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="mt-4 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Workspace
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-indigo-50/80 px-2.5 py-1.5 text-xs font-semibold text-indigo-700">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Dashboard</span>
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span>Audio Rooms</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                      3 Live
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Video className="h-3.5 w-3.5 text-slate-400" />
                      <span>Meetings</span>
                    </div>
                    <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">
                      2
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>Direct Chat</span>
                    </div>
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                      4
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                      <span>Announcements</span>
                    </div>
                  </div>
                </div>

                {/* Live Channels Section */}
                <div className="mt-5 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center justify-between">
                    <span>Active Voice</span>
                    <span className="text-[10px] text-emerald-600 font-bold">● 14 Online</span>
                  </div>
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-indigo-950">
                      <span className="flex items-center gap-1.5 truncate">
                        <Radio className="h-3 w-3 text-indigo-600 shrink-0" />
                        #design-sprint
                      </span>
                      <span className="text-[10px] text-indigo-600 font-bold">4 in call</span>
                    </div>
                    {/* Speaking visualizer mini wave */}
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="truncate">Alex is speaking...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Bottom Profile */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 font-bold text-white text-xs">
                        SC
                      </div>
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-semibold text-slate-900 truncate">Sarah Chen</div>
                      <div className="text-[10px] text-slate-400 truncate">Lead Designer</div>
                    </div>
                  </div>
                  <Settings className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                </div>
              </div>
            </aside>

            {/* Dashboard Main Content Area */}
            <main className="flex-1 p-4 sm:p-6 overflow-hidden">
              {/* Dashboard Sub-Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Thursday, Virtual Office Standup Day</span>
                  </div>
                  <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-slate-900">
                    Good morning,{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      Sarah
                    </span>{" "}
                    👋
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400 shadow-2xs">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span>Search rooms or teammates...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("room")}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Instant Room</span>
                  </button>
                </div>
              </div>

              {/* 4 Stat Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-indigo-100 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Active Rooms</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <DoorOpen className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">8 Rooms</div>
                  <div className="mt-0.5 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 3 with active audio
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Meetings Today</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <Video className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">3 Scheduled</div>
                  <div className="mt-0.5 text-[11px] text-indigo-600 font-medium">Next in 25 mins</div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Unread Chats</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">4 Messages</div>
                  <div className="mt-0.5 text-[11px] text-slate-500 font-medium">Design & Frontend</div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Colleagues Online</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">24 Active</div>
                  <div className="mt-0.5 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> 92% office presence
                  </div>
                </div>
              </div>

              {/* Main 2-Column Content Split */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left (2/3) Column: Active Live Rooms & Upcoming Meetings */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Live Rooms Card */}
                  <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Live Audio & Collaboration Rooms
                        </h3>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">
                        View All (8)
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {/* Room 1 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50/70 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                              DS
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                Design System & UX Huddle
                              </span>
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                                LIVE AUDIO
                              </span>
                              <span className="hidden sm:inline-flex rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-600">
                                #figma-sync
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span>4 speakers</span>
                              <span>•</span>
                              <div className="flex -space-x-1.5 overflow-hidden">
                                <span className="inline-block h-4 w-4 rounded-full bg-blue-500 text-[8px] font-bold text-white text-center leading-4 ring-1 ring-white">
                                  AK
                                </span>
                                <span className="inline-block h-4 w-4 rounded-full bg-purple-500 text-[8px] font-bold text-white text-center leading-4 ring-1 ring-white">
                                  ER
                                </span>
                                <span className="inline-block h-4 w-4 rounded-full bg-amber-500 text-[8px] font-bold text-white text-center leading-4 ring-1 ring-white">
                                  ML
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("room")}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-2xs hover:bg-indigo-700 transition-colors"
                        >
                          <Radio className="h-3 w-3" />
                          <span>Join</span>
                        </button>
                      </div>

                      {/* Room 2 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                            EN
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                Engineering Core Standup
                              </span>
                              <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-medium text-indigo-700">
                                <Lock className="inline h-2.5 w-2.5 mr-0.5" />
                                Private
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              5 developers • Screen sharing active
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("room")}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>Enter</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Room 3 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 font-bold text-xs">
                            WC
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                Virtual Watercooler Lounge
                              </span>
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-medium text-amber-800">
                                Casual Chat
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              3 listening to background lo-fi
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab("room")}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>Drop In</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Meeting Banner */}
                  <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/60 to-indigo-50/60 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs">
                        <Video className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Product Roadmap Review & Sprint 24
                        </div>
                        <div className="text-[11px] text-purple-700 font-medium flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>Today at 2:30 PM (starts in 25 min)</span>
                          <span>•</span>
                          <span>Stage Room A</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("room")}
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-purple-700 transition-colors"
                    >
                      Join Call
                    </button>
                  </div>
                </div>

                {/* Right (1/3) Column: Live Voice Feed & Quick Collaboration */}
                <div className="space-y-3">
                  {/* Realtime Audio Activity Feed */}
                  <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Radio className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Live Voice Stream</span>
                      </div>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-50/60">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="inline-block h-6 w-6 rounded-full bg-indigo-600 text-[10px] font-bold text-white text-center leading-6 ring-2 ring-emerald-400">
                              AK
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-[11px]">Alex Kim</div>
                            <div className="text-[10px] text-emerald-700">Speaking in #design-huddle</div>
                          </div>
                        </div>
                        {/* Audio equalizer wave visualizer */}
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="h-2 w-0.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="h-3.5 w-0.5 bg-emerald-600 rounded-full animate-bounce" />
                          <span className="h-2.5 w-0.5 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-6 w-6 rounded-full bg-purple-600 text-[10px] font-bold text-white text-center leading-6">
                            MV
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 text-[11px]">Marcus Vance</div>
                            <div className="text-[10px] text-slate-500">Speaking in #standup</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="h-3 w-0.5 bg-purple-500 rounded-full animate-pulse" />
                          <span className="h-1.5 w-0.5 bg-purple-400 rounded-full animate-pulse" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-6 w-6 rounded-full bg-slate-400 text-[10px] font-bold text-white text-center leading-6">
                            EL
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 text-[11px]">Elena Rostova</div>
                            <div className="text-[10px] text-slate-400">Muted • Listening</div>
                          </div>
                        </div>
                        <MicOff className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Team Announcement Banner */}
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Megaphone className="h-3.5 w-3.5 text-amber-600" />
                      <span>Workspace Update</span>
                    </div>
                    <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                      Spatial Audio 2.0 with noise cancellation is now enabled for all rooms.
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* =========================================================================
            TAB 2: LIVE AUDIO & COLLABORATION ROOM VIEW
        ========================================================================= */}
        {activeTab === "room" && (
          <div className="bg-slate-900 text-white p-4 sm:p-6 min-h-[580px] flex flex-col justify-between relative overflow-hidden">
            {/* Background Stage Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Room Stage Header */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 text-white shadow-lg">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Design System & UX Huddle</h3>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE (00:42:15)
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Spatial Stage #1</span>
                    <span>•</span>
                    <span>48kHz Ultra-HD Audio</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-medium">Noise Suppression Active</span>
                  </div>
                </div>
              </div>

              {/* Sub tabs in room */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1 text-xs">
                <span className="rounded bg-indigo-600 px-2.5 py-1 font-semibold text-white">
                  Audio Stage
                </span>
                <span className="rounded px-2.5 py-1 text-slate-400 hover:text-white cursor-pointer">
                  Whiteboard
                </span>
                <span className="rounded px-2.5 py-1 text-slate-400 hover:text-white cursor-pointer">
                  Documents (4)
                </span>
                <span className="rounded px-2.5 py-1 text-slate-400 hover:text-white cursor-pointer">
                  Room Chat
                </span>
              </div>
            </div>

            {/* Spatial Audio Stage & Participants */}
            <div className="relative z-10 my-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Participant 1: Alex Kim (Active Speaker) */}
              <div className="relative rounded-2xl border-2 border-emerald-500/80 bg-slate-800/80 p-5 shadow-xl backdrop-blur-md ring-4 ring-emerald-500/20 flex flex-col items-center text-center">
                <span className="absolute top-3 right-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  SPEAKING
                </span>
                <div className="relative mt-2">
                  <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-lg ring-4 ring-emerald-400/50">
                    AK
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900">
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-bold text-sm text-white">Alex Kim</div>
                  <div className="text-xs text-indigo-300">Product Designer (Host)</div>
                </div>

                {/* Animated Audio Equalizer Bars */}
                <div className="mt-3 flex items-center gap-1 h-4">
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-4" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-4" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-1.5" />
                </div>
              </div>

              {/* Participant 2: Sarah Chen (You) */}
              <div className="relative rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-lg backdrop-blur-md flex flex-col items-center text-center">
                <span className="absolute top-3 right-3 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300">
                  YOU
                </span>
                <div className="relative mt-2">
                  <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-600 text-white font-bold text-xl shadow-lg">
                    SC
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-slate-900 ${
                      isMicMuted ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                  >
                    {isMicMuted ? (
                      <MicOff className="h-3 w-3 text-white" />
                    ) : (
                      <Mic className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-bold text-sm text-white">Sarah Chen</div>
                  <div className="text-xs text-slate-400">
                    {isMicMuted ? "Microphone Muted" : "Microphone On"}
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                  <Headphones className="h-3 w-3 text-indigo-400" />
                  <span>Spatial Position: Center</span>
                </div>
              </div>

              {/* Participant 3: Elena Rostova (Screen Sharing) */}
              <div className="relative rounded-2xl border border-indigo-500/60 bg-slate-800/80 p-5 shadow-lg backdrop-blur-md flex flex-col items-center text-center">
                <span className="absolute top-3 right-3 rounded-full bg-indigo-500/30 px-2 py-0.5 text-[9px] font-bold text-indigo-300 flex items-center gap-1">
                  <Monitor className="h-2.5 w-2.5" /> SHARING
                </span>
                <div className="relative mt-2">
                  <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold text-xl shadow-lg">
                    ER
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-900">
                    <MicOff className="h-3 w-3 text-slate-300" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-bold text-sm text-white">Elena Rostova</div>
                  <div className="text-xs text-amber-300">Sharing &quot;Figma - AudioHive v2&quot;</div>
                </div>

                <div className="mt-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[10px] text-indigo-300 border border-slate-700">
                  Click to view shared screen
                </div>
              </div>

              {/* Participant 4: Marcus Vance (Listening) */}
              <div className="relative rounded-2xl border border-slate-700 bg-slate-800/60 p-5 shadow-lg backdrop-blur-md flex flex-col items-center text-center">
                <span className="absolute top-3 right-3 rounded-full bg-slate-700 px-2 py-0.5 text-[9px] font-medium text-slate-300">
                  LISTENER
                </span>
                <div className="relative mt-2">
                  <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white font-bold text-xl shadow-lg">
                    MV
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-900">
                    <MicOff className="h-3 w-3 text-slate-300" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-bold text-sm text-white">Marcus Vance</div>
                  <div className="text-xs text-slate-400">Headset Active</div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                  <Volume2 className="h-3 w-3 text-cyan-400" />
                  <span>Spatial Position: Right</span>
                </div>
              </div>
            </div>

            {/* Floating Reactions Float Animation */}
            {activeReaction && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 animate-bounce text-4xl bg-slate-800/90 rounded-2xl px-4 py-2 border border-slate-600 shadow-2xl">
                {activeReaction}
              </div>
            )}

            {/* Bottom In-Call Interactive Control Dock */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-3 shadow-2xl backdrop-blur-lg">
              {/* Left Audio Device Status */}
              <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Default Mic (AirPods Pro Max)</span>
              </div>

              {/* Central Audio Action Controls */}
              <div className="flex items-center gap-2 mx-auto">
                {/* Mic Mute Button */}
                <button
                  type="button"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isMicMuted
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                  title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Deafen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsDeafened(!isDeafened)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isDeafened
                      ? "bg-amber-500 text-white"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                  title="Deafen Audio"
                >
                  <Headphones className="h-5 w-5" />
                </button>

                {/* Share Screen */}
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                  title="Share Screen"
                >
                  <Monitor className="h-5 w-5 text-indigo-300" />
                </button>

                {/* Whiteboard */}
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                  title="Open Whiteboard"
                >
                  <PenTool className="h-5 w-5 text-purple-300" />
                </button>

                {/* Hand Raise */}
                <button
                  type="button"
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isHandRaised
                      ? "bg-amber-500 text-white ring-2 ring-amber-300"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                  title="Raise Hand"
                >
                  <Hand className="h-5 w-5" />
                </button>

                {/* Quick Emoji Reactions */}
                <div className="hidden sm:flex items-center gap-1 border-l border-slate-700 pl-2">
                  <button
                    type="button"
                    onClick={() => triggerReaction("👏")}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-sm transition-transform hover:scale-125"
                  >
                    👏
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerReaction("🔥")}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-sm transition-transform hover:scale-125"
                  >
                    🔥
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerReaction("❤️")}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-sm transition-transform hover:scale-125"
                  >
                    ❤️
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerReaction("🚀")}
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-sm transition-transform hover:scale-125"
                  >
                    🚀
                  </button>
                </div>

                {/* Leave Room CTA */}
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-semibold text-white transition-colors shadow-sm ml-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: TEAM & WORKSPACE ANALYTICS VIEW
        ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="bg-[#F8FAFC] text-slate-800 p-6 min-h-[580px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workspace Collaboration Intelligence</h3>
                <p className="text-xs text-slate-500">Live analytics for Acme Corp HQ (Past 30 days)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                  Last 30 Days
                </span>
              </div>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="text-xs font-medium text-slate-500">Total Voice Collaboration</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">1,480 Hours</div>
                <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> +24% vs previous month
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="text-xs font-medium text-slate-500">Average Daily Active Members</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">38 Teammates</div>
                <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> 94% retention rate
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="text-xs font-medium text-slate-500">Whiteboard & Canvas Sessions</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">142 Workshops</div>
                <div className="mt-1 text-xs text-indigo-600 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> 380 designs exported
                </div>
              </div>
            </div>

            {/* Visual Charts Preview */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hourly Room Activity Bar Chart Mockup */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 mb-3">
                  Peak Team Presence by Hour (UTC)
                </div>
                <div className="flex items-end justify-between gap-2 h-36 pt-4 border-b border-slate-100">
                  {[
                    { hour: "9a", h: "30%", count: 12 },
                    { hour: "10a", h: "65%", count: 26 },
                    { hour: "11a", h: "90%", count: 36 },
                    { hour: "12p", h: "55%", count: 22 },
                    { hour: "1p", h: "40%", count: 16 },
                    { hour: "2p", h: "95%", count: 38 },
                    { hour: "3p", h: "80%", count: 32 },
                    { hour: "4p", h: "70%", count: 28 },
                    { hour: "5p", h: "45%", count: 18 },
                  ].map((bar) => (
                    <div key={bar.hour} className="flex flex-col items-center flex-1 gap-1 h-full justify-end group">
                      <div
                        style={{ height: bar.h }}
                        className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-violet-500 transition-all duration-300 group-hover:from-indigo-700 group-hover:to-violet-600 relative"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-slate-800 text-white px-1 rounded shadow-xs">
                          {bar.count}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{bar.hour}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 text-center">
                  Peak overlap window: 11:00 AM & 2:00 PM
                </div>
              </div>

              {/* Room Utilization Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 mb-3">
                  Most Popular Team Rooms
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Design System Huddle", pct: 86, color: "bg-indigo-600", hours: "420 hrs" },
                    { name: "Engineering Core Standup", pct: 72, color: "bg-purple-600", hours: "354 hrs" },
                    { name: "Watercooler Lounge", pct: 54, color: "bg-amber-500", hours: "265 hrs" },
                    { name: "Executive Stage", pct: 38, color: "bg-emerald-500", hours: "185 hrs" },
                  ].map((room) => (
                    <div key={room.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">{room.name}</span>
                        <span className="text-slate-500 text-[11px]">{room.hours}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${room.color}`}
                          style={{ width: `${room.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Footer / Interactive Callout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-medium text-slate-700">Interactive Preview:</span>
            <span>Click the tabs above to explore the Dashboard, Live Room, and Analytics.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">Zero plugins needed • Browser-first</span>
          </div>
        </div>

      </div>
    </div>
  );
};
