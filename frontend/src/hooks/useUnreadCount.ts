import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { getUnreadCount } from "../services/announcementServices";

export const useUnreadCount = () => {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getUnreadCount()
      .then((res) => {
        setUnreadCount(res.data.data?.unreadCount ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onNew = () => setUnreadCount((c) => c + 1);
    const onDelete = () => setUnreadCount((c) => Math.max(0, c - 1));

    socket.on("new-announcement", onNew);
    socket.on("delete-announcement", onDelete);

    return () => {
      socket.off("new-announcement", onNew);
      socket.off("delete-announcement", onDelete);
    };
  }, [socket]);

  return { unreadCount };
};
