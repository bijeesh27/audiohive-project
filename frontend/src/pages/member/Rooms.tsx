import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_ROUTES } from "../../constants/Api_Routes";
import { getMemberRooms } from "../../services/roomServices";
import { useSocket } from "../../context/SocketContext";
import { RoomSearch } from "../../components/member/rooms/RoomSearch";
import { RoomFilters } from "../../components/member/rooms/RoomFilters";
import { RoomGrid } from "../../components/member/rooms/RoomGrid";
import { RoomCardSkeleton } from "../../components/member/rooms/RoomCardSkeleton";
import { EmptyState } from "../../components/member/rooms/EmptyState";
import type {
  MemberRoom,
  RoomTypeFilter,
  RoomSortOption,
  RoomTabCounts,
} from "../../types/rooms";

const DEFAULT_COUNTS: RoomTabCounts = { all: 0, public: 0, private: 0, live: 0 };
const PAGE_LIMIT = 12;

const Rooms: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();

  // Read URL state
  const qParam = searchParams.get("q") || "";
  const typeParam = (searchParams.get("type") as RoomTypeFilter) || "all";
  const sortParam = (searchParams.get("sort") as RoomSortOption) || "active";
  const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const [rooms, setRooms] = useState<MemberRoom[]>([]);
  const [counts, setCounts] = useState<RoomTabCounts>(DEFAULT_COUNTS);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to update search params while preserving other params
  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          Object.entries(newParams).forEach(([key, val]) => {
            if (val === null || val === "" || (key === "page" && val === "1") || (key === "type" && val === "all") || (key === "sort" && val === "active")) {
              updated.delete(key);
            } else {
              updated.set(key, val);
            }
          });
          return updated;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  // Fetch rooms from backend
  const fetchRooms = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      setError(null);

      try {
        const res = await getMemberRooms({
          q: qParam || undefined,
          type: typeParam,
          sort: sortParam,
          page: pageParam,
          limit: PAGE_LIMIT,
        });

        const data = res.data?.data || res.data;
        const fetchedRooms: MemberRoom[] = data.rooms || [];
        setRooms(fetchedRooms);
        setTotalPages(data.totalPages || 1);
        if (data.counts) {
          setCounts(data.counts);
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load rooms";
        setError(msg);
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [qParam, typeParam, sortParam, pageParam]
  );

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time updates via socket without a full refetch
  useEffect(() => {
    if (!socket) return;

    interface PresenceChangedPayload {
      roomId: string;
      participantCount: number;
      isLive: boolean;
      participants: { userId: string; username: string }[];
    }

    const handlePresenceChanged = (payload: PresenceChangedPayload) => {
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r.id === payload.roomId || r._id === payload.roomId) {
            return {
              ...r,
              isLive: payload.isLive,
              participantCount: payload.participantCount,
              participants: payload.participants,
            };
          }
          return r;
        })
      );

      // Update Live count in tabs
      setCounts((prev) => {
        const matchingRoom = rooms.find((r) => r.id === payload.roomId || r._id === payload.roomId);
        if (!matchingRoom) return prev;
        const wasLive = matchingRoom.isLive;
        const isNowLive = payload.isLive;
        if (wasLive === isNowLive) return prev;
        return {
          ...prev,
          live: Math.max(0, prev.live + (isNowLive ? 1 : -1)),
        };
      });
    };

    socket.on("room:presence-changed", handlePresenceChanged);
    return () => {
      socket.off("room:presence-changed", handlePresenceChanged);
    };
  }, [socket, rooms]);

  // Polling fallback every 30s while tab is visible
  const fetchRoomsRef = useRef(fetchRooms);
  fetchRoomsRef.current = fetchRooms;

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchRoomsRef.current(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = (roomId: string) => {
    navigate(API_ROUTES.MEMBER.NAV.ROOM_DETAIL(roomId));
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const isFilterActive = Boolean(qParam || typeParam !== "all");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">Rooms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join a conversation or browse rooms you have access to
          </p>
        </div>

        <RoomSearch
          initialValue={qParam}
          onSearchChange={(query) => updateParams({ q: query, page: "1" })}
        />
      </div>

      {/* 2. Filter Bar */}
      <RoomFilters
        currentTab={typeParam}
        currentSort={sortParam}
        counts={counts}
        onTabChange={(tab) => updateParams({ type: tab, page: "1" })}
        onSortChange={(sort) => updateParams({ sort, page: "1" })}
      />

      {/* 3. Main Content States */}
      {error ? (
        <EmptyState
          type="error"
          errorMessage={error}
          onRetry={() => fetchRooms()}
        />
      ) : loading ? (
        <RoomCardSkeleton count={6} />
      ) : rooms.length === 0 ? (
        <EmptyState
          type={isFilterActive ? "no-results" : "no-rooms"}
          searchQuery={qParam}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <RoomGrid
          rooms={rooms}
          currentPage={pageParam}
          totalPages={totalPages}
          onPageChange={(page) => updateParams({ page: String(page) })}
          onJoinRoom={handleJoinRoom}
          onCardClick={handleJoinRoom}
        />
      )}
    </div>
  );
};

export default Rooms;
