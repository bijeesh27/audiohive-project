export const SOCKET_EVENTS = {
  NEW_ANNOUNCEMENT: "new-announcement",
  PIN_ANNOUNCEMENT: "pin-announcement",
  DELETE_ANNOUNCEMENT: "delete-announcement",
  UNREAD_COUNT_UPDATE: "unread-count-update",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_PRESENCE_UPDATE: "room:presence-update",
  ROOM_GET_PRESENCE: "room:get-presence",
} as const;
