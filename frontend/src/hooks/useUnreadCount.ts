import { useAnnouncementContext } from "../context/AnnouncementContext";

// Reads unreadCount from the global AnnouncementContext which is the
// single socket listener for announcement events. This avoids registering
// duplicate listeners that were causing the count to increment 3x per event.
export const useUnreadCount = () => {
  const { unreadCount } = useAnnouncementContext();
  return { unreadCount };
};
