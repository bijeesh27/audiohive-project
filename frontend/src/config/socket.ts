import { io, Socket } from "socket.io-client";

// Singleton — one socket connection for the entire app lifetime
const socket: Socket = io(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
  {
    autoConnect: false, // manually connect after login
    withCredentials: true,
  }
);

/**
 * Connect the socket with a JWT token.
 * Call this after the user successfully logs in.
 */
export const connectSocket = (token: string, workspaceId?: string) => {
  socket.auth = { token };
  if (workspaceId) {
    socket.io.opts.query = { workspaceId };
  }
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Disconnect the socket.
 * Call this on logout.
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
