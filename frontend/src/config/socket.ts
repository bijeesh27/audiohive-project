import { io, Socket } from "socket.io-client";

const socket: Socket = io(
  import.meta.env.VITE_API_URL || "http://localhost:3000",
  {
    autoConnect: false,
    withCredentials: true,
  }
);

export const connectSocket = (token: string, workspaceId?: string) => {
  socket.auth = { token };
  if (workspaceId) {
    socket.io.opts.query = { workspaceId };
  }
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
